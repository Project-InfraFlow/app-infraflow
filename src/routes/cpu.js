const express = require('express');
const router = express.Router();
var database = require("../database/config");

router.get('/', async function (req, res) {

    const maquinaId = req.query.maquinaId || 1;
    const limite = req.query.limite || 30;

    const sql = `
        SELECT 
            l.data_hora_captura AS horario,
            MAX(CASE WHEN c.nome_componente = 'CPU' THEN l.dados_float END) AS cpu,
            MAX(CASE WHEN c.nome_componente = 'CPU Idle' THEN l.dados_float END) AS cpu_idle,
            MAX(CASE WHEN c.nome_componente = 'Processos' THEN l.dados_float END) AS processos
        FROM leitura l
        JOIN componente c 
            ON c.id_componente = l.fk_id_componente
        WHERE l.fk_id_maquina = ${maquinaId}
        GROUP BY l.data_hora_captura
        ORDER BY l.data_hora_captura DESC
        LIMIT ${limite};
    `;

    try {
        const resultado = await database.executar(sql);

        if (!resultado || resultado.length === 0) {
            return res.json({
                kpi: {
                    cpuMedia: 0,
                    processos: 0,
                    cpuIdle: 0,
                    alertas: 0
                },
                grafico: []
            });
        }


        const dados = resultado.map(r => ({
            horario: r.horario,
            hora: new Date(r.horario).toLocaleTimeString("pt-BR"),
            cpu: Number(r.cpu) || 0,
            cpuIdle: Number(r.cpu_idle) || 0,
            processos: Number(r.processos) || 0
        })).reverse();

        const ultimo = dados[dados.length - 1];

        return res.json({
            kpi: {
                cpuMedia: ultimo.cpu,
                cpuIdle: ultimo.cpuIdle,
                processos: ultimo.processos,
                alertas: 8
            },
            grafico: dados
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao buscar dados",
            details: erro.sqlMessage || erro.message
        });
    }
});

module.exports = router;
