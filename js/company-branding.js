// js/company-branding.js
// Login sonrası localStorage'a yazılan company bilgilerini
// tüm HTML sayfalarına otomatik uygular.

(function () {
    try {
        const companyName = localStorage.getItem("companyName");
        const companyLogo = localStorage.getItem("companyLogo");
        const companyFavicon = localStorage.getItem("companyFavicon");

        /* -----------------------------
           COMPANY NAME
        ------------------------------ */
        const nameEl = document.getElementById("companyName");
        if (nameEl) {
            nameEl.innerText = companyName && companyName.trim()
                ? companyName
                : "Tevzi Panel";
        }

        /* -----------------------------
           COMPANY LOGO
        ------------------------------ */
        const logoEl = document.getElementById("companyLogo");
        if (logoEl && companyLogo) {
            logoEl.src = companyLogo;
            logoEl.onerror = () => {
                // logo URL bozuksa default'a düş
                logoEl.src = "assets/logo.png";
            };
        }

        /* -----------------------------
           FAVICON
        ------------------------------ */
        const faviconEl = document.getElementById("faviconTag");
        if (faviconEl && companyFavicon) {
            faviconEl.href = companyFavicon;
        }

    } catch (err) {
        console.error("Company branding uygulanırken hata:", err);
    }
})();
