var express = require("express");
var router = express.Router();
var database = require("../database/config");

// Rota para detalhes completos da memória
router.get("/detalhes/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        
        const query = `
            SELECT 
                l.dados_float as uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM' 
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC 
            LIMIT 1
        `;
        
        const resultados = await database.executar(query);
        
        if (resultados.length > 0) {
            const usoPercent = resultados[0].uso_percent;
            const totalGB = 32;
            const usadoGB = (usoPercent / 100) * totalGB;
            const livreGB = totalGB - usadoGB;
            
            res.json({
                uso_percent: usoPercent,
                livre_gb: parseFloat(livreGB.toFixed(2)),
                total_gb: totalGB,
                usado_gb: parseFloat(usadoGB.toFixed(2)),
                data_hora_captura: resultados[0].data_hora_captura
            });
        } else {
            res.status(404).json({ error: "Nenhum dado de memória encontrado" });
        }
    } catch (error) {
        console.error('Erro em /detalhes:', error);
        res.status(500).json({ error: "Erro interno do servidor ao buscar detalhes" });
    }
});

// Rota para histórico de memória
router.get("/historico/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const limite = parseInt(req.query.limite) || 50;
        
        const query = `
            SELECT 
                l.dados_float as uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM' 
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC 
            LIMIT ${limite}
        `;
        
        const resultados = await database.executar(query);
        
        if (resultados.length > 0) {
            // Formatar dados para o front-end
            const dadosFormatados = resultados.map(item => ({
                uso_percent: item.uso_percent,
                data_hora_captura: item.data_hora_captura,
                memoria_total_gb: 32,
                memoria_livre_gb: parseFloat((32 - (item.uso_percent / 100) * 32).toFixed(2))
            }));
            
            res.json(dadosFormatados.reverse());
        } else {
            res.status(404).json({ error: "Nenhum dado histórico encontrado" });
        }
    } catch (error) {
        console.error('Erro em /historico:', error);
        res.status(500).json({ error: "Erro interno do servidor ao buscar histórico" });
    }
});

// Rota para alertas de memória
router.get("/alertas/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const horas = parseInt(req.query.horas) || 24;
        
        const query = `
            SELECT 
                a.descricao,
                a.data_hora,
                l.dados_float as uso_percent,
                m.nome_maquina
            FROM alerta a
            JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            JOIN componente c ON a.fk_id_componente = c.id_componente
            JOIN maquina m ON l.fk_id_maquina = m.id_maquina
            WHERE c.nome_componente = 'Memória RAM' 
            AND l.fk_id_maquina = ${idMaquina}
            AND a.data_hora >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
            ORDER BY a.data_hora DESC
        `;
        
        const resultados = await database.executar(query);
        
        const alertasFormatados = resultados.map(alerta => ({
            descricao: alerta.descricao,
            data_hora: alerta.data_hora,
            uso_percent: alerta.uso_percent,
            nome_maquina: alerta.nome_maquina
        }));
        
        res.json(alertasFormatados);
    } catch (error) {
        console.error('Erro em /alertas:', error);
        res.status(500).json({ error: "Erro interno do servidor ao buscar alertas" });
    }
});

module.exports = router;