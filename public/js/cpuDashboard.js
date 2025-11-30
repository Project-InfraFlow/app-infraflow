function formatarHora(isoString) {
    if (!isoString) return "";
    const data = new Date(isoString);
    if (isNaN(data.getTime())) return "";
    return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

function normalizarNumero(valor) {
    const n = Number(valor);
    return isNaN(n) ? 0 : n;
}

function gerarAlertaBackend(cpu, idle, proc) {
    cpu = normalizarNumero(cpu);
    idle = normalizarNumero(idle);
    proc = normalizarNumero(proc);

    if (cpu > 85) return "CPU ALTO";
    if (cpu > 70) return "CPU MÉDIA";
    if (idle < 30) return "IDLE BAIXO";
    if (idle < 70) return "IDLE MÉDIO";
    if (proc > 400) return "PROCESSOS ALTO";
    if (proc > 250) return "PROCESSOS MÉDIO";
    return null;
}

window.cpuLatenciaChart = null;
window.processosChart = null;

function criarGraficoCpuLatencia() {
    const ctx = document.getElementById("cpuLatenciaChart").getContext("2d");
    window.cpuLatenciaChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                { label: "CPU (%)", data: [], borderColor: "#3b82f6", borderWidth: 3, tension: 0.4 },
                { label: "CPU_Idle (%)", data: [], borderColor: "#f59e0b", borderWidth: 3, tension: 0.4 }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function criarGraficoProcessos() {
    const ctx = document.getElementById("processosChart").getContext("2d");
    window.processosChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Processos em Execução",
                    data: [],
                    borderColor: "#0ea5e9",
                    backgroundColor: "rgba(14,165,233,0.35)",
                    borderWidth: 2,
                    tension: 0.35,
                    fill: true
                }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function carregarAlertasSlack(dados) {
    const painel = document.querySelector(".slack-painel-body");
    painel.innerHTML = "";

    dados.forEach(linha => {
        const alerta = gerarAlertaBackend(linha.cpu, linha.cpuIdle, 0); // processos da API nova não entram aqui
        if (!alerta) return;

        let classe = alerta.includes("ALTO") || alerta.includes("BAIXO") ? "alerta-vermelho" : "alerta-amarelo";

        painel.innerHTML += `
            <div class="alerta-item ${classe}">
                <strong>${alerta}</strong><br>
                ------------------------
                - CPU: ${normalizarNumero(linha.cpu).toFixed(1)}% <br>
                - Idle: ${normalizarNumero(linha.cpuIdle).toFixed(1)}% <br>
                <small>${formatarHora(linha.horario)}</small>
            </div>
        `;
    });

    if (painel.innerHTML.trim() === "") {
        painel.innerHTML = "<p>Nenhum alerta recente.</p>";
    }
}

async function getCpuData() {
    const response = await fetch("/api/cpu?maquinaId=1&limite=30");
    return await response.json();
}

// NOVO: pega processos em tempo real, SEM banco
async function getProcessosData() {
    const response = await fetch("/api/processos");
    return await response.json(); // { total: <numero> }
}

async function atualizarDashboard() {
    // 1) CPU + IDLE continuam vindo do backend / banco
    const response = await getCpuData();
    if (!response || !response.kpi) return;
    console.log(response);

    const cpuMedia = normalizarNumero(response.kpi.cpuMedia);
    const cpuIdle = normalizarNumero(response.kpi.cpuIdle);

    document.getElementById("kpiCpuValue").textContent = `${cpuMedia.toFixed(1)}%`;
    document.getElementById("KpiTempoValue").textContent = `${cpuIdle.toFixed(1)}%`;

    const dados = response.grafico || [];

    // KPI de alertas continua calculada com CPU/Idle
    const totalAlertas = dados.filter(linha =>
        gerarAlertaBackend(
            normalizarNumero(linha.cpu),
            normalizarNumero(linha.cpuIdle),
            0
        ) !== null
    ).length;

    const kpiRedeValue = document.getElementById("kpiRedeValue");
    const kpiCard = document.getElementById("kpiRede");
    const kpiIcon = kpiCard.querySelector(".kpi-icon");
    const progressBar = document.getElementById("redeProgress");

    kpiRedeValue.textContent = totalAlertas;

    if (totalAlertas > 0) {
        kpiIcon.classList.add("kpi-icon-vermelho");
        kpiRedeValue.classList.add("kpi-text-vermelho");
        progressBar.classList.add("progress-bar-vermelho");
    } else {
        kpiIcon.classList.remove("kpi-icon-vermelho");
        kpiRedeValue.classList.remove("kpi-text-vermelho");
        progressBar.classList.remove("progress-bar-vermelho");
    }

    // Gráfico CPU x Tempo Ocioso
    cpuLatenciaChart.data.labels = dados.map(d => formatarHora(d.horario));
    cpuLatenciaChart.data.datasets[0].data = dados.map(d => normalizarNumero(d.cpu));
    cpuLatenciaChart.data.datasets[1].data = dados.map(d => normalizarNumero(d.cpuIdle));
    cpuLatenciaChart.update();

    carregarAlertasSlack(dados);

    // 2) PROCESSOS: somentE leitura, direto da API /api/processos
    try {
        const procResp = await getProcessosData();
        const processosAtual = normalizarNumero(procResp.total);

        // KPI de Processos
        document.getElementById("KpiProcessosValue").textContent = processosAtual.toFixed(0);

        // Gráfico de Processos em Execução (somente em memória, sem banco)
        const agora = new Date();
        const labelHora = agora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        processosChart.data.labels.push(labelHora);
        processosChart.data.datasets[0].data.push(processosAtual);

        // mantém no máximo 30 pontos pra não explodir
        if (processosChart.data.labels.length > 30) {
            processosChart.data.labels.shift();
            processosChart.data.datasets[0].data.shift();
        }

        processosChart.update();
    } catch (e) {
        console.error("Erro ao buscar processos em execução:", e);
    }

    document.getElementById("lastUpdateTime").textContent =
        new Date().toLocaleTimeString("pt-BR");
}

criarGraficoCpuLatencia();
criarGraficoProcessos();
atualizarDashboard();
setInterval(atualizarDashboard, 5000);
