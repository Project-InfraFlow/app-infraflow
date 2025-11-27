async function getLeituras() {
    const response = await fetch("http://localhost:3000/leituras?maquinaId=1&limite=30");
    return await response.json();
}



const ctxCpuLatencia = document
    .getElementById("cpuLatenciaChart")
    .getContext("2d");

let cpuLatenciaChart = new Chart(ctxCpuLatencia, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "CPU (%)",
                data: [],
                borderColor: "#2563eb",
                backgroundColor: "transparent",
                borderWidth: 2,
                yAxisID: "y1",
                tension: 0.3
            },
            {
                label: "Latência (ms)",
                data: [],
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
        animation: false,
        interaction: {
            mode: "index",
            intersect: false
        },
        scales: {
            y1: {
                type: "linear",
                position: "left",
                title: { display: true, text: "CPU (%)" }
            },
            y2: {
                type: "linear",
                position: "right",
                title: { display: true, text: "Latência (ms)" },
                grid: { drawOnChartArea: false }
            }
        }
    }
});



const ctxProcessos = document
    .getElementById("processosChart")
    .getContext("2d");

let processosChart = new Chart(ctxProcessos, {
    type: "bar",
    data: {
        labels: [],
        datasets: [
            {
                label: "Processos em Execução",
                data: [],
                backgroundColor: "#16a34a",
                borderRadius: 5
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
                title: { display: true, text: "Processos" }
            }
        }
    }
});


async function atualizarGraficos() {

    const dados = await getLeituras();

    cpuLatenciaChart.data.labels = dados.map(d => d.hora);
    cpuLatenciaChart.data.datasets[0].data = dados.map(d => d.cpu);
    cpuLatenciaChart.data.datasets[1].data = dados.map(d => d.latencia);
    cpuLatenciaChart.update();

    processosChart.data.labels = dados.map(d => d.hora);
    processosChart.data.datasets[0].data = dados.map(d => d.processos);
    processosChart.update();
}



setInterval(atualizarGraficos, 5000);

atualizarGraficos();