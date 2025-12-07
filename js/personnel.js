// js/personnel.js

let personnelCache = [];

window.addEventListener("load", () => {
    loadPersonnel();
});

async function loadPersonnel() {
    try {
        const filter = document.getElementById("pFilter").value;
        let url = "/personnel";
        if (filter) url += `?active=${filter}`;

        const data = await api(url);
        personnelCache = data;

        const tbody = document.getElementById("personnelTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3">Kayıt yok.</td></tr>`;
            return;
        }

        data.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.fullName}</td>
                <td>${p.department || "-"}</td>
                <td>${p.title || "-"}</td>
                <td>${p.isActive ? "Aktif" : "Pasif"}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert("Personel listesi alınamadı: " + err.message);
    }
}

async function createPersonnel() {
    try {
        const fullName = document.getElementById("pFullName").value.trim();
        const department = document.getElementById("pDept").value.trim();
        const title = document.getElementById("pTitle").value.trim();

        if (!fullName) {
            alert("Ad soyad zorunlu.");
            return;
        }

        await api("/personnel", "POST", { fullName, department, title });

        document.getElementById("pFullName").value = "";
        document.getElementById("pDept").value = "";
        document.getElementById("pTitle").value = "";

        await loadPersonnel();
    } catch (err) {
        console.error(err);
        alert("Personel eklenemedi: " + err.message);
    }
}
