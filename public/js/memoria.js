let ID_MAQUINA = 1;
let updateInterval;
let graficoMemoriaUso, graficoMemoriaStatus;

const elements = {
    kpiMemoriaUsoValue: document.getElementById('kpiMemoriaUsoValue'),
    memoriaUsoProgress: document.getElementById('memoriaUsoProgress'),
    kpiMemoriaLivreValue: document.getElementById('kpiMemoriaLivreValue'),
    memoriaLivreProgress: document.getElementById('memoriaLivreProgress'),
    kpiMemoriaTotalValue: document.getElementById('kpiMemoriaTotalValue'),
    memoriaTotalProgress: document.getElementById('memoriaTotalProgress'),
    kpiMemoriaAlertaValue: document.getElementById('kpiMemoriaAlertaValue'),
    memoriaAlertaProgress: document.getElementById('memoriaAlertaProgress'),
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    monitorTableBody: document.getElementById('monitorTableBody'),
    historicoTableBody: document.getElementById('historicoTableBody'),
    edgeSelector: document.getElementById('edgeSelector')
};

function inicializarGraficos() {
    const ctxLinha = document.getElementById('grafico_memoria_uso').getContext('2d');
    graficoMemoriaUso = new Chart(ctxLinha, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Uso de Memória RAM (%)',
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
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Uso (%)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    const ctxStatus = document.getElementById('grafico_memoria_status').getContext('2d');
    graficoMemoriaStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Utilizada', 'Livre'],
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
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            },
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

            document.querySelectorAll('.view-content').forEach(view => {
                view.classList.add('hidden');
            });

            const selectedView = document.querySelector(`[data-view-content="${viewName}"]`);
            if (selectedView) {
                selectedView.classList.remove('hidden');

                switch (viewName) {
                    case 'overview':
                        carregarDadosOverview();
                        break;
                    case 'monitor':
                        carregarDadosMonitor();
                        break;
                    case 'historico':
                        carregarAlertasHistorico();
                        break;
                }
            }
        });
    });
}

async function carregarDadosOverview() {
    try {
        const response = await fetch(`/api/memoria/detalhes/${ID_MAQUINA}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                elements.kpiMemoriaUsoValue.textContent = 'N/D';
                elements.kpiMemoriaLivreValue.textContent = 'N/D';
                elements.kpiMemoriaTotalValue.textContent = '32 GB';
                return;
            }
            throw new Error('Erro na resposta da API');
        }
        
        const dados = await response.json();
        
        if (dados.error) {
            elements.kpiMemoriaUsoValue.textContent = 'Erro';
            return;
        }

        atualizarKPIs(dados);
        atualizarGraficos(dados);
        atualizarUltimaAtualizacao();
        
    } catch (error) {
        console.error('Erro ao carregar dados overview:', error);
        elements.kpiMemoriaUsoValue.textContent = 'Erro';
    }
}

async function carregarDadosMonitor() {
    try {
        const response = await fetch(`/api/memoria/historico/${ID_MAQUINA}?limite=50`);
        
        if (!response.ok) {
            if (response.status === 404) {
                elements.monitorTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum dado histórico disponível</td></tr>';
                return;
            }
            throw new Error('Erro na resposta da API');
        }
        
        const dados = await response.json();
        
        if (dados.error) {
            elements.monitorTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${dados.error}</td></tr>`;
            return;
        }

        if (dados.length > 0) {
            atualizarTabelaMonitor(dados);
        } else {
            elements.monitorTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum dado encontrado</td></tr>';
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do monitor:', error);
        elements.monitorTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Erro ao carregar dados</td></tr>';
    }
}

async function carregarAlertasHistorico() {
    try {
        const response = await fetch(`/api/memoria/alertas/${ID_MAQUINA}?horas=24`);
        
        if (!response.ok) {
            if (response.status === 404) {
                elements.historicoTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum alerta encontrado</td></tr>';
                elements.kpiMemoriaAlertaValue.textContent = '0';
                elements.memoriaAlertaProgress.style.width = '0%';
                return;
            }
            throw new Error('Erro na resposta da API');
        }
        
        const alertas = await response.json();
        
        if (alertas.error) {
            elements.historicoTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${alertas.error}</td></tr>`;
            elements.kpiMemoriaAlertaValue.textContent = '0';
            elements.memoriaAlertaProgress.style.width = '0%';
            return;
        }

        if (alertas.length > 0) {
            atualizarTabelaAlertas(alertas);
            elements.kpiMemoriaAlertaValue.textContent = alertas.length;
            elements.memoriaAlertaProgress.style.width = `${Math.min(alertas.length * 10, 100)}%`;
        } else {
            elements.historicoTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum alerta encontrado</td></tr>';
            elements.kpiMemoriaAlertaValue.textContent = '0';
            elements.memoriaAlertaProgress.style.width = '0%';
        }
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
        elements.historicoTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Erro ao carregar alertas</td></tr>';
        elements.kpiMemoriaAlertaValue.textContent = '0';
        elements.memoriaAlertaProgress.style.width = '0%';
    }
}

function atualizarKPIs(dados) {
    elements.kpiMemoriaUsoValue.textContent = `${dados.uso_percent.toFixed(1)}%`;
    elements.memoriaUsoProgress.style.width = `${dados.uso_percent}%`;

    elements.kpiMemoriaLivreValue.textContent = `${dados.livre_gb} GB`;
    elements.memoriaLivreProgress.style.width = `${(dados.livre_gb / dados.total_gb) * 100}%`;

    elements.kpiMemoriaTotalValue.textContent = `${dados.total_gb} GB`;
    elements.memoriaTotalProgress.style.width = '100%';

    atualizarCoresKPIs(dados.uso_percent);
}

function atualizarCoresKPIs(usoPercent) {
    const kpiUso = document.getElementById('kpiMemoriaUso');
    const progressBar = elements.memoriaUsoProgress;

    kpiUso.classList.remove('status-normal', 'status-warning', 'status-critical');
    progressBar.classList.remove('status-normal', 'status-warning', 'status-critical');

    if (usoPercent <= 53) {
        kpiUso.classList.add('status-normal');
        progressBar.classList.add('status-normal');
    } else if (usoPercent <= 83) {
        kpiUso.classList.add('status-warning');
        progressBar.classList.add('status-warning');
    } else {
        kpiUso.classList.add('status-critical');
        progressBar.classList.add('status-critical');
    }
}

function atualizarGraficos(dados) {
    graficoMemoriaStatus.data.datasets[0].data = [dados.uso_percent, 100 - dados.uso_percent];
    graficoMemoriaStatus.update('none');

    atualizarGraficoLinha();
}

async function atualizarGraficoLinha() {
    try {
        const response = await fetch(`/api/memoria/historico/${ID_MAQUINA}?limite=30`);
        
        if (!response.ok) {
            return;
        }
        
        const historico = await response.json();
        
        if (historico.error) {
            return;
        }

        if (historico.length > 0) {
            const dadosUso = historico.map(item => item.uso_percent);
            const labels = historico.map(item => 
                new Date(item.data_hora_captura).toLocaleTimeString('pt-BR')
            );
            
            graficoMemoriaUso.data.labels = labels;
            graficoMemoriaUso.data.datasets[0].data = dadosUso;
            graficoMemoriaUso.update('none');
        }
    } catch (error) {
        console.error('Erro ao atualizar gráfico de linha:', error);
    }
}

function atualizarTabelaMonitor(dados) {
    const tbody = elements.monitorTableBody;
    tbody.innerHTML = '';

    dados.forEach(item => {
        const row = `
        <tr>
            <td>${document.getElementById('edgeSelector').options[document.getElementById('edgeSelector').selectedIndex].text}</td>
            <td>${item.uso_percent.toFixed(1)}%</td>
            <td>${item.memoria_livre_gb} GB</td>
            <td>${item.memoria_total_gb} GB</td>
            <td>${new Date(item.data_hora_captura).toLocaleString('pt-BR')}</td>
        </tr>
    `;
        tbody.innerHTML += row;
    });
}

function atualizarTabelaAlertas(alertas) {
    const tbody = elements.historicoTableBody;
    tbody.innerHTML = '';

    alertas.forEach(alerta => {
        const row = `
        <tr>
            <td>${alerta.nome_maquina || document.getElementById('edgeSelector').options[document.getElementById('edgeSelector').selectedIndex].text}</td>
            <td>${alerta.descricao}</td>
            <td>${alerta.uso_percent ? alerta.uso_percent.toFixed(1) + '%' : 'N/A'}</td>
            <td>${new Date(alerta.data_hora).toLocaleString('pt-BR')}</td>
            <td>
                <span class="pill ${alerta.uso_percent > 84 ? 'crit' : 'warn'}">
                    ${alerta.uso_percent > 84 ? 'Ação Crítica' : 'Monitorar'}
                </span>
            </td>
        </tr>
    `;
        tbody.innerHTML += row;
    });
}

function atualizarUltimaAtualizacao() {
    const now = new Date();
    elements.lastUpdateTime.textContent = now.toLocaleTimeString('pt-BR');
}

function iniciarAtualizacaoAutomatica() {
    carregarDadosOverview();
    carregarAlertasHistorico();

    updateInterval = setInterval(() => {
        carregarDadosOverview();
        if (Math.floor(Date.now() / 1000) % 120 === 0) {
            carregarAlertasHistorico();
        }
    }, 30000);
}

function configurarEventos() {
    elements.edgeSelector.addEventListener('change', function () {
        ID_MAQUINA = this.value;
        carregarDadosOverview();
        if (document.querySelector('[data-view-content="monitor"]').classList.contains('hidden') === false) {
            carregarDadosMonitor();
        }
        if (document.querySelector('[data-view-content="historico"]').classList.contains('hidden') === false) {
            carregarAlertasHistorico();
        }
    });

    document.getElementById('exportMonitorCsv')?.addEventListener('click', exportarCSVMonitor);
    document.getElementById('exportHistoricoCsv')?.addEventListener('click', exportarCSVHistorico);
}

function exportarCSVMonitor() {
    const rows = [['Pórtico', 'Uso RAM (%)', 'RAM Livre (GB)', 'RAM Total (GB)', 'Horário']];
    const tableRows = elements.monitorTableBody.querySelectorAll('tr');
    
    tableRows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length === 5) {
            rows.push([
                cols[0].textContent,
                cols[1].textContent,
                cols[2].textContent,
                cols[3].textContent,
                cols[4].textContent
            ]);
        }
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "monitor_memoria.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportarCSVHistorico() {
    alert('Funcionalidade de exportação em desenvolvimento');
}

document.addEventListener('DOMContentLoaded', function () {
    inicializarGraficos();
    configurarNavegacao();
    configurarEventos();
    iniciarAtualizacaoAutomatica();
});

window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});