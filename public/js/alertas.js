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

var chart = new ApexCharts(document.querySelector("#heatmap-chart"), options);
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

// KPIS DA DASH 

function kpiAlertasTotais() {
  fetch('/alertas-route/kpiAlertasTotais', {
    method: "GET"
  }).then(res => res.json())
    .then(function (resultado) {
      console.log("oiiiiii")
      var kpitotal = document.getElementById('total-alertas')
      var alertasTotais = resultado[0].alertasTotais
      kpitotal.innerHTML = `<p>${alertasTotais}<p>`

    })
}


