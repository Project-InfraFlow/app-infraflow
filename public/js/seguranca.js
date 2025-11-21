document.addEventListener("DOMContentLoaded", () => {
    carregarGraficos();
    carregarLogsFake();
});

/* ▪▪▪ GRÁFICO 1 — Alertas 24h ▪▪▪ */
function carregarGraficos() {
    const ctx1 = document.getElementById("chart24h");

    new Chart(ctx1, {
        type: "line",
        data: {
            labels: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
            datasets: [
                { label: "Série 1", data: [10, 30, 25, 40, 50] },
                { label: "Série 2", data: [5, 15, 22, 33, 38] },
                { label: "Série 3", data: [8, 18, 28, 35, 29] }
            ]
        },
        options: { responsive: true }
    });

    /* ▪▪▪ GRÁFICO 2 — Tipo de Usuário ▪▪▪ */
    const ctx2 = document.getElementById("chartUsuarios");

    new Chart(ctx2, {
        type: "bar",
        data: {
            labels: ["Item 1", "Item 2", "Item 3", "Item 4"],
            datasets: [
                { label: "Item 1", data: [12, 8, 5, 2] },
                { label: "Item 2", data: [7, 10, 3, 1] },
                { label: "Item 3", data: [14, 4, 6, 3] }
            ]
        },
        options: {
            indexAxis: "y",
            responsive: true
        }
    });
}

/* Logs temporários até integrar backend */
function carregarLogsFake() {
    const logs = [
        "[AUTH] LOGIN_SUCCESS admin – 2025-11-19 13:42",
        "[AUTH] LOGIN_FAIL userjoao – origem 187.55.34.201",
        "[FIREWALL] BLOCK SSH brute force – 185.244.25.77",
        "[API] GET /usuarios/102 – 182ms",
        "[SECURITY] ALERT SQL INJECTION IP 45.93.21.122",
        "[FIREWALL] ALLOW https 10.0.0.4",
        "[AUTH] PASSWORD_CHANGE usuario: financeiro",
        "[DISK] Uso crítico 92%",
        "[APP] ERROR checkout: Null payment ID",
        "[API] POST /eventos/create – 512ms",
        "[SECURITY] MFA_SUCCESS IP 187.2.43.180",
    ];

    const box = document.getElementById("logsBox");
    box.innerText = logs.join("\n\n");
}
