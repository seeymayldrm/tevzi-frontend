// js/timeline.js

let timelineCache = [];
let shiftsCache = [];

// >>> BURASI YENİ — TÜRKİYE SAATİNE GÖRE BUGÜN TARİHİ <<<
function getTodayLocal() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

window.addEventListener("load", async () => {
    document.getElementById("tlDate").value = getTodayLocal();

    await loadShifts();
    await loadTimeline();
});
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

async function loadShifts() {
    try {
        const data = await api("/shifts");
        shiftsCache = data;

        const sel = document.getElementById("tlShift");
        sel.innerHTML = `<option value="">Tümü</option>`;
        data.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.code})`;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        alert("Vardiya listesi alınamadı: " + err.message);
    }
}

async function loadTimeline() {
    try {
        const date = document.getElementById("tlDate").value;
        const shiftId = document.getElementById("tlShift").value;

        if (!date) {
            alert("Lütfen tarih seç.");
            return;
        }

        // 1) Atamaları getir
        let url = `/assignments?date=${date}`;
        if (shiftId) url += `&shiftId=${shiftId}`;
        const assignments = await api(url);

        // 2) NFC loglarını getir
        const logs = await api(`/nfc/logs?date=${date}`);

        // 3) Her personel için IN/OUT saatlerini hesapla
        const scanMap = {};

        logs.forEach(l => {
            if (!l.personnel) return;

            const pid = l.personnel.id;

            const time = new Date(l.scannedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            });

            if (!scanMap[pid]) {
                scanMap[pid] = {
                    firstIn: "-",
                    lastOut: "-"
                };
            }

            if (l.type === "IN") {
                if (scanMap[pid].firstIn === "-" || time < scanMap[pid].firstIn) {
                    scanMap[pid].firstIn = time;
                }
            }

            if (l.type === "OUT") {
                if (scanMap[pid].lastOut === "-" || time > scanMap[pid].lastOut) {
                    scanMap[pid].lastOut = time;
                }
            }
        });

        // 4) Tabloyu yazdır
        timelineCache = assignments;
        const tbody = document.getElementById("tlTable");
        tbody.innerHTML = "";

        if (!assignments.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3">Kayıt yok.</td></tr>`;
            return;
        }

        assignments.forEach(a => {
            const pid = a.personnel?.id;
            const scan = scanMap[pid] || { firstIn: "-", lastOut: "-" };

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${date}</td>
                <td>${a.personnel?.fullName || "-"}</td>
                <td>${a.station?.name || "-"}</td>
                <td>${a.shift?.name || "-"}</td>
                <td>${scan.firstIn}</td>
                <td>${scan.lastOut}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert("Zaman çizelgesi alınamadı: " + err.message);
    }
}

function exportTimelineCsv() {
    if (!timelineCache.length) {
        alert("İndirilecek kayıt yok.");
        return;
    }

    const date = document.getElementById("tlDate").value;

    const rows = [];
    rows.push([
        "Sıra No",
        "Adı",
        "Soyadı",
        "Görev Tanımı",
        "Çalışılan Proje",
        "Yapılan İşin Tanımı",
        "Başlangıç Gün Saati",
        "Bitiş Saati",
        "Yevmiye",
        "Götürü"
    ]);

    api(`/nfc/logs?date=${date}`).then(logs => {

        const scanMap = {};

        logs.forEach(l => {
            if (!l.personnel) return;

            const pid = l.personnel.id;

            const dt = new Date(l.scannedAt);
            const tarih = dt.toLocaleDateString("tr-TR");
            const saat = dt.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            });
            const tam = `${tarih} ${saat}`;

            if (!scanMap[pid]) {
                scanMap[pid] = {
                    firstIn: null,
                    lastOut: null
                };
            }

            if (l.type === "IN") {
                if (!scanMap[pid].firstIn || tam < scanMap[pid].firstIn) {
                    scanMap[pid].firstIn = tam;
                }
            }

            if (l.type === "OUT") {
                if (!scanMap[pid].lastOut || tam > scanMap[pid].lastOut) {
                    scanMap[pid].lastOut = tam;
                }
            }
        });

        let index = 1;

        timelineCache.forEach(a => {
            const pid = a.personnel?.id;
            const fullName = a.personnel?.fullName || "";

            const parts = fullName.trim().split(" ");
            const lastName = parts.pop() || "";
            const firstName = parts.join(" ") || "";

            const scan = scanMap[pid] || {
                firstIn: "",
                lastOut: ""
            };

            rows.push([
                index++,
                firstName,
                lastName,
                a.personnel?.department || "",
                "",
                a.station?.name || "",
                scan.firstIn || "",
                scan.lastOut || "",
                "",
                ""
            ]);
        });

        const csv = rows
            .map(r => r.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(";"))
            .join("\r\n");

        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `puantaj_${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
