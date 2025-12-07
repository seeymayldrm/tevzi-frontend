// js/nfc.js

let logsCache = [];

window.addEventListener("load", () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("logStart").value = today;
    document.getElementById("logEnd").value = today;
    loadLogs(); // sayfa açılır açılmaz bugünü yükle
});

async function loadLogs() {
    try {
        const start = document.getElementById("logStart").value;
        // şimdilik end'i kullanmıyoruz, tek gün üzerinden gidiyoruz
        if (!start) {
            alert("Lütfen tarih seç.");
            return;
        }

        // Backend'deki endpoint: /nfc/logs?date=YYYY-MM-DD
        const data = await api(`/nfc/logs?date=${start}`);
        logsCache = data;

        const tbody = document.getElementById("logTable");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3">Log bulunamadı.</td></tr>`;
            return;
        }

        data.forEach((l) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${new Date(l.scannedAt).toLocaleString("tr-TR")}</td>
                <td>${l.uid}</td>
                <td>${l.type}</td>
                <td>${l.personnel?.fullName || "-"}</td>
                <td>${l.personnel?.department || "-"}</td>
                <td>${l.source || "-"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        alert("Loglar alınamadı: " + err.message);
    }
}

function exportLogsCsv() {
    if (!logsCache.length) {
        alert("İndirilecek log yok.");
        return;
    }

    const rows = [];
    rows.push(["TarihSaat", "UID", "Tip", "Personel", "Bölüm", "Kaynak"]);

    logsCache.forEach((l) => {
        rows.push([
            new Date(l.scannedAt).toLocaleString("tr-TR"),
            l.uid,
            l.type,
            l.personnel?.fullName || "",
            l.personnel?.department || "",
            l.source || "",
        ]);
    });

    const csv = rows
        .map((r) =>
            r
                .map((v) =>
                    `"${(v ?? "").toString().replace(/"/g, '""')}"`
                )
                .join(";")
        )
        .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nfc_logs.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
