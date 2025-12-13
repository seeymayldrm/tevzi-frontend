let editModal;
let departmentsCache = [];

window.addEventListener("load", async () => {
    editModal = new bootstrap.Modal(document.getElementById("editModal"));
    await loadDepartments();
    await loadPersonnel();
});

/* =====================================================
   DEPARTMANLARI YÜKLE (Dropdown için)
===================================================== */
async function loadDepartments() {
    const departments = await api("/departments?active=true");
    departmentsCache = departments;

    const filterSelect = document.getElementById("filterDept");
    const editSelect = document.getElementById("editDept");

    if (filterSelect) {
        filterSelect.innerHTML = `<option value="">Tümü</option>`;
        departments.forEach(d => {
            filterSelect.innerHTML += `
                <option value="${d.id}">${d.name}</option>
            `;
        });
    }

    if (editSelect) {
        editSelect.innerHTML = `<option value="">Seçiniz</option>`;
        departments.forEach(d => {
            editSelect.innerHTML += `
                <option value="${d.id}">${d.name}</option>
            `;
        });
    }
}

/* =====================================================
   PERSONEL LİSTELEME
===================================================== */
async function loadPersonnel() {
    const name = document.getElementById("filterName")?.value.trim().toLowerCase() || "";
    const deptId = document.getElementById("filterDept")?.value || "";

    const data = await api("/personnel?active=true");

    const tbody = document.getElementById("personnelTable");
    tbody.innerHTML = "";

    // FE filtreleme
    const filtered = data.filter(p => {
        const matchesName = p.fullName.toLowerCase().includes(name);
        const matchesDept =
            !deptId || String(p.departmentId) === String(deptId);
        return matchesName && matchesDept;
    });

    filtered.forEach((p, index) => {
        const activeCard = p.cards?.find(c => c.isActive);
        const deptName = p.departmentRel?.name || "-";

        tbody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${p.fullName}</td>
            <td>${deptName}</td>
            <td>${p.title || "-"}</td>
            <td>
                ${activeCard
                ? `<span class="badge bg-primary">${activeCard.uid}</span>`
                : "Kart Yok"}
            </td>
            <td style="white-space: nowrap;">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="openEditModal(
                        ${p.id},
                        '${p.fullName.replace(/'/g, "\\'")}',
                        '${p.departmentId || ""}',
                        '${p.title || ""}'
                    )">
                    Düzenle
                </button>

                <button class="btn btn-sm btn-danger"
                    onclick="deletePersonnel(${p.id})">
                    Sil
                </button>
            </td>
        </tr>`;
    });
}

/* =====================================================
   DÜZENLEME MODALI
===================================================== */
function openEditModal(id, fullName, departmentId, title) {
    document.getElementById("editId").value = id;
    document.getElementById("editName").value = fullName;
    document.getElementById("editDept").value = departmentId;
    document.getElementById("editTitle").value = title;

    editModal.show();
}

/* =====================================================
   KAYDET
===================================================== */
async function saveEdit() {
    const id = document.getElementById("editId").value;
    const fullName = document.getElementById("editName").value.trim();
    const departmentId = document.getElementById("editDept").value || null;
    const title = document.getElementById("editTitle").value.trim();

    await api(`/personnel/${id}`, "PUT", {
        fullName,
        departmentId,
        title
    });

    editModal.hide();
    loadPersonnel();
}

/* =====================================================
   PERSONEL SİL
===================================================== */
function deletePersonnel(id) {
    if (!confirm("Bu personeli silmek istiyor musun?")) return;

    api(`/personnel/${id}`, "DELETE")
        .then(loadPersonnel)
        .catch(err => alert("Silme hatası: " + err.message));
}
