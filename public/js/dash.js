const MAX_REDE_Mbps = 200;
const normalidade = {
    cpu: 70,
    memoria: 75,
    disco: 60,
    rede: 70
};

const uptimeMock = { dias: 3, horas: 4, minutos: 12 };

const toRedePct = (mbps) => Math.max(0, Math.min(100, (mbps / MAX_REDE_Mbps) * 100));

let estadoApp = {
    tempoRealAtivo: true,
    dadosCompletos: [],
    usuarioLogado: false,
    ultimosValoresTrend: {
        cpu: [],
        memoria: [],
        disco: [],
        rede: []
    }
};

let dadosTempoReal = [];
let graficos = {};
let timerDB = null;

async function fetchLeiturasDB(params = { maquinaId: 1, limite: 50 }) {
    try {
        const qs = new URLSearchParams(params).toString();
        const resp = await fetch(`/api/leituras?${qs}`);

        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const arr = await resp.json();
        console.log("API /api/leituras → exemplo recebido:", arr[0]);


        if (!Array.isArray(arr)) {
            throw new Error('Resposta da API não é um array');
        }

        if (arr.length) {
            console.log('Exemplo de leitura da API:', arr[0]);
        }

        const parsed = arr.map(r => {
            const tsBruto = r.horario || r.data_hora_captura || r.timestamp;

            const cpu = Number(
                r.cpu ??
                r.cpu_percent ??
                r.cpuPercent ??
                0
            );

            const memoria = Number(
                r.memoria ??
                r.memoria_percent ??
                r.ram ??              // mantém compat com a versão antiga
                r.memoriaPercent ??
                0
            );

            const disco = Number(
                r.disco ??
                r.disco_percent ??
                r.discoPercent ??
                0
            );

            const rede = Number(
                r.rede ??
                r.rede_mbps ??
                r.rede_percent ??
                r.redePercent ??
                0
            );

            return {
                ts: tsBruto,
                timestamp: tsBruto ? new Date(tsBruto) : new Date(),
                cpu,
                memoria,
                disco,
                rede,
                nucleos: r.nucleos || []
            };
        });


        return parsed;
    } catch (error) {
        console.error('Erro ao buscar leituras:', error);
        throw error;
    }
}

function iniciarPollingDB() {
    pararPollingDB();

    buscarDadosDB();

    timerDB = setInterval(buscarDadosDB, 2000);
}

async function buscarDadosDB() {
    try {
        const dados = await fetchLeiturasDB({ maquinaId: 1, limite: 50 });

        if (dados && dados.length > 0) {
            dadosTempoReal = dados.slice(-50);
            estadoApp.dadosCompletos = dados;

            gerenciadorInterface.atualizarInformacoesSistema();
            gerenciadorInterface.atualizarKPIs();
            gerenciadorInterface.atualizarStatusSistema();

            if (graficos.tempoReal) {
                atualizarGraficoTempoReal();
            }

            atualizarTabelaMonitoramento();

            try {
                const ultimo = dadosTempoReal[dadosTempoReal.length - 1];
                const fonte = document.getElementById('edgeSelector')?.value || 'Pórtico';
                window.evaluatePoint(ultimo, fonte);
            } catch (err) {
                console.error("Erro ao avaliar alertas:", err);
            }
        }
    } catch (error) {
        console.error('Erro no polling:', error);
    }
}

function pararPollingDB() {
    if (timerDB) {
        clearInterval(timerDB);
        timerDB = null;
    }
}

class GerenciadorInterface {
    atualizarInformacoesSistema() {
        const agora = new Date();
        const dt = agora.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const el = document.getElementById('lastUpdateTime');
        if (el) el.textContent = dt;
    }

    atualizarKPIs() {
        if (!dadosTempoReal || dadosTempoReal.length === 0) {
            this.resetarKPIs();
            return;
        }

        const ultimoDado = dadosTempoReal[dadosTempoReal.length - 1];
        const redePct = toRedePct(ultimoDado.rede);

        const comps = [
            {
                key: 'cpu',
                valor: ultimoDado.cpu,
                maxSaudavel: 45,
                maxCritico: 85,
                cardId: 'kpiCpu',
                valueId: 'kpiCpuValue',
                progressId: 'cpuProgress'
            },
            {
                key: 'memoria',
                valor: ultimoDado.memoria,
                maxSaudavel: 53,
                maxCritico: 84,
                cardId: 'kpiMemoria',
                valueId: 'kpiMemoriaValue',
                progressId: 'memoriaProgress'
            },
            {
                key: 'disco',
                valor: ultimoDado.disco,
                maxSaudavel: 60,
                maxCritico: 90,
                cardId: 'kpiDisco',
                valueId: 'kpiDiscoValue',
                progressId: 'discoProgress'
            },
            {
                key: 'rede',
                valor: redePct,
                maxSaudavel: 50,
                maxCritico: 75,
                cardId: 'kpiRede',
                valueId: 'kpiRedeValue',
                progressId: 'redeProgress'
            }
        ];

        comps.forEach(c => {
            const v = Math.max(0, Math.min(100, c.valor));
            const valEl = document.getElementById(c.valueId);
            const progEl = document.getElementById(c.progressId);
            const card = document.getElementById(c.cardId);

            if (valEl) {
                if (c.key === 'rede') {
                    valEl.textContent = `${ultimoDado.rede.toFixed(1)} Mbps`;
                } else {
                    valEl.textContent = `${v.toFixed(1)}%`;
                }
            }

            if (progEl) progEl.style.width = `${v}%`;

            let estado = 'Saudável';
            let cor = '#22c55e';

            if (v > c.maxSaudavel && v <= c.maxCritico) {
                estado = 'Alta Utilização';
                cor = '#facc15';
            } else if (v > c.maxCritico) {
                estado = 'Saturação';
                cor = '#ef4444';
            }

            if (card) {
                let stateEl = card.querySelector('.kpi-state');
                if (!stateEl) {
                    stateEl = document.createElement('span');
                    stateEl.className = 'kpi-state';
                    stateEl.style.cssText = `
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        font-weight: 700;
                        font-size: 12px;
                        margin-left: 8px;
                    `;
                    const labelHost = card.querySelector('.kpi-info') || card.querySelector('.kpi-header') || card;
                    labelHost.appendChild(stateEl);
                }
                stateEl.innerHTML = `<i class="fas fa-circle" style="font-size:8px;color:${cor}"></i><span>${estado}</span>`;

                const progressBar = card.querySelector('.progress-bar');
                if (progressBar) progressBar.style.backgroundColor = cor;
            }
        });
    }

    resetarKPIs() {
        const kpis = [
            { valueId: 'kpiCpuValue', progressId: 'cpuProgress' },
            { valueId: 'kpiMemoriaValue', progressId: 'memoriaProgress' },
            { valueId: 'kpiDiscoValue', progressId: 'discoProgress' },
            { valueId: 'kpiRedeValue', progressId: 'redeProgress' }
        ];

        kpis.forEach(kpi => {
            const valEl = document.getElementById(kpi.valueId);
            const progEl = document.getElementById(kpi.progressId);

            if (valEl) valEl.textContent = kpi.valueId.includes('Rede') ? '0 Mbps' : '0%';
            if (progEl) progEl.style.width = '0%';
        });
    }

    calcularStatusSistema() {
        if (!dadosTempoReal || dadosTempoReal.length === 0) return 'normal';

        const ultimoDado = dadosTempoReal[dadosTempoReal.length - 1];
        const valores = [
            ultimoDado.cpu,
            ultimoDado.memoria,
            ultimoDado.disco,
            toRedePct(ultimoDado.rede)
        ];

        const maxValor = Math.max(...valores);

        if (maxValor > 90) return 'critical';
        if (maxValor > 80) return 'attention';
        return 'normal';
    }

    atualizarStatusSistema() {
        const status = this.calcularStatusSistema();
        const statusElement = document.getElementById('systemStatus');
        const descriptionElement = document.getElementById('statusDescription');

        if (statusElement) {
            statusElement.className = `status-badge ${status}`;

            switch (status) {
                case 'normal':
                    statusElement.textContent = 'Normal';
                    descriptionElement.textContent = 'Todos os componentes operando dentro dos parâmetros normais';
                    break;
                case 'attention':
                    statusElement.textContent = 'Atenção';
                    descriptionElement.textContent = 'Um ou mais componentes próximos do limite de operação';
                    break;
                case 'critical':
                    statusElement.textContent = 'Crítico';
                    descriptionElement.textContent = 'Sistema operando próximo ou acima dos limites críticos';
                    break;
            }
        }

        const uptimeEl = document.getElementById('systemUptime');
        const alertCountEl = document.getElementById('alertCount');

        if (uptimeEl) uptimeEl.textContent = this.calcularUptime();
        if (alertCountEl) alertCountEl.textContent = '0';
    }

    calcularUptime() {
        return `${uptimeMock.dias}d ${uptimeMock.horas}h ${uptimeMock.minutos}m`;
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
    }
}

const gerenciadorInterface = new GerenciadorInterface();

function inicializarGraficos() {
    console.log('Inicializando gráficos...');

    const ctx1 = document.getElementById('realTimeChart');
    if (!ctx1) {
        console.error('Canvas realTimeChart não encontrado!');
        return;
    }

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: { family: 'Inter', size: 12 },
                    color: '#0f172a',
                    filter: (item) => !/\(limite\)/i.test(item.text)
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                font: { family: 'Inter' }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
            },
            x: {
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: {
                    font: { family: 'Inter', size: 11 },
                    color: '#64748b',
                    maxTicksLimit: 10
                }
            }
        },
        animation: { duration: 750, easing: 'easeInOutQuart' },
        interaction: { intersect: false, mode: 'index' }
    };

    graficos.tempoReal = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU (%)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,.1)',
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Memória (%)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,.1)',
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Disco (%)',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,.1)',
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Rede (%)',
                    data: [],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,.1)',
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: commonOptions
    });

    console.log('Gráfico tempo real inicializado');
}

function atualizarGraficoTempoReal() {
    if (!graficos.tempoReal || !dadosTempoReal || dadosTempoReal.length === 0) {
        return;
    }

    const maxPontos = 50;
    const dadosLimitados = dadosTempoReal.slice(-maxPontos);

    graficos.tempoReal.data.labels = dadosLimitados.map(d =>
        new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );

    graficos.tempoReal.data.datasets[0].data = dadosLimitados.map(d => d.cpu);
    graficos.tempoReal.data.datasets[1].data = dadosLimitados.map(d => d.memoria);
    graficos.tempoReal.data.datasets[2].data = dadosLimitados.map(d => d.disco);
    graficos.tempoReal.data.datasets[3].data = dadosLimitados.map(d => toRedePct(d.rede));

    graficos.tempoReal.update('none');
}

function atualizarTabelaMonitoramento() {
    const tbody = document.getElementById('monitorTableBody');
    if (!tbody) return;

    if (!dadosTempoReal || dadosTempoReal.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">Nenhum dado disponível</td></tr>';
        return;
    }

    const dados = dadosTempoReal.slice().reverse().slice(0, 25);
    tbody.innerHTML = '';

    const porticoAtual = document.getElementById('edgeSelector')?.value || 'Pórtico';

    dados.forEach(dado => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${porticoAtual}</td>
            <td>${new Date(dado.timestamp).toLocaleString('pt-BR')}</td>
            <td>${dado.cpu.toFixed(1)}%</td>
            <td>${dado.memoria.toFixed(1)}%</td>
            <td>${dado.disco.toFixed(1)}%</td>
            <td>${dado.rede.toFixed(1)} Mbps</td>
        `;
        tbody.appendChild(tr);
    });

    const totalItens = dadosTempoReal.length;
    const paginationInfo = document.getElementById('monitorPaginationInfo');
    if (paginationInfo) {
        paginationInfo.textContent = `Mostrando ${Math.min(25, totalItens)} de ${totalItens} registros`;
    }
}

function configurarNavegacao() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.getAttribute('data-view');
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

            const targetView = document.getElementById(`view-${view}`);
            if (targetView) {
                targetView.classList.add('active');
            }

            if (view === 'monitor' || view === 'overview') {
                iniciarPollingDB();
            } else {
                pararPollingDB();
            }
        });
    });

    const edgeSelector = document.getElementById('edgeSelector');
    if (edgeSelector) {
        edgeSelector.addEventListener('change', () => {
            dadosTempoReal = [];
            gerenciadorInterface.atualizarInformacoesSistema();
            console.log('Pórtico alterado para:', edgeSelector.value);
        });
    }
}

function configurarCadastro() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

            const targetTab = document.getElementById(`tab-${tab}`);
            if (targetTab) targetTab.classList.add('active');
        });
    });
}

function inicializarDashboard() {
    console.log('🚀 Inicializando Dashboard InfraFlow...');

    const elementosCriticos = [
        'realTimeChart',
        'kpiCpuValue',
        'kpiMemoriaValue',
        'kpiDiscoValue',
        'kpiRedeValue',
        'monitorTableBody'
    ];

    elementosCriticos.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`Elemento crítico não encontrado: ${id}`);
        }
    });

    inicializarGraficos();
    configurarNavegacao();
    configurarCadastro();

    iniciarPollingDB();

    const selectMonitor = document.getElementById("edgeSelector");
    const monitorSpan = document.getElementById("monitor-selecionado");

    if (selectMonitor && monitorSpan) {
        function atualizarTitulo() {
            monitorSpan.textContent = selectMonitor.value ? " - " + selectMonitor.value : "";
        }
        selectMonitor.addEventListener("change", atualizarTitulo);
        atualizarTitulo();
    }

    console.log('✅ Dashboard inicializado com sucesso!');
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM carregado, iniciando dashboard...');
    setTimeout(inicializarDashboard, 100);
});

window.addEventListener('beforeunload', function () {
    pararPollingDB();
});

function exportarCSV(dados, nomeArquivo) {
    if (!dados || dados.length === 0) {
        gerenciadorInterface.mostrarNotificacao('Nenhum dado para exportar', 'error');
        return;
    }

    const cabecalho = ['Data/Hora', 'CPU (%)', 'Memória (%)', 'Disco (%)', 'Rede (Mbps)'];
    let csvContent = cabecalho.join(',') + '\n';

    dados.forEach(dado => {
        const linha = [
            `"${new Date(dado.timestamp).toLocaleString('pt-BR')}"`,
            dado.cpu.toFixed(1),
            dado.memoria.toFixed(1),
            dado.disco.toFixed(1),
            dado.rede.toFixed(1)
        ].join(',');
        csvContent += linha + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    gerenciadorInterface.mostrarNotificacao('Dados exportados com sucesso!', 'success');
}

document.addEventListener('click', function (e) {
    if (e.target.closest('#exportMonitorCsv')) {
        exportarCSV(dadosTempoReal, `infraflow_monitoramento_${new Date().toISOString().slice(0, 10)}.csv`);
    }
});

(function () {
    const SIDEBAR_WIDTH = 360;
    const FEED_MAX = 400;
    const ENDPOINT_ACAO = '/api/incidentes/acao';

    const style = document.createElement('style');
    style.textContent = `
.topbar{position:fixed;top:0;left:0;right:0;height:64px;background:#fff;border-bottom:1px solid #e5e7eb;z-index:10000;display:flex;align-items:center}
body.has-fixed-topbar{padding-top:64px}
#alertsSidebar{position:fixed;right:0;width:${SIDEBAR_WIDTH}px;height:calc(100vh - 64px);z-index:9990;background:#ffffff;border-left:1px solid #e5e7eb;box-shadow:-8px 0 24px rgba(2,6,23,.06);display:flex;flex-direction:column;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
#alertsSidebarHeader{padding:12px 14px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff}
#alertsSidebarHeader .title{font-size:14px;font-weight:700;color:#0f172a}
#alertsSidebarHeader .subtitle{font-size:12px;color:#64748b;font-weight:500}
#alertsSidebarFilterWrap{padding:8px 12px;border-bottom:1px solid #eef2f7}
#alertsSidebarFilter{width:100%;height:36px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;font-size:14px}
#alertsSidebarList{overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.a-card{border-radius:10px;padding:10px 12px;border:1px solid #eef2f7;box-shadow:0 1px 2px rgba(2,6,23,.04)}
.a-card.CRITICO{background:#ef4444;color:#fff}
.a-card.ATENCAO{background:#facc15;color:#0f172a}
.a-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.a-time{font-size:12px;color:inherit}
.a-source{font-weight:700;margin-top:4px}
.a-msg{margin-top:2px}
.a-action{margin-top:8px}
.a-action>button{padding:.38rem .6rem;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;font-size:12px;cursor:pointer}
.a-done{font-size:12px;color:#fff;margin-top:6px}
@media(min-width:1100px){body.with-alerts-sidebar{margin-right:${SIDEBAR_WIDTH}px}}
@media(max-width:1099px){#alertsSidebar{display:none}body.with-alerts-sidebar{margin-right:0}}
`;
    document.head.appendChild(style);

    const sidebar = document.createElement('aside');
    sidebar.id = 'alertsSidebar';
    sidebar.innerHTML = `
  <div id="alertsSidebarHeader">
    <div>
      <div class="title">Alertas Ativos (Todos os Pórticos)</div>
      <div class="subtitle">Feed de Ocorrências</div>
    </div>
    <button id="alertsSidebarToggle" title="Ocultar/mostrar feed" style="border:0;background:#f1f5f9;color:#0f172a;font-weight:700;border-radius:8px;padding:.38rem .6rem;cursor:pointer">
      <i class="fab fa-slack"></i>
    </button>
  </div>
  <div style="padding:8px 12px;">
    <input id="alertsSidebarFilter" type="text" placeholder="Filtrar por texto" style="width:100%;padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;outline:none;">
  </div>
  <div id="alertsSidebarList" aria-live="polite"></div>
`;

    function mountSidebar() {
        if (!document.body.contains(sidebar)) document.body.appendChild(sidebar);
        document.body.classList.add('with-alerts-sidebar', 'has-fixed-topbar');
        fixPositions();
    }

    function fixPositions() {
        const tb = document.querySelector('.topbar') || document.getElementById('topbar');
        const h = tb ? tb.offsetHeight : 64;
        sidebar.style.top = h + 'px';
        sidebar.style.height = `calc(100vh - ${h}px)`;
        document.body.style.paddingTop = h + 'px';
    }

    window.addEventListener('resize', fixPositions);
    document.addEventListener('DOMContentLoaded', () => {
        mountSidebar();
        setTimeout(fixPositions, 0);
    });

    const state = { feed: [], filterText: '' };

    function normalizeLevel(l) {
        const v = String(l || '').toUpperCase();
        if (v === 'CRITICAL' || v === 'CRITICO' || v === 'CRÍTICO') return 'CRITICO';
        return 'ATENCAO';
    }

    function setAlertCountFromDOM() {
        const c = document.querySelectorAll('#alertsSidebarList .a-card:not([data-hidden="1"])').length;
        const lbl = document.getElementById('alertCount');
        if (lbl) lbl.textContent = String(c);
    }

    function applyFilter() {
        const q = state.filterText.trim().toLowerCase();
        const list = document.getElementById('alertsSidebarList');
        if (!list) return;
        const cards = list.querySelectorAll('.a-card');
        cards.forEach(card => {
            const txt = card.textContent.toLowerCase();
            const match = q === '' ? true : txt.includes(q);
            card.style.display = match ? '' : 'none';
            card.dataset.hidden = match ? '' : '1';
        });
        setAlertCountFromDOM();
    }

    function prependAlertCard(item) {
        const list = document.getElementById('alertsSidebarList');
        if (!list) return;
        const level = normalizeLevel(item.level);
        const obj = { id: item.id || (Date.now() + ''), level, source: item.source, msg: item.msg, time: item.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
        state.feed.unshift(obj);
        if (state.feed.length > FEED_MAX) state.feed.pop();
        const card = document.createElement('div');
        card.className = 'a-card ' + obj.level;
        card.dataset.alertId = obj.id;
        card.innerHTML = `
      <div class="a-head">
        <span class="a-time">${obj.time}</span>
        <span class="a-level" style="font-size:12px; font-weight:800; color:#0f172a">${obj.level === 'CRITICO' ? 'CRÍTICO' : 'ATENÇÃO'}</span>
      </div>
      <div class="a-source">${obj.source}</div>
      <div class="a-msg">${obj.msg}</div>
      <div class="a-action">
        <button class="btn-action" data-id="${card.dataset.alertId}">Ação</button>
      </div>
    `;
        list.prepend(card);
        list.scrollTop = 0;
        applyAlertsFilter();
        syncAlertCount();
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'alertsSidebarClear') {
            state.feed = [];
            const list = document.getElementById('alertsSidebarList');
            if (list) list.innerHTML = '';
            setAlertCountFromDOM();
        }
    });

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-action');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const card = btn.closest('.a-card');
        const item = state.feed.find(x => String(x.id) === String(id));
        if (!item) return;
        const acao = window.prompt('Descreva a ação tomada para este incidente:', '');
        if (acao === null) return;
        const payload = { alertId: id, source: item.source, level: item.level, message: item.msg, time: item.time, action: acao };
        try {
            const resp = await fetch(ENDPOINT_ACAO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!resp.ok) throw new Error('Falha ao salvar ação');
            item.action = acao;
            item.actionTime = new Date().toLocaleString('pt-BR');
            btn.textContent = 'Registrado';
            btn.disabled = true;
            btn.style.background = '#0ea5e9';
            btn.style.cursor = 'default';
            const done = document.createElement('div');
            done.className = 'a-done';
            done.textContent = `Ação: ${item.action} • ${item.actionTime}`;
            card.appendChild(done);
        } catch (err) {
            alert('Erro ao registrar ação: ' + err.message);
        }
    });

    window.pushAlert = function ({ level = 'INFO', source = 'Pórtico', msg = '', time = null, id = null }) {
        prependAlertCard({ id: id || Date.now() + Math.random().toString(16).slice(2), level, source, msg, time: time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    };

    function seedMany(qtd = 36) {
        const fontes = ['INFRA-EDGE-01 (SP-333)', 'INFRA-EDGE-02 (SP-333)', 'INFRA-EDGE-03 (SP-099)', 'INFRA-EDGE-04 (Km 414)'];
        const levels = ['ATENÇÃO', 'CRITICO'];
        const msgs = [
            'CPU ultrapassou 70% de uso, iniciar monitoramento intensivo.',
            'CPU acima de 85%, risco de saturação iminente.',
            'Memória RAM acima de 75%, desempenho pode ser afetado.',
            'Memória RAM em 85%, limite crítico atingido.',
            'Disco acima de 80%, espaço disponível em nível de atenção.',
            'Disco acima de 90%, risco de saturação do armazenamento.',
            'Rede com uso acima de 70%, tráfego em nível de atenção.',
            'Rede acima de 85%, possível saturação no enlace.',
            'CPU e Memória simultaneamente em alta utilização.'
        ];
        const now = new Date();
        for (let i = qtd - 1; i >= 0; i--) {
            const t = new Date(now.getTime() - i * 90 * 1000);
            prependAlertCard({ id: 'seed-' + i, level: levels[Math.floor(Math.random() * levels.length)], source: fontes[Math.floor(Math.random() * fontes.length)], msg: msgs[Math.floor(Math.random() * msgs.length)], time: t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
        }
    }

    const lastCross = { cpu: false, memoria: false, disco: false, rede: false };
    function evaluatePoint(ponto, fonte = "Sistema") {
        if (!ponto) return;

        const hora = new Date().toLocaleTimeString("pt-BR");
        const last = window._lastCrossState || {};
        window._lastCrossState = last;

        function cross(key, cond, level, msg) {
            if (cond && !last[key]) {
                pushAlert({
                    id: Date.now() + "-" + key,
                    time: hora,
                    level: level,
                    source: fonte,
                    msg: msg
                });
            }
            last[key] = cond;
        }

        // CPU
        cross(
            "cpu_crit",
            ponto.cpu >= 85,
            "CRITICO",
            `CPU em ${ponto.cpu.toFixed(1)}% — Acima do limite crítico`
        );

        cross(
            "cpu_warn",
            ponto.cpu >= 70 && ponto.cpu < 85,
            "ATENCAO",
            `CPU em ${ponto.cpu.toFixed(1)}% — Utilização elevada`
        );

        // MEMÓRIA
        cross(
            "mem_crit",
            ponto.memoria >= 85,
            "CRITICO",
            `Memória em ${ponto.memoria.toFixed(1)}% — Acima do limite crítico`
        );

        cross(
            "mem_warn",
            ponto.memoria >= 70 && ponto.memoria < 85,
            "ATENCAO",
            `Memória em ${ponto.memoria.toFixed(1)}% — Utilização elevada`
        );

        // DISCO
        cross(
            "disk_crit",
            ponto.disco >= 90,
            "CRITICO",
            `Disco em ${ponto.disco.toFixed(1)}% — Acima do limite crítico (risco de travamento)`
        );

        cross(
            "disk_warn",
            ponto.disco >= 80 && ponto.disco < 90,
            "ATENCAO",
            `Disco em ${ponto.disco.toFixed(1)}% — Utilização elevada`
        );

        // REDE (exemplo: acima de 180 Mbps saturação)
        cross(
            "network_crit",
            ponto.rede >= 180,
            "CRITICO",
            `Rede em ${ponto.rede.toFixed(1)} Mbps — Saturação crítica detectada`
        );

        cross(
            "network_warn",
            ponto.rede >= 120 && ponto.rede < 180,
            "ATENCAO",
            `Rede em ${ponto.rede.toFixed(1)} Mbps — Tráfego muito alto`
        );
    }
    window.evaluatePoint = evaluatePoint;

    const patchAlerts = () => {
        if (!window.gerenciadorInterface) return;
        const original = gerenciadorInterface.atualizarAlertas?.bind(gerenciadorInterface);
        gerenciadorInterface.atualizarAlertas = () => {
            if (!window.dadosTempoReal || !dadosTempoReal.length) return;
            const u = dadosTempoReal[dadosTempoReal.length - 1];
            const fonte = document.getElementById('edgeSelector')?.value || (window.maquina && maquina.nome) || 'Pórtico';
            evaluatePoint(u, fonte);
            if (original) original();
            setAlertCountFromDOM();
        };
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchAlerts);
    } else {
        patchAlerts();
    }

    const filterInputHandler = (e) => {
        state.filterText = e.target.value || '';
        applyFilter();
    };
    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'alertsSidebarFilter') filterInputHandler(e);
    });

    window.SIDEBAR_WIDTH = SIDEBAR_WIDTH;

    function applyAlertsFilter() {
        const q = (document.getElementById('alertsSidebarFilter')?.value || '').trim().toLowerCase();
        const list = document.getElementById('alertsSidebarList');
        if (!list) return;
        const nodes = Array.from(list.children);
        nodes.forEach(card => {
            const txt = card.textContent.toLowerCase();
            card.style.display = q && !txt.includes(q) ? 'none' : '';
        });
    }
    function syncAlertCount() {
        const list = document.getElementById('alertsSidebarList');
        const visible = list ? Array.from(list.children).filter(c => c.style.display !== 'none').length : 0;
        const el = document.getElementById('alertCount');
        if (el) el.textContent = String(visible);
    }
    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'alertsSidebarFilter') {
            applyAlertsFilter();
            syncAlertCount();
        }
    });

})();

let sidebarVisible = true;
let floatingBtn = null;

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#alertsSidebarToggle');
    if (!btn) return;

    const sidebar = document.getElementById('alertsSidebar');
    if (!sidebar) return;

    sidebarVisible = !sidebarVisible;

    if (!sidebarVisible) {
        sidebar.style.transform = `translateX(${window.SIDEBAR_WIDTH || 360}px)`;
        document.body.classList.remove('with-alerts-sidebar');

        if (!floatingBtn) {
            floatingBtn = document.createElement('button');
            floatingBtn.id = 'floatingSlackBtn';
            floatingBtn.innerHTML = `<img src="https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png" 
  alt="Slack" width="24" height="24">`;
            floatingBtn.title = 'Mostrar alertas';
            floatingBtn.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background-color: #f1f5f9;
        color: #0f172a;
        font-size: 20px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, transform 0.2s;
      `;
            floatingBtn.addEventListener('mouseenter', () => {
                floatingBtn.style.backgroundColor = '#e2e8f0';
                floatingBtn.style.transform = 'scale(1.05)';
            });
            floatingBtn.addEventListener('mouseleave', () => {
                floatingBtn.style.backgroundColor = '#f1f5f9';
                floatingBtn.style.transform = 'scale(1)';
            });
            floatingBtn.addEventListener('click', () => {
                sidebar.style.transform = 'translateX(0)';
                document.body.classList.add('with-alerts-sidebar');
                sidebarVisible = true;
                floatingBtn.remove();
                floatingBtn = null;
            });
            document.body.appendChild(floatingBtn);
        }
    }

    else {
        sidebar.style.transform = 'translateX(0)';
        document.body.classList.add('with-alerts-sidebar');
        if (floatingBtn) {
            floatingBtn.remove();
            floatingBtn = null;
        }
    }
});