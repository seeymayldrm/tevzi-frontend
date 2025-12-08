// js/nfc.js

let logsCache = [];

/* ---------------------------------------------
   🇹🇷 TR BUGÜN TARİHİ
--------------------------------------------- */
function getTodayLocal() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/* ---------------------------------------------
   🇹🇷 TR RAW LOG SAATİ (UTC DÖNÜŞÜM YOK)
   "2025-12-09T01:08:40.000Z" → "09.12.2025 01:08"
--------------------------------------------- */
function formatTRDateTime(raw) {
    const [datePart, timePart] = raw.split("T"); // ["2025-12-09", "01:08:40.000Z"]
    const [hour, minute] = timePart.split(":"); // ["01","08","40.000Z"]
    const [y, m, d] = datePart.split("-");      // ["2025","12","09"]

    return `${d}.${m}.${y} ${hour}:${minute}`;
}

/* ---------------------------------------------
   SAYFA LOAD
--------------------------------------------- */
window.addEventListener("load", () => {
    const today = getTodayLocal();   // 🔥 Artık TR bugün
    document.getElementById("logStart").value = today;
    document.getElementById("logEnd").value = today;
    loadLogs();
});

/* ---------------------------------------------
   LOG YÜKLEME
--------------------------------------------- */
async function loadLogs() {
    try {
        const start = document.getElementById("logStart").value;

        if (!start) {
            alert("Lütfen tarih seç.");
            return;
        }

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
                <td>${formatTRDateTime(l.scannedAt)}</td>  <!-- 🔥 DOĞRU SAAT -->
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

/* ---------------------------------------------
   CSV EXPORT — TR RAW TARİH/SAAT
--------------------------------------------- */
function exportLogsCsv() {
    if (!logsCache.length) {
        alert("İndirilecek log yok.");
        return;
    }

    const rows = [];
    rows.push(["TarihSaat", "UID", "Tip", "Personel", "Bölüm", "Kaynak"]);

    logsCache.forEach((l) => {
        rows.push([
            formatTRDateTime(l.scannedAt),   // 🔥 DOĞRU SAAT
            l.uid,
            l.type,
            l.personnel?.fullName || "",
            l.personnel?.department || "",
            l.source || "",
        ]);
    });

    // 🔥 UTF-8 BOM EKLİYORUZ → Türkçe karakter %100 doğru görünür
    const BOM = "\uFEFF";

    const csv = rows
        .map((r) =>
            r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(";")
        )
        .join("\r\n");

    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nfc_logs.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
