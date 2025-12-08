let editModal;

window.addEventListener("load", () => {
    editModal = new bootstrap.Modal(document.getElementById("editModal"));
    loadPersonnel();
});

async function loadPersonnel() {
    const name = document.getElementById("filterName")?.value.trim() || "";
    const dept = document.getElementById("filterDept")?.value.trim() || "";

    // Artık durum filtresi yok → sadece aktif personel gösterilecek
    const data = await api("/personnel?active=true");

    const tbody = document.getElementById("personnelTable");
    tbody.innerHTML = "";

    // FE filtreleme
    const filtered = data.filter(p =>
        p.fullName.toLowerCase().includes(name.toLowerCase()) &&
        p.department?.toLowerCase().includes(dept.toLowerCase())
    );

    filtered.forEach(p => {
        const activeCard = p.cards?.find(c => c.isActive);

        tbody.innerHTML += `
        <tr>
            <td>${p.fullName}</td>
            <td>${p.department || "-"}</td>
            <td>${p.title || "-"}</td>
            <td>${activeCard ? `<span class="badge bg-primary">${activeCard.uid}</span>` : "Kart Yok"}</td>

            <td style="white-space: nowrap;">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="openEditModal(${p.id}, '${p.fullName}', '${p.department || ""}', '${p.title || ""}')">
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

// Modalı aç
function openEditModal(id, fullName, dept, title) {
    document.getElementById("editId").value = id;
    document.getElementById("editName").value = fullName;
    document.getElementById("editDept").value = dept;
    document.getElementById("editTitle").value = title;

    editModal.show();
}

// Kaydet
async function saveEdit() {
    const id = document.getElementById("editId").value;
    const fullName = document.getElementById("editName").value.trim();
    const department = document.getElementById("editDept").value.trim();
    const title = document.getElementById("editTitle").value.trim();

    await api(`/personnel/${id}`, "PUT", {
        fullName,
        department,
        title
    });

    editModal.hide();
    loadPersonnel();
}

// Silme
function deletePersonnel(id) {
    if (!confirm("Bu personeli silmek istiyor musun?")) return;

    api(`/personnel/${id}`, "DELETE")
        .then(loadPersonnel)
        .catch(err => alert("Silme hatası: " + err.message));
}
