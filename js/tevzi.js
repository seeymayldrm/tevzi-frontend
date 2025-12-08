let assignmentsCache = [];
let stationsCache = [];
let selectedPersonnelId = null;
let assignedPersonnelIds = new Set();

// FRONTEND ÜSTÜNDE SAAT OVERRIDE
window.localAssignmentOverride = {};

window.addEventListener("load", async () => {
    document.getElementById("startTime").value = "07:00";
    document.getElementById("endTime").value = "17:00";

    startClock();
    await loadStations();
    await loadTodayAssignments();
    await loadScanList();
});

/* -----------------------------------------
   BUGÜN (TRLİ OLMASINA GEREK YOK)
----------------------------------------- */
function todayISO() {
    const d = new Date(); // TR'deki saat backend'de kaydediliyor
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/* -----------------------------------------
   CANLI SAAT
----------------------------------------- */
function startClock() {
    const clock = document.getElementById("liveClock");
    setInterval(() => {
        const d = new Date();
        clock.textContent =
            d.toLocaleDateString("tr-TR") +
            " " +
            d.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            });
    }, 1000);
}

/* -----------------------------------------
   1) BUGÜN KART OKUTANLAR
----------------------------------------- */
async function loadScanList() {
    try {
        const logs = await api("/nfc/today"); // backend TR saatine göre getiriyor
        const div = document.getElementById("scanList");
        div.innerHTML = "";

        if (!logs.length) {
            div.innerHTML = "Bugün kart okutan personel yok.";
            return;
        }

        const map = new Map();

        logs.forEach(l => {
            if (!l.personnel) return;

            const entry = logs.find(
                x => x.personnelId === l.personnelId && x.type === "IN"
            );

            map.set(l.personnel.id, {
                ...l.personnel,

                // 🔥 DB'deki TR tarihinin saat kısmını direkt alıyoruz
                entryTime: entry ? entry.scannedAt.slice(11, 16) : "-"
            });
        });

        map.forEach(p => {
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

            div.appendChild(btn);
        });

    } catch (err) {
        alert("Kart okuma listesi alınamadı.");
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

    btn.classList.add("btn-primary");
}

/* -----------------------------------------
   2) İSTASYONLAR
----------------------------------------- */
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
        alert("İstasyon listesi alınamadı!");
    }
}

/* -----------------------------------------
   3) BUGÜNKÜ ATAMALAR
----------------------------------------- */
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
                <tr><td colspan="5" class="py-3 text-center">Bugün iş yok.</td></tr>
            `;
            await loadScanList();
            return;
        }

        data.forEach(a => {
            const override = window.localAssignmentOverride[a.id] || {};
            const start = override.start || a.shift?.startTime || "-";
            const end = override.end || a.shift?.endTime || "-";

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
        alert("İş atamaları alınamadı.");
    }
}

/* -----------------------------------------
   4) İŞ ATA
----------------------------------------- */
async function assignJob() {
    try {
        if (!selectedPersonnelId) {
            alert("Lütfen personel seçin!");
            return;
        }

        if (assignedPersonnelIds.has(selectedPersonnelId)) {
            alert("Bu personel bugün zaten iş aldı!");
            return;
        }

        const stationId = Number(document.getElementById("stationSelect").value);
        const shiftId = 1;

        const start = document.getElementById("startTime").value;
        const end = document.getElementById("endTime").value;

        const body = {
            date: todayISO(),
            shiftId,
            stationId,
            personnelId: selectedPersonnelId
        };

        const saved = await api("/assignments", "POST", body);

        window.localAssignmentOverride[saved.id] = { start, end };

        await loadTodayAssignments();
        await loadScanList();

        alert("İş atandı!");

    } catch (err) {
        alert("İş atanamadı.");
    }
}

/* -----------------------------------------
   5) ATAMA SİL
----------------------------------------- */
async function deleteAssignment(id) {
    if (!confirm("Silinsin mi?")) return;

    await api(`/assignments/${id}`, "DELETE");

    delete window.localAssignmentOverride[id];

    await loadTodayAssignments();
}
