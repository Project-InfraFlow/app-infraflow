 const ctx = document.getElementById('myChart');

 new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['CPU', 'RAM', 'Disco', 'Rede'],
      datasets: [{
    label: 'Quantidade de alertas',
    data: [12, 19, 3, 5],
    backgroundColor: [
        '#003e60ff'  // Rede
    ],
    borderWidth: 1
}]

      
    },
    options: {
      scales: {
        x: {
          ticks: {
            color: '#000000ff',    // cinza
            font: {
              weight: 'bold'  // negrito
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#000000ff',    // cinza
            font: {
              weight: 'bold'  // negrito
            }
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#000000ff',     // cinza
            font: {
              weight: 'bold'   // negrito
            }
          }
        }
      }
    }
});


  // Heatmap
var horas = [
  "00:00","01:00","02:00","03:00","04:00",
  "05:00","06:00","07:00","08:00","09:00",
  "10:00","11:00","12:00","13:00","14:00",
  "15:00","16:00","17:00","18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

function gerarSerieAleatoria() {
  return horas.map(h => ({
    x: h,
    y: Math.floor(Math.random() * 12)  // para testar todas as faixas
  }));
}

var options = {
  chart: {
    height: 350,
    type: "heatmap"
  },
  dataLabels: {
    enabled: false
  },

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

  series: [
    { name: "CPU",   data: gerarSerieAleatoria() },
    { name: "RAM",   data: gerarSerieAleatoria() },
    { name: "REDE",  data: gerarSerieAleatoria() },
    { name: "DISCO", data: gerarSerieAleatoria() }
  ]
};

var chart = new ApexCharts(document.querySelector("#chart-heatmap"), options);
chart.render();


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
      }


// KPIS DA DASH 

function kpiAlertasTotais() {
  fetch('/usuarios/kpiAlertasTotais', {
    method: "GET"
  }).then(res => res.json())
    .then(function (resultado) {
      var kpi = document.getElementById('num-kpi-users')
      var users = resultado[0].usuarios
      kpi.innerHTML = `<p>${users}</p>`

    })
}