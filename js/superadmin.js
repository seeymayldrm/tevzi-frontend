// js/superadmin.js

let editModal;

window.addEventListener("load", async () => {

    // ---------------------------
    // 1) LOGIN KONTROLÜ
    // ---------------------------
    if (!localStorage.getItem("token")) {
        return window.location.href = "index.html";
    }

    // ---------------------------
    // 2) ROL KONTROLÜ
    // ---------------------------
    const role = localStorage.getItem("role");
    if (role !== "SUPERADMIN") {
        alert("Bu panel yalnızca Süper Admin tarafından görüntülenebilir.");
        return window.location.href = "tevzi.html";
    }

    // ---------------------------
    // MODAL ve Şirket Listesi
    // ---------------------------
    editModal = new bootstrap.Modal(document.getElementById("editCompanyModal"));

    await loadCompanies();
});

/* ---------------------------------------------------
   1) ŞİRKETLERİ LİSTELE
--------------------------------------------------- */
async function loadCompanies() {
    const data = await api("/company");

    const tbody = document.getElementById("companyTable");
    tbody.innerHTML = "";

    data.forEach(c => {
        const admins = c.users
            .filter(u => u.role === "ADMIN")
            .map(u => u.username)
            .join(", ") || "-";

        const activeBadge = c.isActive
            ? `<span class="badge bg-success">Aktif</span>`
            : `<span class="badge bg-secondary">Pasif</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td>${activeBadge}</td>
                <td>${admins}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="openEdit(${c.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCompany(${c.id})">Sil</button>
                </td>
            </tr>
        `;
    });
}

/* ---------------------------------------------------
   2) YENİ ŞİRKET OLUŞTUR
--------------------------------------------------- */
async function createCompany() {
    const name = document.getElementById("newCompanyName").value.trim();
    const logoUrl = document.getElementById("newCompanyLogo").value.trim();
    const faviconUrl = document.getElementById("newCompanyFavicon").value.trim();
    const adminUsername = document.getElementById("newAdminUsername").value.trim();
    const adminPassword = document.getElementById("newAdminPassword").value.trim();

    if (!name) return alert("Şirket adı zorunludur.");

    await api("/company", "POST", {
        name,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        adminUsername: adminUsername || null,
        adminPassword: adminPassword || null
    });

    alert("Şirket oluşturuldu!");
    loadCompanies();
}

/* ---------------------------------------------------
   3) DÜZENLEME MODALINI AÇ
--------------------------------------------------- */
async function openEdit(id) {
    const companies = await api("/company");
    const c = companies.find(x => x.id === id);

    if (!c) return;

    document.getElementById("editCompanyId").value = c.id;
    document.getElementById("editCompanyName").value = c.name;
    document.getElementById("editCompanyLogo").value = c.logoUrl || "";
    document.getElementById("editCompanyFavicon").value = c.faviconUrl || "";
    document.getElementById("editCompanyActive").value = c.isActive ? "true" : "false";

    editModal.show();
}

/* ---------------------------------------------------
   4) ŞİRKET GÜNCELLE
--------------------------------------------------- */
async function saveCompany() {
    const id = document.getElementById("editCompanyId").value;

    await api(`/company/${id}`, "PUT", {
        name: document.getElementById("editCompanyName").value.trim(),
        logoUrl: document.getElementById("editCompanyLogo").value.trim(),
        faviconUrl: document.getElementById("editCompanyFavicon").value.trim(),
        isActive: document.getElementById("editCompanyActive").value === "true"
    });

    editModal.hide();
    loadCompanies();
}

/* ---------------------------------------------------
   5) ŞİRKET SİL (Soft Delete)
--------------------------------------------------- */
async function deleteCompany(id) {
    if (!confirm("Bu şirketi pasif yapmak istiyor musun?")) return;

    await api(`/company/${id}`, "DELETE");

    loadCompanies();
}
