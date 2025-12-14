async function loadSidebar(activePage) {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    try {
        let sidebarHtml = sessionStorage.getItem("sidebarHtml");

        // 🔥 İlk kez ise fetch
        if (!sidebarHtml) {
            const res = await fetch("partials/sidebar.html");
            if (!res.ok) throw new Error("Sidebar yüklenemedi");
            sidebarHtml = await res.text();
            sessionStorage.setItem("sidebarHtml", sidebarHtml);
        }

        // 🔥 DOM'a bas
        container.innerHTML = sidebarHtml;

        // 🔥 Aktif menü
        container.querySelectorAll("a[data-page]").forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.page === activePage
            );
        });

    } catch (err) {
        console.error("Sidebar yüklenemedi:", err);
        container.innerHTML = `
            <div class="p-3 text-danger">
                Menü yüklenemedi
            </div>
        `;
    }
}
