let departments = [];
let personnel = [];
let todayLogs = [];

document.addEventListener("DOMContentLoaded", async () => {
    startClock();

    showLoading("#personnelCard", "Personel bilgileri yükleniyor...");
    showLoading("#scanCard", "Bugünkü kart okumalar alınıyor...");

    await loadDepartments();
    await loadPersonnel();
    await loadTodayLogs();

    fillDepartmentDropdowns();
    updatePersonnelCount();
    updateScanCount();

    showToast("Dashboard hazır", "success");
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
   DATA LOADERS (SAFE)
====================== */
async function loadDepartments() {
    try {
        departments = await api("/departments?active=true");
    } catch (err) {
        console.error("Departmanlar alınamadı", err);
        departments = [];
    }
}

async function loadPersonnel() {
    try {
        personnel = await api("/personnel?active=true");
    } catch (err) {
        console.error("Personel alınamadı", err);
        showError("#personnelCard", "Personel verileri alınamadı");
        personnel = [];
    }
}

async function loadTodayLogs() {
    try {
        todayLogs = await api("/nfc/today");
    } catch (err) {
        console.error("Kart okuma alınamadı", err);
        showError("#scanCard", "Kart okuma verileri alınamadı");
        todayLogs = [];
    }
}

/* ======================
   DROPDOWNS
====================== */
function fillDepartmentDropdowns() {
    const pSelect = document.getElementById("personnelDeptFilter");
    const sSelect = document.getElementById("scanDeptFilter");

    if (!pSelect || !sSelect) return;

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
    const deptId = document.getElementById("personnelDeptFilter")?.value;
    const el = document.getElementById("totalPersonnelCount");
    if (!el) return;

    const filtered = deptId
        ? personnel.filter(p => p.departmentId == deptId)
        : personnel;

    el.textContent = filtered.length;
}

/* ======================
   TODAY SCAN COUNT
====================== */
function updateScanCount() {
    const deptId = document.getElementById("scanDeptFilter")?.value;
    const el = document.getElementById("todayScanCount");
    if (!el) return;

    const uniqueIds = new Set();

    todayLogs.forEach(log => {
        if (!log.personnel) return;
        if (log.type !== "IN") return;
        if (deptId && log.personnel.departmentId != deptId) return;

        uniqueIds.add(log.personnel.id);
    });

    el.textContent = uniqueIds.size;
}

async function loadPersonnel() {
    try {
        personnel = await api("/personnel?active=true");
        restoreContent("#personnelCard"); // 🔥
    } catch (err) {
        console.error(err);
        showError("#personnelCard", "Personel verileri alınamadı");
        personnel = [];
    }
}

async function loadTodayLogs() {
    try {
        todayLogs = await api("/nfc/today");
        restoreContent("#scanCard"); // 🔥
    } catch (err) {
        console.error(err);
        showError("#scanCard", "Kart okuma verileri alınamadı");
        todayLogs = [];
    }
}