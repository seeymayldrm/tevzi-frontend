async function loadPersonnel() {
    const name = document.getElementById("filterName")?.value.trim() || "";
    const dept = document.getElementById("filterDept")?.value.trim() || "";
    const status = document.getElementById("filterStatus")?.value || "";

    // backend sadece ?active=true|false destekliyor
    let query = "";
    if (status !== "") query = `?active=${status}`;

    const data = await api("/personnel" + query);

    const tbody = document.getElementById("personnelTable");
    tbody.innerHTML = "";

    // Filtreyi FE tarafında tamamlıyoruz
    const filtered = data.filter(p =>
        p.fullName.toLowerCase().includes(name.toLowerCase()) &&
        p.department?.toLowerCase().includes(dept.toLowerCase())
    );

    filtered.forEach(p => {
        tbody.innerHTML += `
        <tr>
            <td>${p.fullName}</td>
            <td>${p.department || "-"}</td>
            <td>${p.title || "-"}</td>
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
        </tr>
        `;
    });
}

function openEditModal(id, fullName, dept, title, isActive) {
    const newName = prompt("Ad Soyad", fullName);
    if (!newName) return;

    const newDept = prompt("Bölüm", dept);
    const newTitle = prompt("Ünvan", title);

    const newStatus = confirm("Personel aktif olsun mu?");

    api(`/personnel/${id}`, "PUT", {
        fullName: newName,
        department: newDept,
        title: newTitle,
        isActive: newStatus
    }).then(loadPersonnel)
        .catch(err => alert("Güncelleme hatası: " + err.message));
}

function deletePersonnel(id) {
    if (!confirm("Bu personeli silmek istiyor musun?")) return;

    api(`/personnel/${id}`, "DELETE")
        .then(loadPersonnel)
        .catch(err => alert("Silme hatası: " + err.message));
}

window.onload = loadPersonnel;
