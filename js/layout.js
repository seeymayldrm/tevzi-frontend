async function loadSidebar(activePage) {
    const container = document.getElementById("sidebarContainer");
    if (!container) return;

    try {
        const res = await fetch("partials/sidebar.html");
        const html = await res.text();
        container.innerHTML = html;

        // ACTIVE LINK
        container.querySelectorAll("a[data-page]").forEach(link => {
            if (link.dataset.page === activePage) {
                link.classList.add("active");
            }
        });

    } catch (err) {
        console.error("Sidebar yüklenemedi:", err);
    }
}
