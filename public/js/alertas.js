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

// === STATUS DO SISTEMA (UPTIME + ALERTAS) ===

// Armazena o início do uptime
let uptimeStart = new Date();

// Contador para a tela
function formatarUptime(ms) {
    const totalSeg = Math.floor(ms / 1000);
    const dias = Math.floor(totalSeg / 86400);
    const horas = Math.floor((totalSeg % 86400) / 3600);
    const min = Math.floor((totalSeg % 3600) / 60);
    return `${dias}d ${horas}h ${min}m`;
}

// Checa se algum valor está crítico
function componenteCritico(cpu, ram, disco, rede) {
    if (cpu > 85) return true;
    if (ram > 84) return true;
    if (disco > 90) return true;
    if (rede >= 75) return true;
    return false;
}

// Pega alertas ativos do dia
async function contarAlertasHoje() {
    try {
        const resp = await fetch("/api/alertas/dia");
        const json = await resp.json();
        return json.total || 0;
    } catch (e) {
        console.error("Erro ao buscar alertas diários:", e);
        return 0;
    }
}

// Atualiza Status do Sistema
async function atualizarStatusSistema(leitura) {
    const { cpu, ram, disco, rede } = leitura;

    const alertasHoje = await contarAlertasHoje();
    document.getElementById("alertCount").innerText = alertasHoje;

    const houveCritico = componenteCritico(cpu, ram, disco, rede);

    if (houveCritico) {
        uptimeStart = new Date(); // zera uptime
        document.getElementById("systemStatus").innerText = "Crítico";
        document.getElementById("systemStatus").classList.add("critico");
        document.getElementById("statusDescription").innerText = "Um ou mais componentes estão acima do limite seguro";
    } else {
        document.getElementById("systemStatus").innerText = "Normal";
        document.getElementById("systemStatus").classList.remove("critico");
        document.getElementById("statusDescription").innerText = "Todos os componentes operando dentro dos parâmetros normais";
    }

    const agora = new Date();
    const uptimeMs = agora - uptimeStart;

    document.getElementById("systemUptime").innerText = formatarUptime(uptimeMs);
}

// ajustes

// Adicione estas variáveis globais no início do seu script
let systemStartTime = new Date(); // Tempo de início do serviço
let lastAlertTime = null; // Último tempo em que houve alerta
let currentUptime = 0; // Uptime acumulado em segundos
let isSystemNormal = true; // Status atual do sistema
let alertCount = 0; // Contador de alertas ativos

// Função para formatar o tempo em dias, horas e minutos
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    return `${days}d ${hours}h ${minutes}m`;
}

// Função para atualizar o status do sistema
function updateSystemStatus() {
    const systemStatusElement = document.getElementById('systemStatus');
    const statusDescriptionElement = document.getElementById('statusDescription');
    const systemUptimeElement = document.getElementById('systemUptime');
    const alertCountElement = document.getElementById('alertCount');

    // Atualiza o uptime apenas se o sistema estiver normal
    if (isSystemNormal) {
        currentUptime++;
        systemUptimeElement.textContent = formatUptime(currentUptime);
    }

    // Atualiza contador de alertas
    alertCountElement.textContent = alertCount;
}

// Função para verificar se há alertas críticos
function checkForCriticalAlerts() {
    // Esta função deve ser integrada com sua lógica de monitoramento
    // Por enquanto, vamos simular a verificação

    const cpuValue = parseInt(document.getElementById('kpiCpuValue').textContent) || 0;
    const memoriaValue = parseInt(document.getElementById('kpiMemoriaValue').textContent) || 0;
    const discoValue = parseInt(document.getElementById('kpiDiscoValue').textContent) || 0;
    const redeValue = parseInt(document.getElementById('kpiRedeValue').textContent) || 0;

    // Verifica se algum componente está em estado crítico (baseado na sua legenda)
    const hasCriticalAlert =
        cpuValue > 85 ||
        memoriaValue > 84 ||
        discoValue > 90 ||
        redeValue > 74;

    return hasCriticalAlert;
}


function updateStatusSystem() {
    const hasCriticalAlerts = checkForCriticalAlerts();

    if (hasCriticalAlerts) {
        if (isSystemNormal) {
            isSystemNormal = false;
            currentUptime = 0;
            lastAlertTime = new Date();
            alertCount++;

            document.getElementById('systemStatus').textContent = 'Crítico';
            document.getElementById('systemStatus').className = 'status-badge critical';
            document.getElementById('statusDescription').textContent = 'Um ou mais componentes necessitam de atenção imediata';
            document.getElementById('systemUptime').textContent = formatUptime(0);
        }
    } else {
        if (!isSystemNormal) {
            isSystemNormal = true;
            alertCount = Math.max(0, alertCount - 1);
        }

        document.getElementById('systemStatus').textContent = 'Normal';
        document.getElementById('systemStatus').className = 'status-badge normal';
        document.getElementById('statusDescription').textContent = 'Todos os componentes operando dentro dos parâmetros normais';

        updateSystemStatus();
    }
}

function updateSystemStatus() {
    if (isSystemNormal) {
        currentUptime++;
        document.getElementById('systemUptime').textContent = formatUptime(currentUptime);
    }

    document.getElementById('alertCount').textContent = alertCount;
}

function updateSystemStatus() {
    if (isSystemNormal) {
        currentUptime++;
        document.getElementById('systemUptime').textContent = formatUptime(currentUptime);
    }

    document.getElementById('alertCount').textContent = alertCount;
}

function initializeStatusSystem() {
    systemStartTime = new Date();
    lastAlertTime = null;
    currentUptime = 0;
    isSystemNormal = true;
    alertCount = 0;

    document.getElementById('systemUptime').textContent = formatUptime(0);
    document.getElementById('alertCount').textContent = '0';

    setInterval(updateStatusSystem, 1000);
}

const style = document.createElement('style');
style.textContent = `
    .status-badge.normal {
        background-color: #10b981;
        color: white;
    }
    .status-badge.critical {
        background-color: #ef4444;
        color: white;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function () {
    initializeStatusSystem();

    setInterval(updateSystemStatus, 1000);
});

function gerarDadosMockadosMonitoramento() {
    const dados = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        const data = new Date(now);
        data.setSeconds(data.getSeconds() - i * 2);

        const baseCPU = Math.random() > 0.7 ? Math.random() * 40 + 25 : Math.random() * 20;
        const baseMemoria = Math.random() > 0.7 ? Math.random() * 30 + 55 : Math.random() * 50 + 30;
        const baseDisco = Math.random() > 0.8 ? Math.random() * 15 + 75 : Math.random() * 60;
        const baseRede = Math.random() * 3 + 0.5;

        dados.push({
            portico: 'INFRA-EDGE-01-Itápolis (SP-333)',
            horario: data.toLocaleString('pt-BR'),
            cpu: baseCPU.toFixed(1),
            memoria: baseMemoria.toFixed(1),
            disco: baseDisco.toFixed(1),
            rede: baseRede.toFixed(1)
        });
    }

    return dados;
}

function preencherTabelaMonitoramento() {
    const tbody = document.getElementById('monitorTableBody');
    const dados = gerarDadosMockadosMonitoramento();

    tbody.innerHTML = '';

    dados.forEach(registro => {
        const tr = document.createElement('tr');

        const cpuClass = registro.cpu > 85 ? 'critical-value' : registro.cpu > 45 ? 'warning-value' : '';
        const memoriaClass = registro.memoria > 84 ? 'critical-value' : registro.memoria > 53 ? 'warning-value' : '';
        const discoClass = registro.disco > 90 ? 'critical-value' : registro.disco > 80 ? 'warning-value' : '';
        const redeClass = registro.rede > 75 ? 'critical-value' : registro.rede > 50 ? 'warning-value' : '';

        tr.innerHTML = `
            <td>${registro.portico}</td>
            <td>${registro.horario}</td>
            <td class="${cpuClass}">${registro.cpu}%</td>
            <td class="${memoriaClass}">${registro.memoria}%</td>
            <td class="${discoClass}">${registro.disco}%</td>
            <td class="${redeClass}">${registro.rede} Mbps</td>
        `;

        tbody.appendChild(tr);
    });

    document.getElementById('monitorPaginationInfo').textContent = `Mostrando ${dados.length} de ${dados.length} registros`;
    document.getElementById('monitorPageInfo').textContent = 'Página 1 de 1';
}

function configurarExportCSV() {
    document.getElementById('exportMonitorCsv').addEventListener('click', function () {
        const dados = gerarDadosMockadosMonitoramento();
        let csv = 'Pórtico,Horário,CPU (%),Memória (%),Disco (%),Rede (Mbps)\n';

        dados.forEach(registro => {
            csv += `"${registro.portico}","${registro.horario}",${registro.cpu},${registro.memoria},${registro.disco},${registro.rede}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'monitoramento_dados.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        alert('CSV exportado com sucesso!');
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view === 'monitor') {
                setTimeout(() => {
                    preencherTabelaMonitoramento();
                    configurarExportCSV();
                }, 100);
            }
        });
    });

    if (document.getElementById('view-monitor').classList.contains('active')) {
        preencherTabelaMonitoramento();
        configurarExportCSV();
    }
});



 
 
 // alertas


// ---------------- HEATMAP ----------------
function carregarHeatmap() {
    fetch("/alertas-route/heatmapAlertasHoraComponente")
        .then(res => res.status === 204 ? [] : res.json())
        .then(dados => {

            const horas = [
                "00:00", "01:00", "02:00", "03:00", "04:00",
                "05:00", "06:00", "07:00", "08:00", "09:00",
                "10:00", "11:00", "12:00", "13:00", "14:00",
                "15:00", "16:00", "17:00", "18:00", "19:00",
                "20:00", "21:00", "22:00", "23:00"
            ];

            // Estrutura: { CPU: { "00": 3, "01": 0, ... } }
            const componentesMap = {};

            dados.forEach(item => {
                if (!componentesMap[item.componente]) {
                    componentesMap[item.componente] = {};
                }
                componentesMap[item.componente][item.hora] = item.total_alertas;
            });

            // Converter para series do ApexCharts
            const series = Object.keys(componentesMap).map(componente => {
                const horasFormatadas = horas.map((label, index) => {
                    return {
                        x: label,
                        y: componentesMap[componente][index] || 0
                    };
                });

                return {
                    name: componente.toUpperCase(),
                    data: horasFormatadas
                };
            });

            atualizarHeatmap(series);
        })
        .catch(err => console.error("Erro no Heatmap:", err));
}

var chartHeatmap;

function atualizarHeatmap(seriesHeatmap) {
    if (chartHeatmap) {
        chartHeatmap.updateSeries(seriesHeatmap);
        return;
    }

    var optionsHeatmap = {
        chart: {
            height: 350,
            type: "heatmap"
        },
        dataLabels: { enabled: false },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0,
                radius: 0,
                colorScale: {
                    ranges: [
                        { from: 0, to: 1, color: "#CFCFCF", name: "baixo" },
                        { from: 2, to: 4, color: "#FFE066", name: "medio" },
                        { from: 5, to: 8, color: "#F5A3A3", name: "alto" },
                        { from: 9, to: 999, color: "#B53628", name: "pico" }
                    ]
                }
            }
        },
        series: seriesHeatmap
    };

    chartHeatmap = new ApexCharts(
        document.querySelector("#heatmap-chart"),
        optionsHeatmap
    );

    chartHeatmap.render();
}

document.addEventListener("DOMContentLoaded", () => {
    carregarHeatmap();
});




// ---------------- BARRAS (ALERTAS POR COMPONENTE) ----------------

var chartBarras;

var optionsBarras = {
  
    series: [{
        name: "Alertas",
        data: [] 
    }],
    chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false }
    },
    colors: ['#C7C7C7'],
    plotOptions: {
        bar: {
            borderRadius: 4,
            columnWidth: '45%',
            distributed: false
        }
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: [], 
        labels: {
            style: {
                colors: ['#555', '#555', '#555', '#555'],
                fontSize: '12px'
            }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        labels: {
            style: { colors: '#777' }
        }
    },
    grid: {
        borderColor: '#e6e6e6',
        strokeDashArray: 3
    },
    legend: { show: false }
};

function kpiAlertasPorComponente() {
    fetch('/alertas-route/kpiAlertasPorComponente', { method: "GET" })
    .then(res => {

        console.log("GRAFICO COMPONENTES")
        if (res.status === 204) {
            console.warn("Nenhum resultado encontrado. Plotando gráfico vazio.");
            return [];
        }

        return res.json();
    })
    .then(resultado => {

        // Se não veio nada, plota gráfico vazio
        if (!resultado || resultado.length === 0) {
            chartBarras.updateOptions({ xaxis: { categories: [] } });
            chartBarras.updateSeries([{ data: [] }]);
            return;
        }

        // Montagem dinâmica
        const categorias = resultado.map(item => item.nome_componente.toUpperCase());
        const dados = resultado.map(item => item.total_alertas);

        chartBarras.updateOptions({
            xaxis: { categories: categorias }
        });

        chartBarras.updateSeries([{ data: dados }]);

    })
    .catch(err => {
        console.error("Erro no gráfico:", err);

        chartBarras.updateOptions({ xaxis: { categories: [] } });
        chartBarras.updateSeries([{ data: [] }]);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  
    chartBarras = new ApexCharts(document.querySelector("#componentes-chart"), optionsBarras);
    chartBarras.render(); 

    
});


let alertaSelecionado = null;

function abrirModalRegistrar(id_alerta) {
    alertaSelecionado = id_alerta;
    document.getElementById("descricaoOcorrencia").value = "";
    document.getElementById("modalOcorrencia").classList.remove("hidden");
}

function fecharModal() {
    document.getElementById("modalOcorrencia").classList.add("hidden");
}
