// js/tevzi.js

let assignmentsCache = [];
let stationsCache = [];
let selectedPersonnelId = null;
let assignedPersonnelIds = new Set(); // Bugün atanmış personeller

window.addEventListener("load", async () => {
    document.getElementById("startTime").value = "07:00";
    document.getElementById("endTime").value = "17:00";

    startClock(); // canlı tarih saat

    await loadStations();
    await loadTodayAssignments();
    await loadScanList();
});

/* -----------------------------------------
   0) CANLI TARİH – SAAT
------------------------------------------ */
function startClock() {
    const clock = document.getElementById("liveClock");
    setInterval(() => {
        const d = new Date();
        const formatted =
            d.toLocaleDateString("tr-TR") + " " +
            d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

        clock.textContent = formatted;
    }, 1000);
}

/* -----------------------------------------
   1) Kart Okutan Personelleri Listele
------------------------------------------ */
async function loadScanList() {
    try {
        const logs = await api("/nfc/today");

        const scanListDiv = document.getElementById("scanList");
        scanListDiv.innerHTML = "";

        if (!logs.length) {
            scanListDiv.innerHTML = "Bugün kart okutan personel yok.";
            return;
        }

        const personSet = new Map();

        logs.forEach(l => {
            if (!l.personnel) return;
            personSet.set(l.personnel.id, l.personnel);
        });

        personSet.forEach(p => {
            const btn = document.createElement("button");

            // Eğer bugün bu personel zaten iş aldıysa gri + disable
            if (assignedPersonnelIds.has(p.id)) {
                btn.className = "btn btn-secondary w-100 mb-2 text-start disabled";
                btn.textContent = p.fullName + " ✓ (Atandı)";
            } else {
                btn.className = "btn btn-light w-100 mb-2 text-start";
                btn.textContent = p.fullName;
                btn.onclick = () => selectPersonnel(p.id, btn);
            }

            scanListDiv.appendChild(btn);
        });

    } catch (err) {
        console.error(err);
        alert("Kart okutan personeller alınamadı: " + err.message);
    }
}

function selectPersonnel(id, btn) {
    if (assignedPersonnelIds.has(id)) return;

    selectedPersonnelId = id;

    document.querySelectorAll("#scanList button").forEach(b => {
        if (!b.classList.contains("disabled")) {
            b.classList.remove("btn-primary");
            b.classList.add("btn-light");
        }
    });

    btn.classList.remove("btn-light");
    btn.classList.add("btn-primary");
}

/* -----------------------------------------
   2) İstasyonları Yükle
------------------------------------------ */
async function loadStations() {
    try {
        const stations = await api("/stations");
        stationsCache = stations;

        const select = document.getElementById("stationSelect");
        select.innerHTML = "";

        stations.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.code})`;
            select.appendChild(opt);
        });
    } catch (err) {
        alert("İstasyon listesi alınamadı: " + err.message);
    }
}

/* -----------------------------------------
   Bugünün ISO tarihi
------------------------------------------ */
function todayISO() {
    return new Date().toISOString().split("T")[0];
}

/* -----------------------------------------
   3) Bugünkü Atamaları Yükle + işaretleme
------------------------------------------ */
async function loadTodayAssignments() {
    try {
        const date = todayISO();
        const data = await api(`/assignments?date=${date}`);

        assignmentsCache = data;
        assignedPersonnelIds = new Set(data.map(a => a.personnelId));

        const tbody = document.getElementById("assignmentTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-3">
                        Bugün için atanmış iş yok.
                    </td>
                </tr>`;
            await loadScanList();
            return;
        }

        data.forEach(a => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.personnel?.fullName || "-"}</td>
                <td>${a.station?.name || "-"}</td>
                <td>${a.shift?.startTime || "-"}</td>
                <td>${a.shift?.endTime || "-"}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger"
                        onclick="deleteAssignment(${a.id})">Sil</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        await loadScanList();

    } catch (err) {
        alert("İş atamaları alınamadı: " + err.message);
    }
}

/* -----------------------------------------
   4) İş Atama
------------------------------------------ */
async function assignJob() {
    try {
        if (!selectedPersonnelId) {
            alert("Lütfen kart okutan bir personel seçiniz!");
            return;
        }

        if (assignedPersonnelIds.has(selectedPersonnelId)) {
            alert("Bu personel bugün zaten iş aldı!");
            return;
        }

        const stationId = Number(document.getElementById("stationSelect").value);

        const shiftId = 1; // geçici

        const body = {
            date: todayISO(),
            shiftId,
            stationId,
            personnelId: selectedPersonnelId
        };

        await api("/assignments", "POST", body);

        alert("İş başarıyla atandı.");

        await loadTodayAssignments();
        await loadScanList();

    } catch (err) {
        alert("İş ataması yapılamadı: " + err.message);
    }
}

/* -----------------------------------------
   5) Silme
------------------------------------------ */
async function deleteAssignment(id) {
    if (!confirm("Bu atamayı silmek istiyor musun?")) return;

    try {
        await api(`/assignments/${id}`, "DELETE");
        await loadTodayAssignments();
    } catch (err) {
        alert("Silme işlemi başarısız: " + err.message);
    }
}

/* -----------------------------------------
   6) CSV Export (UTF-8 BOM)
------------------------------------------ */
function exportAssignmentsCsv() {
    if (!assignmentsCache.length) {
        alert("İndirilecek atama yok.");
        return;
    }

    const date = todayISO();
    const rows = [];
    rows.push([
        "Tarih",
        "Personel",
        "İstasyon",
        "Vardiya",
        "Başlangıç",
        "Bitiş"
    ]);

    assignmentsCache.forEach(a => {
        rows.push([
            date,
            a.personnel?.fullName || "",
            a.station?.name || "",
            a.shift?.name || "",
            a.shift?.startTime || "",
            a.shift?.endTime || ""
        ]);
    });

    const csv = rows
        .map(r => r.map(v => `"${(v ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\r\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tevzi_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
