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

async function addStation() {
    const name = stName.value.trim();
    const code = stCode.value.trim();
    const departmentId = stDept.value || null;

    if (!name || !code) {
        alert("Ad ve kod zorunlu");
        return;
    }

    await api("/stations", "POST", {
        name,
        code,
        departmentId: departmentId ? Number(departmentId) : null
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
    const id = editId.value;

    await api(`/stations/${id}`, "PUT", {
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
    const deps = await api("/departments");

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
                <td>${d.isActive ? "Aktif" : "Pasif"}</td>
                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="editDepartment(${d.id}, '${d.name}')">
                        Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteDepartment(${d.id})">
                        Sil
                    </button>
                </td>
            </tr>
        `;

        if (d.isActive) {
            stSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
            editSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        }
    });
}

async function addDepartment() {
    const name = depName.value.trim();
    if (!name) return alert("Departman adı zorunlu");

    await api("/departments", "POST", { name });
    depName.value = "";
    loadDepartments();
}

async function editDepartment(id, currentName) {
    const newName = prompt("Yeni departman adı", currentName);
    if (!newName) return;

    await api(`/departments/${id}`, "PUT", {
        name: newName.trim()
    });

    loadDepartments();
}

async function deleteDepartment(id) {
    if (!confirm("Departman pasif yapılsın mı?")) return;
    await api(`/departments/${id}`, "DELETE");
    loadDepartments();
}
