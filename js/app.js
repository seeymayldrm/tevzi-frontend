// js/app.js

if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
function toggleMenu() {
    document.querySelector(".sidebar").classList.toggle("open");
}
