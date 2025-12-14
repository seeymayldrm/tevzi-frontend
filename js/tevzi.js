let assignmentsCache = [];
let stationsCache = [];
let scanList = [];
let filteredScanList = [];
let departmentsCache = [];

let selectedPersonnelIds = new Set();
let assignedPersonnelIds = new Set();

window.addEventListener("load", async () => {

    /* -----------------------------------------
       0) ŞİRKET BİLGİLERİ
    ------------------------------------------ */
    const cname = localStorage.getItem("companyName");
    const clogo = localStorage.getItem("companyLogo");
    const cfavicon = localStorage.getItem("companyFavicon");

    if (document.getElementById("companyName") && cname)
        document.getElementById("companyName").innerText = cname;

    if (document.getElementById("companyLogo") && clogo)
        document.getElementById("companyLogo").src = clogo;

    if (document.getElementById("faviconTag") && cfavicon)
        document.getElementById("faviconTag").href = cfavicon;

    /* -----------------------------------------
       DEFAULT SAATLER
    ------------------------------------------ */
    document.getElementById("startTime").value = "07:00";
    document.getElementById("endTime").value = "19:00";

    startClock();

    // 🔥 SIRA ÖNEMLİ
    await loadDepartments();
    await loadStations();
    await loadTodayAssignments();
    await loadScanList();

    document.getElementById("filterName")
        .addEventListener("input", applyFilters);

    document.getElementById("filterDept")
        .addEventListener("change", applyFilters);
});

/* -----------------------------------------
   BUGÜN
----------------------------------------- */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
   DEPARTMANLAR (AKTİF)
----------------------------------------- */
async function loadDepartments() {
    try {
        const depts = await api("/departments?active=true");
        departmentsCache = depts;

        const select = document.getElementById("filterDept");
        select.innerHTML = `<option value="">Tüm Departmanlar</option>`;

        depts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Departmanlar yüklenemedi", err);
    }
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
            tbody.innerHTML =
                `<tr><td colspan="4" class="text-center py-2">Bugün kart okutan personel yok.</td></tr>`;
            scanList = [];
            filteredScanList = [];
            return;
        }

        const map = new Map();

        logs.forEach(l => {
            if (!l.personnel) return;

            const entry = logs.find(x =>
                x.personnelId === l.personnelId && x.type === "IN"
            );

            map.set(l.personnel.id, {
                id: l.personnel.id,
                fullName: l.personnel.fullName,
                departmentId: l.personnel.departmentRel?.id || null,
                departmentName: l.personnel.departmentRel?.name || "-",
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
   1.1) FİLTRELEME
----------------------------------------- */
function applyFilters() {
    const nameF = document.getElementById("filterName").value.toLowerCase();
    const deptId = document.getElementById("filterDept").value;

    filteredScanList = scanList.filter(p => {
        const nameOk = p.fullName.toLowerCase().includes(nameF);
        const deptOk = !deptId || String(p.departmentId) === deptId;
        return nameOk && deptOk;
    });

    renderScanTable();
}

/* -----------------------------------------
   1.2) TABLO RENDER
----------------------------------------- */
function renderScanTable() {
    const tbody = document.getElementById("scanTableBody");
    tbody.innerHTML = "";

    if (!filteredScanList.length) {
        tbody.innerHTML =
            `<tr><td colspan="4" class="py-2 text-center">Sonuç bulunamadı.</td></tr>`;
        return;
    }

    filteredScanList.forEach(p => {
        const tr = document.createElement("tr");

        const isAssigned = assignedPersonnelIds.has(p.id);
        const isSelected = selectedPersonnelIds.has(p.id);

        tr.className = isAssigned ? "assigned-row" : "";

        tr.innerHTML = `
            <td>
                <input type="checkbox"
                    ${(!isAssigned && isSelected) ? "checked" : ""}
                    ${isAssigned ? "disabled" : ""}
                    onchange="toggleSelect(${p.id}, this)">
            </td>
            <td>${p.fullName}</td>
            <td>${p.departmentName}</td>
            <td>${p.entryTime}</td>
        `;

        tbody.appendChild(tr);
    });
}

/* -----------------------------------------
   1.3) TEKLİ SEÇİM
----------------------------------------- */
function toggleSelect(id, checkbox) {
    checkbox.checked
        ? selectedPersonnelIds.add(id)
        : selectedPersonnelIds.delete(id);
}

/* -----------------------------------------
   1.4) TÜMÜNÜ SEÇ
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
   1.5) TÜMÜNÜ TEMİZLE
----------------------------------------- */
function clearAllSelected() {
    selectedPersonnelIds.clear();
    renderScanTable();
}

/* -----------------------------------------
   1.6) HEADER CHECKBOX
----------------------------------------- */
function toggleSelectAll(checkbox) {
    checkbox.checked ? selectAllFiltered() : clearAllSelected();
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

    } catch {
        alert("İstasyon listesi alınamadı!");
    }
}

/* -----------------------------------------
   3) BUGÜNKÜ ATAMALAR
----------------------------------------- */
async function loadTodayAssignments() {
    try {
        const data = await api(`/assignments?date=${todayISO()}`);

        assignmentsCache = data;
        assignedPersonnelIds = new Set(data.map(a => a.personnelId));

        selectedPersonnelIds.forEach(id => {
            if (assignedPersonnelIds.has(id)) selectedPersonnelIds.delete(id);
        });

        const tbody = document.getElementById("assignmentTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML =
                `<tr><td colspan="5" class="py-3 text-center">Bugün iş yok.</td></tr>`;
            await loadScanList();
            return;
        }

        data.forEach(a => {
            tbody.innerHTML += `
                <tr>
                    <td>${a.personnel?.fullName || "-"}</td>
                    <td>${a.station?.name || "-"}</td>
                    <td>${a.startTime || "-"}</td>
                    <td>${a.endTime || "-"}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger"
                            onclick="deleteAssignment(${a.id})">Sil</button>
                    </td>
                </tr>
            `;
        });

        await loadScanList();

    } catch {
        alert("İş atamaları alınamadı.");
    }
}

/* -----------------------------------------
   4) İŞ ATA
----------------------------------------- */
async function assignJob() {
    if (!selectedPersonnelIds.size) {
        alert("Lütfen en az bir personel seçin!");
        return;
    }

    const stationId = Number(document.getElementById("stationSelect").value);
    const shiftId = 1;

    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;

    for (let id of selectedPersonnelIds) {
        if (assignedPersonnelIds.has(id)) continue;

        await api("/assignments", "POST", {
            date: todayISO(),
            shiftId,
            stationId,
            personnelId: id,
            startTime: start,
            endTime: end
        });
    }

    alert("İş ataması tamamlandı!");
    selectedPersonnelIds.clear();

    await loadTodayAssignments();
    await loadScanList();
}

/* -----------------------------------------
   5) ATAMA SİL
----------------------------------------- */
async function deleteAssignment(id) {
    if (!confirm("Silinsin mi?")) return;

    await api(`/assignments/${id}`, "DELETE");
    await loadTodayAssignments();
}
