// js/api.js

// Lokal geliştirme ve Railway prod arasında otomatik seçim
const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://tevzi-backend.up.railway.app/api"; // Railway backend URL'in

async function api(path, method = "GET", data = null) {
    const token = localStorage.getItem("token");

    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (token) {
        options.headers["Authorization"] = "Bearer " + token;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    const res = await fetch(API_BASE + path, options);

    let json;
    try {
        json = await res.json();
    } catch (e) {
        json = { error: "Beklenmeyen hata" };
    }

    if (!res.ok) {
        throw new Error(json.error || "İstek sırasında hata oluştu");
    }

    return json;
}
