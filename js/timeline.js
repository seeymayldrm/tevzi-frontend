// js/timeline.js

let timelineCache = [];
let shiftsCache = [];

window.addEventListener("load", async () => {
    const d = new Date().toISOString().split("T")[0];
    document.getElementById("tlDate").value = d;

    await loadShifts();
    await loadTimeline();
});

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
        "Tarih",
        "Personel",
        "İstasyon",
        "Vardiya",
        "İlk Giriş (IN)",
        "Son Çıkış (OUT)"
    ]);

    // CSV doldurma için IN/OUT hesaplamayı tekrar yapıyoruz:
    // Çünkü timelineCache sadece assignment veriyor.
    // IN/OUT zaten tabloya yazılmıştı ama CSV için de aynı şekilde hesaplamak zorundayız.

    // CBC (çek—birleş—çıkartma)
    // logs'u burada tekrar çekmek yerine loadTimeline() içinde saklayabilirdik 
    // ama basitlik açısından tekrar çekelim.

    api(`/nfc/logs?date=${date}`).then(logs => {
        const scanMap = {};

        logs.forEach(l => {
            if (!l.personnel) return;

            const pid = l.personnel.id;
            const time = new Date(l.scannedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            });

            if (!scanMap[pid]) {
                scanMap[pid] = { firstIn: "-", lastOut: "-" };
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

        timelineCache.forEach(a => {
            const pid = a.personnel?.id;
            const scan = scanMap[pid] || { firstIn: "-", lastOut: "-" };

            rows.push([
                date,
                a.personnel?.fullName || "",
                a.station?.name || "",
                a.shift?.name || "",
                scan.firstIn,
                scan.lastOut
            ]);
        });

        // CSV oluşturma (TÜRKÇE KARAKTER DESTEKLİ — UTF-8 BOM)
        const csv = rows
            .map(r => r.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(";"))
            .join("\r\n");

        const BOM = "\uFEFF"; // UTF-8 BOM
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
