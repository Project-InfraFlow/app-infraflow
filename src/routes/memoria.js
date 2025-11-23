var express = require("express");
var router = express.Router();
var database = require("../database/config");

// Rota para status atual da memória
router.get("/status/:idMaquina", async (req, res) => {
    try {
        const { idMaquina } = req.params;
        
        const query = `
            SELECT 
                l.dados_float as uso_percent,
                l.data_hora_captura,
                c.nome_componente
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM' 
            AND l.fk_id_maquina = ?
            ORDER BY l.data_hora_captura DESC 
            LIMIT 1
        `;
        
        const [result] = await database.executar(query, [idMaquina]);
        res.json(result[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para histórico de memória
router.get("/historico/:idMaquina", async (req, res) => {
    try {
        const { idMaquina } = req.params;
        const { limite = 30 } = req.query;
        
        const query = `
            SELECT 
                l.dados_float as uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM' 
            AND l.fk_id_maquina = ?
            ORDER BY l.data_hora_captura DESC 
            LIMIT ?
        `;
        
        const resultados = await database.executar(query, [idMaquina, parseInt(limite)]);
        res.json(resultados.reverse()); // Ordenar do mais antigo para o mais recente
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para alertas de memória
router.get("/alertas/:idMaquina", async (req, res) => {
    try {
        const { idMaquina } = req.params;
        const { horas = 1 } = req.query;
        
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
            AND l.fk_id_maquina = ?
            AND a.data_hora >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY a.data_hora DESC
        `;
        
        const resultados = await database.executar(query, [idMaquina, parseInt(horas)]);
        res.json(resultados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para detalhes completos da memória
router.get("/detalhes/:idMaquina", async (req, res) => {
    try {
        const { idMaquina } = req.params;
        
        const query = `
            SELECT 
                l.dados_float as uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM' 
            AND l.fk_id_maquina = ?
            ORDER BY l.data_hora_captura DESC 
            LIMIT 1
        `;
        
        const resultados = await database.executar(query, [idMaquina]);
        
        if (resultados.length > 0) {
            const usoPercent = resultados[0].uso_percent;
            // Supondo 32GB totais (conforme especificação técnica dos pórticos)
            const totalGB = 32;
            const usadoGB = (usoPercent / 100) * totalGB;
            const livreGB = totalGB - usadoGB;
            
            res.json({
                uso_percent: usoPercent,
                livre_gb: livreGB.toFixed(2),
                total_gb: totalGB,
                usado_gb: usadoGB.toFixed(2),
                data_hora: resultados[0].data_hora_captura
            });
        } else {
            res.json({});
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;