var express = require("express");
var router = express.Router();
var database = require("../database/config");

// ========================
// 1) DETALHES DO DISCO
// ========================
router.get("/detalhes/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;

        const query = `
            SELECT 
                l.dados_float AS uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Disco'
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC
            LIMIT 1;
        `;

        const resultados = await database.executar(query);

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({ error: "Nenhum dado de disco encontrado" });
        }

        const usoPercent = resultados[0].uso_percent;
        const totalGB = 32;
        const usadoGB = (usoPercent / 100) * totalGB;
        const livreGB = totalGB - usadoGB;

        res.json({
            uso_percent: usoPercent,
            livre_gb: Number(livreGB.toFixed(2)),
            usado_gb: Number(usadoGB.toFixed(2)),
            total_gb: totalGB,
            data_hora_captura: resultados[0].data_hora_captura
        });

    } catch (error) {
        console.error("Erro em /disco/detalhes:", error);
        res.status(500).json({ error: "Erro interno ao buscar detalhes do disco" });
    }
});

// ========================
// 2) HISTÓRICO DO DISCO
// ========================
router.get("/historico/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const limite = parseInt(req.query.limite) || 50;

        const query = `
            SELECT 
                l.dados_float AS uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Disco'
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC
            LIMIT ${limite};
        `;

        const resultados = await database.executar(query);

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({ error: "Nenhum dado histórico encontrado" });
        }

        const totalGB = 32;

        const dadosFormatados = resultados.map(item => {
            const usadoGB = (item.uso_percent / 100) * totalGB;
            const livreGB = totalGB - usadoGB;

            return {
                uso_percent: item.uso_percent,
                data_hora_captura: item.data_hora_captura,
                disco_usado_gb: Number(usadoGB.toFixed(2)),
                disco_livre_gb: Number(livreGB.toFixed(2)),
                disco_total_gb: totalGB
            };
        });

        res.json(dadosFormatados.reverse());

    } catch (error) {
        console.error("Erro em /disco/historico:", error);
        res.status(500).json({ error: "Erro interno ao buscar histórico do disco" });
    }
});

// ========================
// 3) ALERTAS DO DISCO
// ========================
router.get("/alertas/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const horas = parseInt(req.query.horas) || 24;

        const query = `
            SELECT 
                a.descricao,
                a.data_hora,
                l.dados_float AS uso_percent,
                m.nome_maquina
            FROM alerta a
            JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            JOIN componente c ON a.fk_id_componente = c.id_componente
            JOIN maquina m ON l.fk_id_maquina = m.id_maquina
            WHERE c.nome_componente = 'Disco'
            AND l.fk_id_maquina = ${idMaquina}
            AND a.data_hora >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
            ORDER BY a.data_hora DESC;
        `;

        const resultados = await database.executar(query);

        res.json(
            resultados.map(alerta => ({
                descricao: alerta.descricao,
                data_hora: alerta.data_hora,
                uso_percent: alerta.uso_percent,
                nome_maquina: alerta.nome_maquina
            }))
        );

    } catch (error) {
        console.error("Erro em /disco/alertas:", error);
        res.status(500).json({ error: "Erro interno ao buscar alertas do disco" });
    }
});

module.exports = router;
