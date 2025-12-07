// SETTINGS.JS
// İstasyon yönetimi (listeleme, ekleme, silme, düzenleme)

document.addEventListener("DOMContentLoaded", () => {
    loadStations();
});

/* -------------------------------
   1) İSTASYON LİSTELEME
---------------------------------- */
async function loadStations() {
    const stations = await api("/stations");

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
                    ${st.isActive ?
                '<span class="badge bg-success">Aktif</span>' :
                '<span class="badge bg-secondary">Pasif</span>'
            }
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="openEdit(${st.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStation(${st.id})">Sil</button>
                </td>
            </tr>
        `;
    });
}

/* -------------------------------
   2) YENİ İSTASYON EKLEME
---------------------------------- */
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

/* -------------------------------
   3) İSTASYON SİLME (SOFT DELETE)
---------------------------------- */
async function deleteStation(id) {
    if (!confirm("Bu istasyonu silmek istediğine emin misin?")) return;

    await api(`/stations/${id}`, "DELETE");
    loadStations();
}

/* -------------------------------
   4) DÜZENLEME MODALINI AÇ
---------------------------------- */
async function openEdit(id) {
    const stations = await api("/stations");
    const st = stations.find(s => s.id === id);

    document.getElementById("editId").value = st.id;
    document.getElementById("editName").value = st.name;
    document.getElementById("editCode").value = st.code;
    document.getElementById("editDept").value = st.department || "";
    document.getElementById("editActive").value = st.isActive;

    const modal = new bootstrap.Modal(document.getElementById("editStationModal"));
    modal.show();
}

/* -------------------------------
   5) DÜZENLEME KAYDET
---------------------------------- */
async function saveEdit() {
    const id = document.getElementById("editId").value;

    await api(`/stations/${id}`, "PUT", {
        name: document.getElementById("editName").value.trim(),
        code: document.getElementById("editCode").value.trim(),
        department: document.getElementById("editDept").value.trim(),
        isActive: document.getElementById("editActive").value === "true"
    });

    loadStations();

    bootstrap.Modal.getInstance(document.getElementById("editStationModal")).hide();
}
