// js/timeline.js

let timelineCache = [];
let shiftsCache = [];

window.addEventListener("load", async () => {
    const d = new Date().toISOString().split("T")[0];
    document.getElementById("tlDate").value = d;

    await loadShifts();
    await loadTimeline();
});

async function loadShifts() {
    try {
        const data = await api("/shifts");
        shiftsCache = data;

        const sel = document.getElementById("tlShift");
        sel.innerHTML = `<option value="">Tümü</option>`;
        data.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.code})`;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        alert("Vardiya listesi alınamadı: " + err.message);
    }
}

async function loadTimeline() {
    try {
        const date = document.getElementById("tlDate").value;
        const shiftId = document.getElementById("tlShift").value;

        if (!date) {
            alert("Lütfen tarih seç.");
            return;
        }

        let url = `/assignments?date=${date}`;
        if (shiftId) url += `&shiftId=${shiftId}`;

        const data = await api(url);
        timelineCache = data;

        const tbody = document.getElementById("tlTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3">Kayıt yok.</td></tr>`;
            return;
        }

        data.forEach(a => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${date}</td>
                <td>${a.personnel?.fullName || "-"}</td>
                <td>${a.station?.name || "-"}</td>
                <td>${a.shift?.name || "-"}</td>
                <td>${a.shift?.startTime || "-"}</td>
                <td>${a.shift?.endTime || "-"}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert("Zaman çizelgesi alınamadı: " + err.message);
    }
}

function exportTimelineCsv() {
    if (!timelineCache.length) {
        alert("İndirilecek kayıt yok.");
        return;
    }

    const date = document.getElementById("tlDate").value;
    const rows = [];
    rows.push(["Tarih", "Personel", "İstasyon", "Vardiya", "Başlangıç", "Bitiş"]);

    timelineCache.forEach(a => {
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
    a.download = `puantaj_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
