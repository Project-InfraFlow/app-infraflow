// ================================
// GRÁFICO 1 — CPU x LATÊNCIA
// ================================
const ctxCpuLatencia = document
    .getElementById("cpuLatenciaChart")
    .getContext("2d");

new Chart(ctxCpuLatencia, {
    type: "line",
    data: {
        labels: ["10:00", "10:05", "10:10", "10:15", "10:20"], // exemplo
        datasets: [
            {
                label: "CPU (%)",
                data: [70, 75, 78, 82, 80],
                borderColor: "#2563eb",
                backgroundColor: "transparent",
                borderWidth: 2,
                yAxisID: "y1",
                tension: 0.3
            },
            {
                label: "Latência (ms)",
                data: [180, 190, 200, 230, 215],
                borderColor: "#f59e0b",
                backgroundColor: "transparent",
                borderWidth: 2,
                yAxisID: "y2",
                tension: 0.3
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false
        },
        scales: {
            y1: {
                type: "linear",
                position: "left",
                title: {
                    display: true,
                    text: "CPU (%)"
                }
            },
            y2: {
                type: "linear",
                position: "right",
                title: {
                    display: true,
                    text: "Latência (ms)"
                },
                grid: { drawOnChartArea: false }
            }
        }
    }
});


// ================================
// GRÁFICO 2 — PROCESSOS EM EXECUÇÃO (BARRA)
// ================================
const ctxProcessos = document
    .getElementById("processosChart")
    .getContext("2d");

new Chart(ctxProcessos, {
    type: "bar",
    data: {
        labels: ["10:00", "10:05", "10:10", "10:15", "10:20"],
        datasets: [
            {
                label: "Processos em Execução",
                data: [180, 190, 200, 215, 213],
                backgroundColor: "#16a34a",
                borderRadius: 5      // deixa a barra bonitinha
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: "Processos"
                }
            }
        }
    }
});