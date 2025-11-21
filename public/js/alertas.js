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