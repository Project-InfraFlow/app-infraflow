// ===============================
// GRÁFICO - ALERTAS POR COMPONENTE
// ===============================

// Função principal do gráfico
function carregarGraficoComponentes() {
    console.log("🔄 Iniciando carregamento do gráfico...");
    
    fetch("/alertas-route/graficoComponentes")
        .then(res => {
            if (!res.ok) {
                throw new Error(`Erro HTTP: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("✅ Dados recebidos para o gráfico:", data);

            // Verifica se há dados
            if (!data || data.length === 0) {
                console.warn("⚠️ Nenhum dado retornado para o gráfico");
                return;
            }

            const labels = data.map(d => d.componente);
            const valores = data.map(d => d.qtd);

            // CORREÇÃO: Usa o ID correto do HTML
            const ctx = document.getElementById("myChart");
            
            if (!ctx) {
                console.error("❌ Elemento canvas não encontrado!");
                return;
            }

            // Evita recriar múltiplos gráficos ao atualizar
            if (window.graficoComponentesInstance) {
                window.graficoComponentesInstance.destroy();
            }

            window.graficoComponentesInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quantidade de Alertas',
                        data: valores,
                        backgroundColor: '#003e60ff',
                        borderColor: '#002640ff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Quantidade'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Componentes'
                            }
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.error("❌ Erro ao carregar gráfico:", err);
            // Exibe mensagem de erro no elemento do gráfico
            const ctx = document.getElementById("myChart");
            if (ctx) {
                ctx.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar gráfico: ${err.message}</p>`;
            }
        });
}

// ===============================
// HEATMAP
// ===============================

var horas = [
    "00:00","01:00","02:00","03:00","04:00",
    "05:00","06:00","07:00","08:00","09:00",
    "10:00","11:00","12:00","13:00","14:00",
    "15:00","16:00","17:00","18:00","19:00",
    "20:00","21:00","22:00","23:00"
];

function gerarSerieAleatoria() {
    return horas.map(h => ({
        x: h,
        y: Math.floor(Math.random() * 12)
    }));
}

var options = {
    chart: { 
        height: 350, 
        type: "heatmap",
        toolbar: {
            show: false
        }
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
    series: [
        { name: "CPU", data: gerarSerieAleatoria() },
        { name: "RAM", data: gerarSerieAleatoria() },
        { name: "REDE", data: gerarSerieAleatoria() },
        { name: "DISCO", data: gerarSerieAleatoria() }
    ]
};

// Inicializa heatmap apenas se o elemento existir
function inicializarHeatmap() {
    const heatmapElement = document.querySelector("#chart-heatmap");
    if (heatmapElement) {
        var chart = new ApexCharts(heatmapElement, options);
        chart.render();
        console.log("✅ Heatmap inicializado");
    }
}

// ===============================
// KPIs E FUNÇÕES DO SISTEMA
// ===============================

function kpiAlertasTotais() {
    console.log("📊 Buscando KPI Alertas Totais...");
    fetch('/alertas-route/kpiAlertasTotais', {
        method: "GET"
    })
    .then(res => {
        if (!res.ok) throw new Error(`Erro: ${res.status}`);
        return res.json();
    })
    .then(function (resultado) {
        console.log("✅ KPI Alertas Totais:", resultado);
        var kpitotal = document.getElementById('total-alertas');
        if (resultado && resultado[0]) {
            var alertasTotais = resultado[0].alertasTotais || 0;
            kpitotal.innerHTML = `<p>${alertasTotais}<p>`;
        }
    })
    .catch(error => {
        console.error('❌ Erro ao buscar KPI Geral:', error);
        document.getElementById('total-alertas').innerHTML = `<p>Erro</p>`;
    });
}

function kpiAtencao() {
    console.log("📊 Buscando KPI Atenção...");
    fetch('/alertas-route/kpiAtencao', {
        method: "GET"
    })
    .then(res => {
        if (!res.ok) throw new Error(`Erro: ${res.status}`);
        return res.json();
    })
    .then(function (resultado) {
        console.log("✅ KPI Atenção:", resultado);
        var kpitotal = document.getElementById('alerta-atencao');
        if (resultado && resultado[0]) {
            var atencao = resultado[0].atencao || 0;
            kpitotal.innerHTML = `<p>${atencao}<p>`;
        }
    })
    .catch(error => {
        console.error('❌ Erro ao buscar KPI atencao:', error);
        document.getElementById('alerta-atencao').innerHTML = `<p>Erro</p>`;
    });
}

function kpiCritico() {
    console.log("📊 Buscando KPI Crítico...");
    fetch('/alertas-route/kpiCritico', {
        method: "GET"
    })
    .then(res => {
        if (!res.ok) throw new Error(`Erro: ${res.status}`);
        return res.json();
    })
    .then(function (resultado) {
        console.log("✅ KPI Crítico:", resultado);
        var kpitotal = document.getElementById('alerta-critico');
        if (resultado && resultado[0]) {
            var critico = resultado[0].critico || 0;
            kpitotal.innerHTML = `<p>${critico}<p>`;
        }
    })
    .catch(error => {
        console.error('❌ Erro ao buscar KPI critico:', error);
        document.getElementById('alerta-critico').innerHTML = `<p>Erro</p>`;
    });
}

function kpiStatusAndamento() {
    console.log("📊 Buscando KPI Status Andamento...");
    fetch('/alertas-route/kpiStatusAndamento', {
        method: "GET"
    })
    .then(res => {
        if (!res.ok) throw new Error(`Erro: ${res.status}`);
        return res.json();
    })
    .then(function (resultado) {
        console.log("✅ KPI Status Andamento:", resultado);

        if (resultado && resultado[0]) {
            var semAbertura = resultado[0].sem_abertura || 0;
            var total = resultado[0].total_alertas || 0;

            document.getElementById('kpi-status-andamento').innerHTML = `
                <p style="font-size: 2rem; color: #c0392b;">${semAbertura}/${total}</p>
                <p style="color:#c0392b; font-weight:600;">Sem abertura</p>
            `;
        }
    })
    .catch(error => {
        console.error('❌ Erro ao buscar KPI Status Andamento:', error);
        document.getElementById('kpi-status-andamento').innerHTML = `<p>Erro</p>`;
    });
}

// ===============================
// INICIALIZAÇÃO DO SISTEMA
// ===============================

// Aguarda o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM carregado - inicializando dashboard...");
    
    // Inicializa todas as funções
    kpiAlertasTotais();
    kpiAtencao(); 
    kpiCritico(); 
    kpiStatusAndamento();
    carregarGraficoComponentes();
    inicializarHeatmap();
    
    console.log("✅ Dashboard de alertas inicializado com sucesso!");
});

// Função para atualizar todos os dados (pode ser chamada periodicamente)
function atualizarDashboard() {
    console.log("🔄 Atualizando dashboard...");
    kpiAlertasTotais();
    kpiAtencao(); 
    kpiCritico(); 
    kpiStatusAndamento();
    carregarGraficoComponentes();
}

// Atualiza a cada 30 segundos (opcional)
