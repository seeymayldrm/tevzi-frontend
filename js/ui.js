/* =====================================================
   UI HELPERS (GLOBAL)
===================================================== */

/* ---------- LOADING ---------- */
function showLoading(target, text = "Yükleniyor...") {
    const el = typeof target === "string"
        ? document.querySelector(target)
        : target;

    if (!el) return;

    el.dataset._oldHtml = el.innerHTML;

    el.innerHTML = `
        <div class="d-flex flex-column align-items-center py-4 text-muted">
            <div class="spinner-border mb-2" role="status"></div>
            <div>${text}</div>
        </div>
    `;
}

function hideLoading(target) {
    const el = typeof target === "string"
        ? document.querySelector(target)
        : target;

    if (!el) return;

    if (el.dataset._oldHtml !== undefined) {
        el.innerHTML = el.dataset._oldHtml;
        delete el.dataset._oldHtml;
    }
}

/* ---------- EMPTY ---------- */
function showEmpty(target, text = "Henüz kayıt yok") {
    const el = typeof target === "string"
        ? document.querySelector(target)
        : target;

    if (!el) return;

    el.innerHTML = `
        <div class="text-center text-muted py-4">
            ${text}
        </div>
    `;
}

/* ---------- ERROR ---------- */
function showError(target, text = "Bir hata oluştu") {
    const el = typeof target === "string"
        ? document.querySelector(target)
        : target;

    if (!el) return;

    el.innerHTML = `
        <div class="alert alert-danger my-3">
            ${text}
        </div>
    `;
}

/* ---------- TOAST ---------- */
function showToast(message, type = "info") {
    const colors = {
        success: "bg-success",
        error: "bg-danger",
        info: "bg-primary",
        warning: "bg-warning"
    };

    const toast = document.createElement("div");
    toast.className = `
        toast align-items-center text-white ${colors[type] || "bg-primary"}
        border-0 position-fixed bottom-0 end-0 m-3
    `;
    toast.style.zIndex = 9999;

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                onclick="this.closest('.toast').remove()"></button>
        </div>
    `;

    document.body.appendChild(toast);

    new bootstrap.Toast(toast, { delay: 3000 }).show();

    setTimeout(() => toast.remove(), 3500);
}
