let editModal;

window.addEventListener("load", () => {
    editModal = new bootstrap.Modal(document.getElementById("editModal"));
    loadPersonnel();
});

async function loadPersonnel() {
    const name = document.getElementById("filterName")?.value.trim() || "";
    const dept = document.getElementById("filterDept")?.value.trim() || "";
    const status = document.getElementById("filterStatus")?.value || "";

    // backend sadece ?active=true|false destekliyor
    let query = status !== "" ? `?active=${status}` : "";

    const data = await api("/personnel" + query);

    const tbody = document.getElementById("personnelTable");
    tbody.innerHTML = "";

    // filtreleme FE tarafında tamamlanıyor
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
            <td>${p.isActive ? "Aktif" : "Pasif"}</td>

            <td>
                <button class="btn btn-sm btn-warning me-1"
                    onclick="openEditModal(${p.id}, '${p.fullName}', '${p.department || ""}', '${p.title || ""}', ${p.isActive})">
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
function openEditModal(id, fullName, dept, title, isActive) {
    document.getElementById("editId").value = id;
    document.getElementById("editName").value = fullName;
    document.getElementById("editDept").value = dept;
    document.getElementById("editTitle").value = title;
    document.getElementById("editStatus").value = isActive;

    editModal.show();
}

// Kaydet
async function saveEdit() {
    const id = document.getElementById("editId").value;
    const fullName = document.getElementById("editName").value.trim();
    const department = document.getElementById("editDept").value.trim();
    const title = document.getElementById("editTitle").value.trim();
    const isActive = document.getElementById("editStatus").value === "true";

    await api(`/personnel/${id}`, "PUT", {
        fullName,
        department,
        title,
        isActive
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
