let editCardModal;
let allPersonnel = [];

window.addEventListener("load", async () => {
    editCardModal = new bootstrap.Modal(document.getElementById("editCardModal"));

    await loadPersonnelList();  // Modal için personel listesini yükle
    loadCards();                // Kartları yükle
});

/* ---------------------------------------------------
   PERSONEL LİSTESİ (Kart Düzenleme Modalı İçin)
--------------------------------------------------- */
async function loadPersonnelList() {
    allPersonnel = await api("/personnel?active=true");

    const select = document.getElementById("editPersonnel");
    select.innerHTML = `<option value="">— Boş Kart —</option>`;

    allPersonnel.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.fullName}</option>`;
    });
}

/* ---------------------------------------------------
   KARTLARI LİSTELE
--------------------------------------------------- */
async function loadCards() {
    const uidFilter = document.getElementById("filterUID").value.trim().toLowerCase();
    const personFilter = document.getElementById("filterPerson").value.trim().toLowerCase();
    const statusFilter = document.getElementById("filterStatus").value;

    const data = await api("/nfc/cards");

    const tbody = document.getElementById("cardTable");
    tbody.innerHTML = "";

    const filtered = data.filter(card => {
        const personName = card.personnel?.fullName?.toLowerCase() || "";
        const isEmpty = !card.personnelId;

        // UID filtresi
        if (uidFilter && !card.uid.toLowerCase().includes(uidFilter)) return false;

        // Personel filtresi
        if (personFilter && !personName.includes(personFilter)) return false;

        // Durum filtresi
        if (statusFilter === "active" && !card.isActive) return false;
        if (statusFilter === "passive" && card.isActive) return false;
        if (statusFilter === "empty" && !isEmpty) return false;

        return true;
    });

    filtered.forEach(card => {
        const person = card.personnel ? card.personnel.fullName : "—";
        const dept = card.personnel?.department || "—";
        const statusBadge = card.isActive
            ? `<span class="badge bg-success">Aktif</span>`
            : `<span class="badge bg-secondary">Pasif</span>`;

        tbody.innerHTML += `
        <tr>
            <td><span class="badge bg-primary">${card.uid}</span></td>
            <td>${person}</td>
            <td>${dept}</td>
            <td>${statusBadge}</td>

            <td style="white-space: nowrap;">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="openEditModal(${card.id}, '${card.uid}', ${card.personnelId}, ${card.isActive})">
                    Düzenle
                </button>

                <button class="btn btn-sm btn-danger"
                    onclick="deleteCard(${card.id})">
                    Sil
                </button>
            </td>
        </tr>`;
    });
}

/* ---------------------------------------------------
   MODALI AÇ
--------------------------------------------------- */
function openEditModal(id, uid, personnelId, isActive) {
    document.getElementById("editCardId").value = id;
    document.getElementById("editUID").value = uid;
    document.getElementById("editStatus").value = isActive ? "true" : "false";

    // Personel seçili olsun
    const select = document.getElementById("editPersonnel");
    select.value = personnelId ? String(personnelId) : "";

    editCardModal.show();
}

/* ---------------------------------------------------
   KARTI KAYDET
--------------------------------------------------- */
async function saveCard() {
    const id = document.getElementById("editCardId").value;
    const isActive = document.getElementById("editStatus").value === "true";
    const personnelId = document.getElementById("editPersonnel").value || null;

    await api(`/nfc/cards/${id}`, "PUT", {
        isActive,
        personnelId: personnelId ? Number(personnelId) : null
    });

    editCardModal.hide();
    loadCards();
}

/* ---------------------------------------------------
   KARTI BOŞA ÇIKAR
--------------------------------------------------- */
async function clearCardOwner() {
    const id = document.getElementById("editCardId").value;

    await api(`/nfc/cards/${id}`, "PUT", {
        personnelId: null
    });

    editCardModal.hide();
    loadCards();
}

/* ---------------------------------------------------
   KART SİL
--------------------------------------------------- */
async function deleteCard(id) {
    if (!confirm("Bu kartı silmek istiyor musun?")) return;

    await api(`/nfc/cards/${id}`, "DELETE");

    loadCards();
}
