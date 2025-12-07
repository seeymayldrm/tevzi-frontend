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
        // api.js içindeki fonksiyonu kullanıyoruz
        const res = await fetch(
            (window.location.hostname === "localhost"
                ? "http://localhost:3000/api"
                : "https://tevzi-backend.up.railway.app/api") + "/auth/login",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            errorBox.classList.remove("d-none");
            errorBox.innerText = data.error || "Giriş başarısız.";
            return;
        }

        localStorage.setItem("token", data.token);
        window.location.href = "tevzi.html";
    } catch (err) {
        console.error(err);
        errorBox.classList.remove("d-none");
        errorBox.innerText = "Sunucuya bağlanırken hata oluştu.";
    }
}
