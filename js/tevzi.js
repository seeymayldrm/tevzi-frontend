// js/tevzi.js

let assignmentsCache = [];
let stationsCache = [];

window.addEventListener("load", async () => {
    // tarih/varsayılan saatler
    const now = new Date();
    document.getElementById("startTime").value = "07:00";
    document.getElementById("endTime").value = "17:00";

    await loadStations();
    await loadTodayAssignments();
    // ileride kart okutan listesi için ayrı endpoint yazacağız
});

// İstasyon listesi
async function loadStations() {
    try {
        const stations = await api("/stations");
        stationsCache = stations;

        const select = document.getElementById("stationSelect");
        select.innerHTML = "";

        stations.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.code})`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        alert("İstasyon listesi alınamadı: " + err.message);
    }
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}

// Günlük atamalar
async function loadTodayAssignments() {
    try {
        const date = todayISO();
        const data = await api(`/assignments?date=${date}`);
        assignmentsCache = data;

        const tbody = document.getElementById("assignmentTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3">
                Bugün için atanmış iş yok.
            </td></tr>`;
            return;
        }

        data.forEach(a => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.personnel?.fullName || "-"}</td>
                <td>${a.station?.name || "-"}</td>
                <td>${a.shift?.startTime || "-"}</td>
                <td>${a.shift?.endTime || "-"}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment(${a.id})">
                        Sil
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert("İş atamaları alınamadı: " + err.message);
    }
}

// İş ata (şimdilik örnek olarak personnelId manual – NFC ile eşleştirince dolduracağız)
async function assignJob() {
    try {
        const stationId = Number(document.getElementById("stationSelect").value);
        const start = document.getElementById("startTime").value;
        const end = document.getElementById("endTime").value;

        // Şimdilik DAY shift = 1 varsayıyorum, backend'teki koduna göre güncelleriz
        const shiftId = 1;
        const personnelId = 1; // TODO: panelden seçilebilir hale getireceğiz

        const body = {
            date: todayISO(),
            shiftId,
            stationId,
            personnelId
        };

        await api("/assignments", "POST", body);
        await loadTodayAssignments();
    } catch (err) {
        console.error(err);
        alert("İş ataması yapılamadı: " + err.message);
    }
}

async function deleteAssignment(id) {
    if (!confirm("Bu atamayı silmek istiyor musun?")) return;

    try {
        await api(`/assignments/${id}`, "DELETE");
        await loadTodayAssignments();
    } catch (err) {
        console.error(err);
        alert("Silme işlemi başarısız: " + err.message);
    }
}

// --- CSV export (Puantaj) ---
function exportAssignmentsCsv() {
    if (!assignmentsCache.length) {
        alert("İndirilecek atama yok.");
        return;
    }

    const date = todayISO();
    const rows = [];
    rows.push([
        "Tarih",
        "Personel",
        "İstasyon",
        "Vardiya",
        "Başlangıç",
        "Bitiş"
    ]);

    assignmentsCache.forEach(a => {
        rows.push([
            date,
            a.personnel?.fullName || "",
            a.station?.name || "",
            a.shift?.name || "",
            a.shift?.startTime || "",
            a.shift?.endTime || ""
        ]);
    });

    const csv = rows.map(r => r.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(";")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `tevzi_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
