// js/auth.js

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("error");

    errorBox.classList.add("d-none");
    errorBox.innerText = "";

    if (!username || !password) {
        errorBox.classList.remove("d-none");
        errorBox.innerText = "Kullanıcı adı ve şifre zorunlu.";
        return;
    }

    try {
        const data = await api("/auth/login", "POST", { username, password });

        // TOKEN KAYDET
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("companyId", data.user.companyId);
        localStorage.setItem("username", data.user.username);

        // ⭐ ROLE GÖRE YÖNLENDİRME ⭐
        if (data.user.role === "SUPERADMIN") {
            window.location.href = "superadmin.html";
        }
        else if (data.user.role === "ADMIN") {
            window.location.href = "tevzi.html";
        }
        else {
            // Supervisor veya başka roller için
            window.location.href = "tevzi.html";
        }

    } catch (err) {
        console.error(err);
        errorBox.classList.remove("d-none");
        errorBox.innerText = err.message || "Sunucuya bağlanırken hata oluştu.";
    }
}
