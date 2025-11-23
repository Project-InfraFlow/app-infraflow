document.addEventListener("DOMContentLoaded", () => {
    inicializarSeguranca();
});

function inicializarSeguranca() {
    carregarDadosReais();
    setInterval(carregarDadosReais, 10000); 

async function carregarDadosReais() {
    try {
        await Promise.all([
            carregarStatusOperacao(),
            carregarUsuariosLogados(),
            carregarTentativasAtaque(),
            carregarStatusAcessoFisico(),
            carregarLogsSeguranca(),
            carregarGraficosReais(),
            atualizarResumoSituacao()
        ]);
        atualizarHora();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function carregarStatusOperacao() {
    try {
        const response = await fetch('/api/seguranca/status-operacao');
        const data = await response.json();
        
        document.getElementById('status-operacao').textContent = data.status;
        const statusElement = document.getElementById('status-operacao');
        statusElement.className = 'kpi-value';
        
        if (data.status === 'Atenção') {
            statusElement.classList.add('warning');
        } else if (data.status === 'Crítico') {
            statusElement.classList.add('critical');
        }
    } catch (error) {
        document.getElementById('status-operacao').textContent = 'Erro';
    }
}

async function carregarUsuariosLogados() {
    try {
        const response = await fetch('/api/seguranca/usuarios-logados');
        const data = await response.json();
        document.getElementById('usuarios-logados').textContent = data.total;
    } catch (error) {
        document.getElementById('usuarios-logados').textContent = '0';
    }
}

async function carregarTentativasAtaque() {
    try {
        const response = await fetch('/api/seguranca/tentativas-ataque');
        const data = await response.json();
        document.getElementById('tentativas-ataque').textContent = data.total;
    } catch (error) {
        document.getElementById('tentativas-ataque').textContent = '0';
    }
}

async function carregarStatusAcessoFisico() {
    try {
        const response = await fetch('/api/seguranca/acesso-fisico');
        const data = await response.json();
        document.getElementById('acesso-gabinete').textContent = data.status === 'fechado' ? 'Fechada' : 'Aberta';
    } catch (error) {
        document.getElementById('acesso-gabinete').textContent = 'Erro';
    }
}

async function carregarLogsSeguranca() {
    try {
        const response = await fetch('/api/seguranca/logs');
        const logs = await response.json();
        
        const logsContainer = document.getElementById("cyberLogs");
        logsContainer.innerHTML = '';
        
        logs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            // Define cor baseada na severidade
            if (log.severidade === 'critical') {
                logItem.style.borderLeftColor = '#ef4444';
            } else if (log.severidade === 'warning') {
                logItem.style.borderLeftColor = '#f59e0b';
            } else {
                logItem.style.borderLeftColor = '#10b981';
            }
            
            logItem.innerHTML = `
                <div class="log-time">${new Date(log.data_hora).toLocaleTimeString()}</div>
                <div class="log-desc">${log.descricao}</div>
                ${log.ip_origem ? `<div class="log-ip">IP: ${log.ip_origem}</div>` : ''}
            `;
            
            logsContainer.appendChild(logItem);
        });
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
    }
}

async function carregarGraficosReais() {
    try {
        const [alertasResponse, acessosResponse] = await Promise.all([
            fetch('/api/seguranca/alertas-24h'),
            fetch('/api/seguranca/acessos-tipo')
        ]);
        
        const alertasData = await alertasResponse.json();
        const acessosData = await acessosResponse.json();
        
        criarGraficoAlertas(alertasData);
        criarGraficoAcessos(acessosData);
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

function criarGraficoAlertas(dados) {
    const ctx = document.getElementById("cyberAlertsChart");
    
    if (window.alertaChart) {
        window.alertaChart.destroy();
    }
    
    window.alertaChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dados.horas,
            datasets: [
                { 
                    label: "Tentativas de Ataque", 
                    data: dados.tentativas_ataque,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                },
                { 
                    label: "Alertas de Segurança", 
                    data: dados.alertas_seguranca,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: { 
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Alertas de Segurança - Últimas 24h'
                }
            }
        }
    });
}

function criarGraficoAcessos(dados) {
    const ctx = document.getElementById("cyberAccessChart");
    
    if (window.acessoChart) {
        window.acessoChart.destroy();
    }
    
    window.acessoChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: dados.tipos,
            datasets: [{
                data: dados.quantidades,
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribuição de Acessos por Tipo de Usuário'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function atualizarResumoSituacao() {
    try {
        const response = await fetch('/api/seguranca/resumo-situacao');
        const resumo = await response.json();
        document.getElementById('texto-bob').textContent = resumo.texto;
    } catch (error) {
        document.getElementById('texto-bob').textContent = 'Erro ao carregar resumo.';
    }
}

function atualizarHora() {
    const agora = new Date();
    document.getElementById('lastUpdateTime').textContent = 
        agora.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
}