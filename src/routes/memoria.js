var express = require("express");
var router = express.Router();
var database = require("../database/config");

// Rota para detalhes da memoria
router.get("/detalhes/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
       
        const query = `
            SELECT
                l.dados_float as uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente LIKE '%mem%ria RAM%'
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

// Rota para pegar o historico de dados da memoria
router.get("/historico/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const limite = parseInt(req.query.limite) || 50;
       
        const query = `
            SELECT
                l.dados_float as uso_percent,
                l.data_hora_captura,
                l.fk_id_maquina as id_maquina
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente LIKE '%mem%ria RAM%'
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC
            LIMIT ${limite}
        `;
       
        const resultados = await database.executar(query);
       
        if (resultados.length > 0) {
            const dadosFormatados = resultados.map(item => ({
                uso_percent: item.uso_percent,
                data_hora_captura: item.data_hora_captura,
                id_maquina: item.id_maquina,
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

// Rota para buscar os alertas sobre a memoria
router.get("/alertas/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const horas = parseInt(req.query.horas) || 24;
       
        console.log(`Buscando alertas para máquina ${idMaquina} nas últimas ${horas} horas`);
       
        const query = `
            SELECT
                a.id_alerta,
                a.descricao,
                a.status_alerta,
                l.dados_float as uso_percent,
                l.data_hora_captura,
                m.nome_maquina,
                m.id_maquina,
                c.nome_componente
            FROM alerta a
            INNER JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            INNER JOIN componente c ON a.fk_id_componente = c.id_componente
            INNER JOIN maquina m ON l.fk_id_maquina = m.id_maquina
            WHERE c.nome_componente LIKE '%mem%ria RAM%'
            AND l.fk_id_maquina = ${idMaquina}
            AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
            AND a.status_alerta = 1
            ORDER BY l.data_hora_captura DESC
        `;
       
        const resultados = await database.executar(query);
       
        console.log(`Encontrados ${resultados.length} alertas`);
       
        if (resultados.length === 0) {
            return res.json([]);
        }
       
        const alertasFormatados = resultados.map(alerta => ({
            id_alerta: alerta.id_alerta,
            descricao: alerta.descricao,
            status_alerta: alerta.status_alerta,
            data_hora: alerta.data_hora_captura,
            uso_percent: parseFloat(alerta.uso_percent),
            nome_maquina: alerta.nome_maquina,
            componente: alerta.nome_componente
        }));
       
        res.json(alertasFormatados);
       
    } catch (error) {
        console.error('Erro em /alertas:', error);
        res.status(500).json({
            error: "Erro interno do servidor ao buscar alertas",
            detalhes: error.message
        });
    }
});

// Rota para contar alertas críticos nas últimas horas
router.get("/alertas-count/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
       
        const query = `
            SELECT COUNT(*) as total
            FROM alerta a
            INNER JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            INNER JOIN componente c ON a.fk_id_componente = c.id_componente
            WHERE c.nome_componente LIKE '%mem%ria RAM%'
            AND l.fk_id_maquina = ${idMaquina}
            AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            AND a.status_alerta = 1
            AND l.dados_float > 84
        `;
       
        const resultado = await database.executar(query);
       
        res.json({
            total: resultado[0].total,
            id_maquina: idMaquina
        });
       
    } catch (error) {
        console.error('Erro em /alertas-count:', error);
        res.status(500).json({ error: "Erro ao contar alertas" });
    }
});

module.exports = router;