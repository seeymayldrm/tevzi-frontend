let departments = [];
let personnel = [];
let todayLogs = [];

document.addEventListener("DOMContentLoaded", async () => {
    startClock();

    showLoading("#personnelCard", "Personel bilgileri yükleniyor...");
    showLoading("#scanCard", "Bugünkü kart okumalar alınıyor...");

    try {
        [departments, personnel, todayLogs] = await Promise.all([
            api("/departments?active=true"),
            api("/personnel?active=true"),
            api("/nfc/today")
        ]);

        fillDepartmentDropdowns();
        updatePersonnelCount();
        updateScanCount();

        showToast("Dashboard yüklendi", "success");
    }
    catch (err) {
        console.error(err);
        showError("#personnelCard", "Personel verileri alınamadı");
        showError("#scanCard", "Kart okuma verileri alınamadı");
    }
});

/* ======================
   CLOCK
====================== */
function startClock() {
    const el = document.getElementById("liveClock");
    setInterval(() => {
        const d = new Date();
        el.textContent =
            d.toLocaleDateString("tr-TR") + " " +
            d.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            });
    }, 1000);
}

/* ======================
   DROPDOWNS
====================== */
function fillDepartmentDropdowns() {
    const pSelect = document.getElementById("personnelDeptFilter");
    const sSelect = document.getElementById("scanDeptFilter");

    pSelect.innerHTML = `<option value="">Tüm Departmanlar</option>`;
    sSelect.innerHTML = `<option value="">Tüm Departmanlar</option>`;

    departments.forEach(d => {
        const opt = `<option value="${d.id}">${d.name}</option>`;
        pSelect.innerHTML += opt;
        sSelect.innerHTML += opt;
    });
}

/* ======================
   PERSONNEL COUNT
====================== */
function updatePersonnelCount() {
    const deptId = document.getElementById("personnelDeptFilter").value;

    const filtered = deptId
        ? personnel.filter(p => p.departmentId == deptId)
        : personnel;

    document.getElementById("totalPersonnelCount").textContent =
        filtered.length;
}

/* ======================
   TODAY SCAN COUNT
====================== */
function updateScanCount() {
    const deptId = document.getElementById("scanDeptFilter").value;
    const uniqueIds = new Set();

    todayLogs.forEach(log => {
        if (!log.personnel) return;
        if (log.type !== "IN") return;
        if (deptId && log.personnel.departmentId != deptId) return;

        uniqueIds.add(log.personnel.id);
    });

    document.getElementById("todayScanCount").textContent =
        uniqueIds.size;
}
