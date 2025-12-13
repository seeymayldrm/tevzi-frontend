document.addEventListener("DOMContentLoaded", () => {
    loadStations();
    loadDepartments();
});

/* =====================================================
   STATION YÖNETİMİ
===================================================== */

/* 1) İSTASYON LİSTELEME (aktifler) */
async function loadStations() {
    const stations = await api("/stations?active=true");

    const tbody = document.getElementById("stationsTable");
    tbody.innerHTML = "";

    stations.forEach(st => {
        tbody.innerHTML += `
            <tr>
                <td>${st.id}</td>
                <td>${st.name}</td>
                <td>${st.code}</td>
                <td>${st.department || "-"}</td>
                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="openEdit(${st.id})">
                        Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteStation(${st.id})">
                        Sil
                    </button>
                </td>
            </tr>
        `;
    });
}

/* 2) YENİ İSTASYON EKLEME */
async function addStation() {
    const name = document.getElementById("stName").value.trim();
    const code = document.getElementById("stCode").value.trim();
    const dept = document.getElementById("stDept").value.trim();

    if (!name || !code) {
        alert("Ad ve kod zorunlu.");
        return;
    }

    await api("/stations", "POST", {
        name,
        code,
        department: dept || null
    });

    document.getElementById("stName").value = "";
    document.getElementById("stCode").value = "";
    document.getElementById("stDept").value = "";

    loadStations();
}

/* 3) İSTASYON SİLME (soft delete) */
async function deleteStation(id) {
    if (!confirm("Bu istasyonu silmek istediğine emin misin?")) return;

    await api(`/stations/${id}`, "DELETE");
    loadStations();
}

/* 4) DÜZENLEME MODALI */
async function openEdit(id) {
    const stations = await api("/stations?active=true");
    const st = stations.find(s => s.id === id);
    if (!st) return;

    document.getElementById("editId").value = st.id;
    document.getElementById("editName").value = st.name;
    document.getElementById("editCode").value = st.code;
    document.getElementById("editDept").value = st.department || "";

    new bootstrap.Modal(
        document.getElementById("editStationModal")
    ).show();
}

/* 5) DÜZENLEME KAYDET */
async function saveEdit() {
    const id = document.getElementById("editId").value;

    await api(`/stations/${id}`, "PUT", {
        name: document.getElementById("editName").value.trim(),
        code: document.getElementById("editCode").value.trim(),
        department: document.getElementById("editDept").value.trim()
    });

    loadStations();
    bootstrap.Modal
        .getInstance(document.getElementById("editStationModal"))
        .hide();
}

/* =====================================================
   DEPARTMENT YÖNETİMİ (YENİ)
===================================================== */

/* 6) DEPARTMAN LİSTELEME */
async function loadDepartments() {
    const departments = await api("/departments?active=true");

    const tbody = document.getElementById("departmentsTable");
    tbody.innerHTML = "";

    departments.forEach(dep => {
        tbody.innerHTML += `
            <tr>
                <td>${dep.id}</td>
                <td>${dep.name}</td>
                <td>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteDepartment(${dep.id})">
                        Sil
                    </button>
                </td>
            </tr>
        `;
    });
}

/* 7) YENİ DEPARTMAN EKLEME */
async function addDepartment() {
    const name = document.getElementById("depName").value.trim();

    if (!name) {
        alert("Departman adı zorunlu.");
        return;
    }

    await api("/departments", "POST", { name });

    document.getElementById("depName").value = "";
    loadDepartments();
}

/* 8) DEPARTMAN SİLME (soft delete) */
async function deleteDepartment(id) {
    if (!confirm("Bu departman pasif yapılsın mı?")) return;

    await api(`/departments/${id}`, "DELETE");
    loadDepartments();
}
