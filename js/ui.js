/* =========================
   UI HELPERS (SAFE + RESTORE)
========================= */

const uiCache = new Map();

function getSlot(selector) {
    const el = document.querySelector(selector);
    if (!el) return null;
    return el.querySelector("[data-ui-slot]");
}

function showLoading(selector, message = "Yükleniyor...") {
    const slot = getSlot(selector);
    if (!slot) return;

    // 🔐 ORİJİNAL İÇERİĞİ SAKLA
    if (!uiCache.has(selector)) {
        uiCache.set(selector, slot.innerHTML);
    }

    slot.innerHTML = `
        <div class="text-center py-4 text-muted">
            <div class="spinner-border mb-2" role="status"></div>
            <div>${message}</div>
        </div>
    `;
}

function restoreContent(selector) {
    const slot = getSlot(selector);
    if (!slot) return;

    if (uiCache.has(selector)) {
        slot.innerHTML = uiCache.get(selector);
        uiCache.delete(selector);
    }
}

function showError(selector, message) {
    const slot = getSlot(selector);
    if (!slot) return;

    slot.innerHTML = `
        <div class="alert alert-danger mb-0">
            ${message}
        </div>
    `;
}

function showToast(message, type = "info", timeout = 2500) {
    let toast = document.getElementById("globalToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "globalToast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.zIndex = "9999";
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="alert alert-${type} shadow mb-0">
            ${message}
        </div>
    `;

    setTimeout(() => {
        toast.innerHTML = "";
    }, timeout);
}
