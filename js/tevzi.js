let assignmentsCache = [];
let stationsCache = [];
let scanList = [];
let filteredScanList = [];

let selectedPersonnelIds = new Set();

window.addEventListener("load", async () => {
    document.getElementById("startTime").value = "07:00";
    document.getElementById("endTime").value = "19:00";

    startClock();
    await loadStations();
    await loadTodayAssignments();
    await loadScanList();

    document.getElementById("filterName").addEventListener("input", applyFilters);
    document.getElementById("filterDept").addEventListener("input", applyFilters);
});

/* -----------------------------------------
   BUGÜN
----------------------------------------- */
function todayISO() {
    const d = new Date();
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
            d.toLocaleDateString("tr-TR") + " " +
            d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }, 1000);
}

/* -----------------------------------------
   1) BUGÜN KART OKUTANLAR
----------------------------------------- */
async function loadScanList() {
    try {
        const logs = await api("/nfc/today");
        const tbody = document.getElementById("scanTableBody");
        tbody.innerHTML = "";

        if (!logs.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-2">Bugün kart okutan personel yok.</td></tr>`;
            return;
        }

        const map = new Map();

        logs.forEach(l => {
            if (!l.personnel) return;

            const entry = logs.find(x =>
                x.personnelId === l.personnelId && x.type === "IN"
            );

            map.set(l.personnel.id, {
                ...l.personnel,
                entryTime: entry ? entry.scannedAt.slice(11, 16) : "-"
            });
        });

        scanList = Array.from(map.values());
        applyFilters();

    } catch (err) {
        alert("Kart okuma listesi alınamadı.");
    }
}

/* -----------------------------------------
   1.1) Filtreleme
----------------------------------------- */
function applyFilters() {
    const nameF = document.getElementById("filterName").value.toLowerCase();
    const deptF = document.getElementById("filterDept").value.toLowerCase();

    filteredScanList = scanList.filter(p =>
        p.fullName.toLowerCase().includes(nameF) &&
        (p.department || "-").toLowerCase().includes(deptF)
    );

    renderScanTable();
}

/* -----------------------------------------
   1.2) Tablo Render
----------------------------------------- */
function renderScanTable() {
    const tbody = document.getElementById("scanTableBody");
    tbody.innerHTML = "";

    if (!filteredScanList.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-2 text-center">Sonuç bulunamadı.</td></tr>`;
        return;
    }

    filteredScanList.forEach(p => {
        const tr = document.createElement("tr");

        const isAssigned = assignedPersonnelIds.has(p.id);
        const isSelected = selectedPersonnelIds.has(p.id);

        // atanmışsa asla checked gösterme
        const checked = (!isAssigned && isSelected) ? "checked" : "";
        const disabled = isAssigned ? "disabled" : "";
        const rowClass = isAssigned ? "assigned-row" : "";

        tr.className = rowClass;

        tr.innerHTML = `
            <td>
                <input type="checkbox" ${checked} ${disabled}
                    onchange="toggleSelect(${p.id}, this)">
            </td>
            <td>${p.fullName}</td>
            <td>${p.department || "-"}</td>
            <td>${p.entryTime}</td>
        `;

        tbody.appendChild(tr);
    });
}

/* -----------------------------------------
   1.3) Tekli seçim
----------------------------------------- */
function toggleSelect(id, checkbox) {
    if (checkbox.checked) selectedPersonnelIds.add(id);
    else selectedPersonnelIds.delete(id);
}

/* -----------------------------------------
   1.4) Tümünü seç (atanmamış olanları)
----------------------------------------- */
function selectAllFiltered() {
    filteredScanList.forEach(p => {
        if (!assignedPersonnelIds.has(p.id)) {
            selectedPersonnelIds.add(p.id);
        }
    });
    renderScanTable();
}

/* -----------------------------------------
   1.5) Tümünü temizle
----------------------------------------- */
function clearAllSelected() {
    selectedPersonnelIds.clear();
    renderScanTable();
}

/* -----------------------------------------
   1.6) Header checkbox select
----------------------------------------- */
function toggleSelectAll(checkbox) {
    if (checkbox.checked) selectAllFiltered();
    else clearAllSelected();
}

/* -----------------------------------------
   2) İSTASYONLAR
----------------------------------------- */
async function loadStations() {
    try {
        const stations = await api("/stations?active=true");
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

        // seçili listeden atanmışları temizle
        selectedPersonnelIds.forEach(id => {
            if (assignedPersonnelIds.has(id)) {
                selectedPersonnelIds.delete(id);
            }
        });

        const tbody = document.getElementById("assignmentTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-3 text-center">Bugün iş yok.</td></tr>`;
            await loadScanList();
            return;
        }

        data.forEach(a => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${a.personnel?.fullName || "-"}</td>
                <td>${a.station?.name || "-"}</td>
                <td>${a.startTime || "-"}</td>
                <td>${a.endTime || "-"}</td>
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
   4) İŞ ATA (çoklu)
----------------------------------------- */
async function assignJob() {
    try {
        if (selectedPersonnelIds.size === 0) {
            alert("Lütfen en az bir personel seçin!");
            return;
        }

        const stationId = Number(document.getElementById("stationSelect").value);
        const shiftId = 1;

        const start = document.getElementById("startTime").value;
        const end = document.getElementById("endTime").value;

        for (let id of selectedPersonnelIds) {
            if (assignedPersonnelIds.has(id)) continue;

            const body = {
                date: todayISO(),
                shiftId,
                stationId,
                personnelId: id,
                startTime: start,
                endTime: end
            };

            await api("/assignments", "POST", body);
        }

        alert("İş ataması tamamlandı!");

        selectedPersonnelIds.clear();

        await loadTodayAssignments();
        await loadScanList();

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

    await loadTodayAssignments();
}
