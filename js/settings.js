document.addEventListener("DOMContentLoaded", () => {
    loadDepartments();
    loadStations();
});

/* ======================
   STATION
====================== */

async function loadStations() {
    const stations = await api("/stations?active=true");
    const tbody = document.getElementById("stationsTable");
    tbody.innerHTML = "";

    stations.forEach((st, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${st.name}</td>
                <td>${st.code}</td>
                <td>${st.departmentRel?.name || "-"}</td>
                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="openEdit(${st.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteStation(${st.id})">Sil</button>
                </td>
            </tr>
        `;
    });
}

async function addStation() {
    if (!stName.value.trim() || !stCode.value.trim())
        return alert("Ad ve kod zorunlu");

    await api("/stations", "POST", {
        name: stName.value.trim(),
        code: stCode.value.trim(),
        departmentId: stDept.value || null
    });

    stName.value = "";
    stCode.value = "";
    stDept.value = "";

    loadStations();
}

async function openEdit(id) {
    const stations = await api("/stations?active=true");
    const st = stations.find(s => s.id === id);
    if (!st) return;

    editId.value = st.id;
    editName.value = st.name;
    editCode.value = st.code;
    editDept.value = st.departmentId || "";

    new bootstrap.Modal(editStationModal).show();
}

async function saveEdit() {
    await api(`/stations/${editId.value}`, "PUT", {
        name: editName.value.trim(),
        code: editCode.value.trim(),
        departmentId: editDept.value || null
    });

    loadStations();
    bootstrap.Modal.getInstance(editStationModal).hide();
}

async function deleteStation(id) {
    if (!confirm("Bu istasyon silinsin mi?")) return;
    await api(`/stations/${id}`, "DELETE");
    loadStations();
}

/* ======================
   DEPARTMENT
====================== */

async function loadDepartments() {
    const deps = await api("/departments?active=true");

    const tbody = document.getElementById("departmentsTable");
    const stSelect = document.getElementById("stDept");
    const editSelect = document.getElementById("editDept");

    tbody.innerHTML = "";
    stSelect.innerHTML = `<option value="">Departman seç (opsiyonel)</option>`;
    editSelect.innerHTML = `<option value="">Departman seç</option>`;

    deps.forEach((d, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${d.name}</td>
                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="openDepartmentEdit(${d.id}, '${d.name}')">
                        Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteDepartment(${d.id})">
                        Sil
                    </button>
                </td>
            </tr>
        `;

        stSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        editSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
}

async function addDepartment() {
    if (!depName.value.trim()) return alert("Departman adı zorunlu");

    await api("/departments", "POST", { name: depName.value.trim() });
    depName.value = "";
    loadDepartments();
}

function openDepartmentEdit(id, name) {
    editDepId.value = id;
    editDepName.value = name;
    new bootstrap.Modal(editDepartmentModal).show();
}

async function saveDepartmentEdit() {
    await api(`/departments/${editDepId.value}`, "PUT", {
        name: editDepName.value.trim()
    });

    loadDepartments();
    bootstrap.Modal.getInstance(editDepartmentModal).hide();
}

async function deleteDepartment(id) {
    if (!confirm("Departman pasif yapılsın mı?")) return;
    await api(`/departments/${id}`, "DELETE");
    loadDepartments();
}
