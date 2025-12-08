let assignmentsCache = [];
let stationsCache = [];
let selectedPersonnelId = null;
let assignedPersonnelIds = new Set();

window.addEventListener("load", async () => {
    document.getElementById("startTime").value = "07:00";
    document.getElementById("endTime").value = "17:00";

    startClock();

    await loadStations();
    await loadTodayAssignments();
    await loadScanList();
});

/* ----------------------------  
   0) Türkiye Saati İle Gün Başlangıcı
----------------------------- */
function todayISO() {
    const now = new Date();

    const tzOffset = now.getTimezoneOffset() * 60000;
    const turkey = new Date(now.getTime() - tzOffset + (3 * 60 * 60 * 1000));

    return turkey.toISOString().split("T")[0];
}

/* ----------------------------  
   1) Kart Okutanlar
----------------------------- */
async function loadScanList() {
    try {
        const logs = await api("/nfc/today");

        const scanListDiv = document.getElementById("scanList");
        scanListDiv.innerHTML = "";

        if (!logs.length) {
            scanListDiv.innerHTML = "Bugün kart okutan personel yok.";
            return;
        }

        const personMap = new Map();

        logs.forEach(l => {
            if (!l.personnel) return;

            // sadece IN olan ilk log
            let entry = logs.find(x => x.personnelId === l.personnelId && x.type === "IN");

            personMap.set(l.personnel.id, {
                ...l.personnel,
                entryTime: entry
                    ? new Date(entry.scannedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                    : "-"
            });
        });

        personMap.forEach(p => {
            const btn = document.createElement("button");

            const text = `${p.fullName} – ${p.department || "-"} – ${p.entryTime}`;

            if (assignedPersonnelIds.has(p.id)) {
                btn.className = "btn btn-secondary w-100 mb-2 text-start disabled";
                btn.textContent = text + " ✓";
            } else {
                btn.className = "btn btn-light w-100 mb-2 text-start";
                btn.textContent = text;
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

/* ----------------------------  
   2) İstasyon Yükle
----------------------------- */
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

/* ----------------------------  
   3) Bugünkü Atamaları Yükle
----------------------------- */
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
            // FRONTEND ÜZERİNDE START/END'e OVERRIDE UYGULUYORUZ
            const local = window.localAssignmentOverride?.[a.id] || {};

            const start = local.start || a.shift?.startTime || "-";
            const end = local.end || a.shift?.endTime || "-";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.personnel?.fullName || "-"}</td>
                <td>${a.station?.name || "-"}</td>
                <td>${start}</td>
                <td>${end}</td>
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

/* ----------------------------  
   4) İş Ata
----------------------------- */
window.localAssignmentOverride = {};

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
        const shiftId = 1; // backend böyle çalışıyor (dokunmuyoruz)

        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;

        const body = {
            date: todayISO(),
            shiftId,
            stationId,
            personnelId: selectedPersonnelId
        };

        const created = await api("/assignments", "POST", body);

        // SADECE FRONTEND'DE GÖRÜNEN START-END OVERRIDE
        window.localAssignmentOverride[created.id] = {
            start: startTime,
            end: endTime
        };

        alert("İş başarıyla atandı.");

        await loadTodayAssignments();
        await loadScanList();

    } catch (err) {
        alert("İş ataması yapılamadı: " + err.message);
    }
}
