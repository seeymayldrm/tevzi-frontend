let editCardModal;
let allPersonnel = [];

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
    editCardModal = new bootstrap.Modal(
        document.getElementById("editCardModal")
    );

    showLoading("#cardCard", "Kartlar yükleniyor...");

    try {
        await loadPersonnelList();
        await loadCards(true);
        showToast("Kart listesi yüklendi", "success");
    } catch (err) {
        console.error(err);
        showError("#cardCard", "Kart verileri alınamadı");
    }
});

/* =========================
   PERSONEL (MODAL)
========================= */
async function loadPersonnelList() {
    const data = await api("/personnel?active=true");
    allPersonnel = data;

    const select = document.getElementById("editPersonnel");
    select.innerHTML = `<option value="">— Boş Kart —</option>`;

    data.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.fullName}</option>`;
    });
}

/* =========================
   KARTLAR
========================= */
async function loadCards(isInitial = false) {
    if (!isInitial) {
        showLoading("#cardCard", "Filtreleniyor...");
    }

    try {
        const uid = document.getElementById("filterUID").value.toLowerCase();
        const person = document.getElementById("filterPerson").value.toLowerCase();
        const status = document.getElementById("filterStatus").value;

        const data = await api("/nfc/cards");

        restoreContent("#cardCard");

        const tbody = document.getElementById("cardTable");
        tbody.innerHTML = "";

        const filtered = data.filter(card => {
            const personName = card.personnel?.fullName?.toLowerCase() || "";
            const empty = !card.personnelId;

            if (uid && !card.uid.toLowerCase().includes(uid)) return false;
            if (person && !personName.includes(person)) return false;
            if (status === "active" && !card.isActive) return false;
            if (status === "passive" && card.isActive) return false;
            if (status === "empty" && !empty) return false;

            return true;
        });

        if (!filtered.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        Kayıt bulunamadı
                    </td>
                </tr>`;
            return;
        }

        filtered.forEach(card => {
            const dept = card.personnel?.departmentRel?.name || "—";
            const personName = card.personnel?.fullName || "—";

            tbody.innerHTML += `
                <tr>
                    <td><span class="badge bg-primary">${card.uid}</span></td>
                    <td>${personName}</td>
                    <td>${dept}</td>
                    <td>
                        ${card.isActive
                    ? `<span class="badge bg-success">Aktif</span>`
                    : `<span class="badge bg-secondary">Pasif</span>`
                }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1"
                            onclick="openEditModal(${card.id}, '${card.uid}', ${card.personnelId}, ${card.isActive})">
                            Düzenle
                        </button>
                        <button class="btn btn-sm btn-danger"
                            onclick="deleteCard(${card.id})">
                            Sil
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        showError("#cardCard", "Kartlar alınamadı");
    }
}

/* =========================
   MODAL
========================= */
function openEditModal(id, uid, personnelId, isActive) {
    editCardId.value = id;
    editUID.value = uid;
    editStatus.value = isActive ? "true" : "false";
    editPersonnel.value = personnelId ? String(personnelId) : "";
    editCardModal.show();
}

/* =========================
   SAVE
========================= */
async function saveCard() {
    try {
        await api(`/nfc/cards/${editCardId.value}`, "PUT", {
            isActive: editStatus.value === "true",
            personnelId: editPersonnel.value || null
        });

        editCardModal.hide();
        showToast("Kart güncellendi", "success");
        loadCards();

    } catch {
        showToast("Kart güncellenemedi", "danger");
    }
}

/* =========================
   CLEAR OWNER
========================= */
async function clearCardOwner() {
    try {
        await api(`/nfc/cards/${editCardId.value}`, "PUT", {
            personnelId: null
        });

        editCardModal.hide();
        showToast("Kart boşa çıkarıldı", "warning");
        loadCards();

    } catch {
        showToast("İşlem başarısız", "danger");
    }
}

/* =========================
   DELETE
========================= */
async function deleteCard(id) {
    if (!confirm("Bu kart silinsin mi?")) return;

    try {
        await api(`/nfc/cards/${id}`, "DELETE");
        showToast("Kart silindi", "warning");
        loadCards();
    } catch {
        showToast("Silme başarısız", "danger");
    }
}
