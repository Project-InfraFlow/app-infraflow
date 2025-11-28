let ID_MAQUINA = 1;
let updateInterval;
let graficoDiscoUso, graficoDiscoStatus;

const elements = {
    kpiDiscoUsoValue: document.getElementById('kpiMemoriaUsoValue'),
    discoUsoProgress: document.getElementById('memoriaUsoProgress'),
    kpiDiscoLivreValue: document.getElementById('kpiMemoriaLivreValue'),
    discoLivreProgress: document.getElementById('memoriaLivreProgress'),
    kpiDiscoTotalValue: document.getElementById('kpiMemoriaTotalValue'),
    discoTotalProgress: document.getElementById('memoriaTotalProgress'),
    kpiDiscoAlertaValue: document.getElementById('kpiMemoriaAlertaValue'),
    discoAlertaProgress: document.getElementById('memoriaAlertaProgress'),
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    monitorTableBody: document.getElementById('monitorTableBody'),
    historicoTableBody: document.getElementById('historicoTableBody'),
    edgeSelector: document.getElementById('edgeSelector')
};

function inicializarGraficos() {
    const ctxLinha = document.getElementById('grafico_memoria_uso').getContext('2d');
    graficoDiscoUso = new Chart(ctxLinha, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Uso de Disco (%)',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#10b981',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100 },
                x: { grid: { display: false } }
            }
        }
    });

    const ctxStatus = document.getElementById('grafico_memoria_status').getContext('2d');
    graficoDiscoStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Utilizado', 'Livre'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#059669', '#d1fae5'],
                borderColor: 'white',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } },
            cutout: '75%',
        }
    });
}

function configurarNavegacao() {
    document.querySelectorAll('.sidebar .nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');

            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.querySelectorAll('.view-content').forEach(view => view.classList.add('hidden'));

            const selectedView = document.querySelector(`[data-view-content="${viewName}"]`);

            if (selectedView) {
                selectedView.classList.remove('hidden');

                switch (viewName) {
                    case 'overview': carregarDadosOverview(); break;
                    case 'monitor': carregarDadosMonitor(); break;
                    case 'historico': carregarAlertasHistorico(); break;
                }
            }
        });
    });
}

async function carregarDadosOverview() {
    try {
        const response = await fetch(`/api/disco/detalhes/${ID_MAQUINA}`);
        
        if (!response.ok) throw new Error('Erro API');

        const dados = await response.json();

        atualizarKPIs(dados);
        atualizarGraficos(dados);
        atualizarUltimaAtualizacao();

    } catch (error) {
        console.error('Erro ao carregar dados overview (disco):', error);
        elements.kpiDiscoUsoValue.textContent = 'N/D';
    }
}

async function carregarDadosMonitor() {
    try {
        const response = await fetch(`/api/disco/historico/${ID_MAQUINA}?limite=50`);

        if (!response.ok) throw new Error('Erro API');

        const dados = await response.json();
        if (!dados.length) {
            elements.monitorTableBody.innerHTML = '<tr><td colspan="5">Nenhum dado encontrado</td></tr>';
            return;
        }

        atualizarTabelaMonitor(dados);

    } catch (error) {
        console.error('Erro ao monitorar disco:', error);
    }
}

async function carregarAlertasHistorico() {
    try {
        const response = await fetch(`/api/disco/alertas/${ID_MAQUINA}?horas=24`);

        if (!response.ok) throw new Error('Erro API');

        const alertas = await response.json();

        if (!alertas.length) {
            elements.kpiDiscoAlertaValue.textContent = '0';
            elements.discoAlertaProgress.style.width = '0%';
            return;
        }

        atualizarTabelaAlertas(alertas);

        elements.kpiDiscoAlertaValue.textContent = alertas.length;
        elements.discoAlertaProgress.style.width =
            `${Math.min(alertas.length * 10, 100)}%`;

    } catch (error) {
        console.error('Erro ao carregar alertas disco:', error);
    }
}

function atualizarKPIs(dados) {
    elements.kpiDiscoUsoValue.textContent = `${dados.uso_percent.toFixed(1)}%`;
    elements.discoUsoProgress.style.width = `${dados.uso_percent}%`;

    elements.kpiDiscoLivreValue.textContent = `${dados.livre_gb} GB`;
    elements.discoLivreProgress.style.width =
        `${(dados.livre_gb / dados.total_gb) * 100}%`;

    elements.kpiDiscoTotalValue.textContent = `${dados.total_gb} GB`;
    elements.discoTotalProgress.style.width = '100%';

    atualizarCoresKPIs(dados.uso_percent);
}

function atualizarCoresKPIs(usoPercent) {
    const card = document.getElementById('kpiMemoriaUso');
    const bar = elements.discoUsoProgress;

    card.classList.remove('status-normal', 'status-warning', 'status-critical');
    bar.classList.remove('status-normal', 'status-warning', 'status-critical');

    if (usoPercent <= 70) {
        card.classList.add('status-normal');
        bar.classList.add('status-normal');
    } else if (usoPercent <= 90) {
        card.classList.add('status-warning');
        bar.classList.add('status-warning');
    } else {
        card.classList.add('status-critical');
        bar.classList.add('status-critical');
    }
}

function atualizarGraficos(dados) {
    graficoDiscoStatus.data.datasets[0].data = [
        dados.uso_percent,
        100 - dados.uso_percent
    ];

    graficoDiscoStatus.update('none');
    atualizarGraficoLinha();
}

async function atualizarGraficoLinha() {
    try {
        const response = await fetch(`/api/disco/historico/${ID_MAQUINA}?limite=30`);
        if (!response.ok) return;

        const historico = await response.json();
        if (!historico.length) return;

        graficoDiscoUso.data.labels = historico.map(h =>
            new Date(h.data_hora_captura).toLocaleTimeString('pt-BR')
        );
        graficoDiscoUso.data.datasets[0].data = historico.map(h => h.uso_percent);

        graficoDiscoUso.update('none');

    } catch (e) {
        console.error('Erro histórico disco:', e);
    }
}

function atualizarTabelaMonitor(dados) {
    elements.monitorTableBody.innerHTML = '';

    const nomes = {
        1: "INFRA-EDGE-01-Itápolis (SP-333)",
        2: "INFRA-EDGE-02-Jaboticabal (SP-333)",
        3: "INFRA-EDGE-03-São José dos Campos (SP-099)",
        4: "INFRA-EDGE-04-Itaguaí (Km 414)",
    };

    dados.sort((a, b) => new Date(b.data_hora_captura) - new Date(a.data_hora_captura));

    dados.forEach(item => {
        elements.monitorTableBody.innerHTML += `
        <tr>
            <td>${nomes[item.id_maquina]}</td>
            <td>${item.uso_percent.toFixed(1)}%</td>
            <td>${item.livre_gb} GB</td>
            <td>${item.total_gb} GB</td>
            <td>${new Date(item.data_hora_captura).toLocaleString('pt-BR')}</td>
        </tr>`;
    });
}

function atualizarUltimaAtualizacao() {
    elements.lastUpdateTime.textContent =
        new Date().toLocaleTimeString('pt-BR');
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarGraficos();
    configurarNavegacao();
    iniciarAtualizacaoAutomatica();
    configurarEventos();
});

function iniciarAtualizacaoAutomatica() {
    carregarDadosOverview();
    carregarAlertasHistorico();

    updateInterval = setInterval(() => {
        carregarDadosOverview();
    }, 2000);
}

window.addEventListener('beforeunload', () => clearInterval(updateInterval));
