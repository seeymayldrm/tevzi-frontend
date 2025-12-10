// js/app.js

if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}

const role = localStorage.getItem("role");

document.addEventListener("DOMContentLoaded", () => {
    if (role === "SUPERVISOR") {
        hideElement("#menu-personnel");
        hideElement("#menu-card");
        hideElement("#menu-settings");
    }

    if (role !== "SUPERADMIN") {
        hideElement("#menu-superadmin");
    }
});

function hideElement(sel) {
    const el = document.querySelector(sel);
    if (el) el.style.display = "none";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

function toggleMenu() {
    document.querySelector(".sidebar").classList.toggle("open");
}
