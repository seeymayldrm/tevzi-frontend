let editModal;
let departmentsCache = [];

window.addEventListener("load", async () => {
    editModal = new bootstrap.Modal(document.getElementById("editModal"));

    showLoading("#personnelCard", "Personel listesi yükleniyor...");

    try {
        await loadDepartments();
        await loadPersonnel();
        restoreContent("#personnelCard");
        showToast("Personel listesi yüklendi", "success");
    } catch (err) {
        console.error(err);
        showError("#personnelCard", "Personel verileri alınamadı");
    }
});

/* =========================
   DEPARTMANLAR
========================= */
async function loadDepartments() {
    try {
        const departments = await api("/departments?active=true");
        departmentsCache = departments;

        const filter = document.getElementById("filterDept");
        const edit = document.getElementById("editDept");

        filter.innerHTML = `<option value="">Tümü</option>`;
        edit.innerHTML = `<option value="">Seçiniz</option>`;

        departments.forEach(d => {
            filter.innerHTML += `<option value="${d.id}">${d.name}</option>`;
            edit.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
    } catch {
        showToast("Departmanlar yüklenemedi", "danger");
    }
}

/* =========================
   PERSONEL
========================= */
async function loadPersonnel() {
    showLoading("#personnelCard", "Filtreleniyor...");

    try {
        const name = document.getElementById("filterName").value.toLowerCase();
        const deptId = document.getElementById("filterDept").value;

        const data = await api("/personnel?active=true");
        const tbody = document.getElementById("personnelTable");
        tbody.innerHTML = "";

        const filtered = data.filter(p => {
            return (
                p.fullName.toLowerCase().includes(name) &&
                (!deptId || String(p.departmentId) === deptId)
            );
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Kayıt bulunamadı
                    </td>
                </tr>`;
            restoreContent("#personnelCard");
            return;
        }

        filtered.forEach((p, i) => {
            const card = p.cards?.find(c => c.isActive);
            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.fullName}</td>
                    <td>${p.departmentRel?.name || "-"}</td>
                    <td>${p.title || "-"}</td>
                    <td>${card ? `<span class="badge bg-primary">${card.uid}</span>` : "Kart Yok"}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1"
                            onclick="openEditModal(${p.id}, '${p.fullName.replace(/'/g, "\\'")}', '${p.departmentId || ""}', '${p.title || ""}')">
                            Düzenle
                        </button>
                        <button class="btn btn-sm btn-danger"
                            onclick="deletePersonnel(${p.id})">
                            Sil
                        </button>
                    </td>
                </tr>`;
        });

        restoreContent("#personnelCard");
    } catch (err) {
        console.error(err);
        showError("#personnelCard", "Personel listesi alınamadı");
    }
}

/* =========================
   MODAL / CRUD
========================= */
function openEditModal(id, name, dept, title) {
    editId.value = id;
    editName.value = name;
    editDept.value = dept;
    editTitle.value = title;
    editModal.show();
}

async function saveEdit() {
    try {
        await api(`/personnel/${editId.value}`, "PUT", {
            fullName: editName.value,
            departmentId: editDept.value || null,
            title: editTitle.value
        });
        editModal.hide();
        showToast("Personel güncellendi", "success");
        loadPersonnel();
    } catch {
        showToast("Güncelleme başarısız", "danger");
    }
}

async function deletePersonnel(id) {
    if (!confirm("Bu personel silinsin mi?")) return;
    try {
        await api(`/personnel/${id}`, "DELETE");
        showToast("Personel silindi", "warning");
        loadPersonnel();
    } catch {
        showToast("Silme işlemi başarısız", "danger");
    }
}
