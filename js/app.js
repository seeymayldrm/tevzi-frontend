// Sayfa yüklenince token yoksa login'e at
if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
