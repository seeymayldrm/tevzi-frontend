let editModal;
let departmentsCache = [];

/* =====================================================
   PAGE INIT
===================================================== */
window.addEventListener("load", async () => {
    editModal = new bootstrap.Modal(document.getElementById("editModal"));

    showLoading("#personnelCard", "Personel listesi yükleniyor...");

    try {
        await loadDepartments();
        await loadPersonnel(true); // 👈 ilk yükleme
        showToast("Personel listesi yüklendi", "success");
    } catch (err) {
        console.error(err);
        showError("#personnelCard", "Personel verileri alınamadı");
    }
});

/* =====================================================
   DEPARTMANLAR
===================================================== */
async function loadDepartments() {
    try {
        const departments = await api("/departments?active=true");
        departmentsCache = departments;

        const filter = document.getElementById("filterDept");
        const edit = document.getElementById("editDept");

        if (filter) {
            filter.innerHTML = `<option value="">Tüm Departmanlar</option>`;
            departments.forEach(d => {
                filter.innerHTML += `<option value="${d.id}">${d.name}</option>`;
            });
        }

        if (edit) {
            edit.innerHTML = `<option value="">Seçiniz</option>`;
            departments.forEach(d => {
                edit.innerHTML += `<option value="${d.id}">${d.name}</option>`;
            });
        }
    } catch (err) {
        console.error(err);
        showToast("Departmanlar yüklenemedi", "danger");
    }
}

/* =====================================================
   PERSONEL LİSTELEME
   isInitial = true → sayfa ilk açılışı
===================================================== */
async function loadPersonnel(isInitial = false) {
    if (!isInitial) {
        showLoading("#personnelCard", "Filtreleniyor...");
    }

    try {
        const name =
            document.getElementById("filterName")?.value.toLowerCase() || "";
        const deptId =
            document.getElementById("filterDept")?.value || "";

        const data = await api("/personnel?active=true");

        // 🔥 DOM’U GERİ GETİR
        restoreContent("#personnelCard");

        const tbody = document.getElementById("personnelTable");
        if (!tbody) return;

        tbody.innerHTML = "";

        const filtered = data.filter(p =>
            p.fullName.toLowerCase().includes(name) &&
            (!deptId || String(p.departmentId) === String(deptId))
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        Kayıt bulunamadı
                    </td>
                </tr>
            `;
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
                    <td>
                        ${card
                    ? `<span class="badge bg-primary">${card.uid}</span>`
                    : "Kart Yok"
                }
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
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        showError("#personnelCard", "Personel listesi alınamadı");
    }
}

/* =====================================================
   MODAL
===================================================== */
function openEditModal(id, name, dept, title) {
    editId.value = id;
    editName.value = name;
    editDept.value = dept;
    editTitle.value = title;
    editModal.show();
}

/* =====================================================
   KAYDET
===================================================== */
async function saveEdit() {
    try {
        await api(`/personnel/${editId.value}`, "PUT", {
            fullName: editName.value.trim(),
            departmentId: editDept.value || null,
            title: editTitle.value.trim()
        });

        editModal.hide();
        showToast("Personel güncellendi", "success");
        loadPersonnel();

    } catch (err) {
        console.error(err);
        showToast("Güncelleme başarısız", "danger");
    }
}

/* =====================================================
   SİL
===================================================== */
async function deletePersonnel(id) {
    if (!confirm("Bu personel silinsin mi?")) return;

    try {
        await api(`/personnel/${id}`, "DELETE");
        showToast("Personel silindi", "warning");
        loadPersonnel();
    } catch (err) {
        console.error(err);
        showToast("Silme işlemi başarısız", "danger");
    }
}
