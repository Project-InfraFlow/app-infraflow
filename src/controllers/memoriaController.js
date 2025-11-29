var memoriaModel = require("../models/memoriaModel");

function getDetalhes(req, res) {
    var idMaquina = req.params.idMaquina || 1;
    
    memoriaModel.buscarUltimaLeituraMemoria(idMaquina)
        .then(function(resultados) {
            if (resultados.length > 0) {
                var usoPercent = parseFloat(resultados[0].uso_percent);
                var totalGB =20;
                var usadoGB = (usoPercent / 100) * totalGB;
                var livreGB = totalGB - usadoGB;
                
                res.json({
                    uso_percent: usoPercent,
                    livre_gb: parseFloat(livreGB.toFixed(2)),
                    total_gb: totalGB,
                    usado_gb: parseFloat(usadoGB.toFixed(2)),
                    data_hora_captura: resultados[0].data_hora_captura
                });
            } else {
                res.status(404).json({ 
                    error: 'Nenhum dado encontrado',
                    message: 'Não há leituras de memória para esta máquina'
                });
            }
        })
        .catch(function(error) {
            console.error('Erro no controller:', error);
            res.status(500).json({ error: 'erro no servidor ' });
        });
}

function getHistorico(req, res) {
    var idMaquina = req.params.idMaquina || 1;
    var limite = req.query.limite || 50;
    
    memoriaModel.buscarHistoricoMemoria(idMaquina, limite)
        .then(function(resultados) {
            if (resultados.length > 0) {
                var dadosFormatados = resultados.map(function(item) {
                    return {
                        uso_percent: parseFloat(item.uso_percent),
                        data_hora_captura: item.data_hora_captura,
                        id_maquina: item.id_maquina,
                        memoria_total_gb: 32,
                        memoria_livre_gb: parseFloat((32 - (parseFloat(item.uso_percent) / 100) * 32).toFixed(2))
                    };
                });
                res.json(dadosFormatados.reverse());
            } else {
                res.json([]);
            }
        })
        .catch(function(error) {
            console.error('Erro no controller:', error);
            res.status(500).json({ error: 'erro no hora de puxar o historico ' });
        });
}

function getAlertas(req, res) {
    var idMaquina = req.params.idMaquina || 1;
    var horas = req.query.horas || 24;
    
    memoriaModel.buscarAlertasMemoria(idMaquina, horas)
        .then(function(resultados) {
            if (resultados.length > 0) {
                var alertasFormatados = resultados.map(function(alerta) {
                    return {
                        id_alerta: alerta.id_alerta,
                        descricao: alerta.descricao,
                        status_alerta: alerta.status_alerta,
                        data_hora: alerta.data_hora,
                        uso_percent: parseFloat(alerta.uso_percent),
                        nome_maquina: alerta.nome_maquina,
                        componente: alerta.nome_componente
                    };
                });
                res.json(alertasFormatados);
            } else {
                res.json([]);
            }
        })
        .catch(function(error) {
            console.error('Erro no controller:', error);
            res.status(500).json({ error: 'erro ao buscar alertas no banco' });
        });
}

function getProcessoMaiorMemoria(req, res) {
    var idMaquina = req.params.idMaquina || 1;
    
    memoriaModel.buscarProcessoMaiorMemoria(idMaquina)
        .then(function(resultados) {
            if (resultados.length > 0) {
                res.json({
                    processo_nome: resultados[0].processo_nome,
                    memoria_percent: parseFloat(resultados[0].memoria_percent),
                    data_hora_captura: resultados[0].data_hora_captura
                });
            } else {
                res.status(404).json({ 
                    error: 'Nenhum dado encontrado',
                    message: 'Não há dados de processo de maior memória'
                });
            }
        })
        .catch(function(error) {
            console.error('Erro no controller:', error);
            res.status(500).json({ error: 'erro interno no servidor' });
        });
}

module.exports = {
    getDetalhes,
    getHistorico,
    getAlertas,
    getProcessoMaiorMemoria
};