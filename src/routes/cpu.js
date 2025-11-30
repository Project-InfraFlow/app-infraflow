const express = require('express');
const router = express.Router();

const cpuModel = require("../models/cpuModel");

function gerarAlerta(cpu, idle, proc) {
    if (cpu > 85) return "CPU ALTO";
    if (cpu > 70) return "CPU MÉDIA";
    if (idle < 30) return "IDLE BAIXO";
    if (idle < 70) return "IDLE MÉDIO";
    if (proc > 400) return "PROCESSOS ALTO";
    if (proc > 250) return "PROCESSOS MÉDIO";
    return null;
}

router.get('/', async function (req, res) {
    const maquinaId = req.query.maquinaId || 1;
    const limite = req.query.limite || 30;

    try {
        const resultado = await cpuModel.buscarDados(maquinaId, limite);

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

        const dados = resultado
            .map(r => ({
                horario: r.horario,
                hora: new Date(r.horario).toLocaleTimeString("pt-BR"),
                cpu: r.cpu || 0,
                cpuIdle: r.cpuIdle || 0,
                processos: r.processos || 0
            }))
            .reverse();

        const ultimo = dados[dados.length - 1];

        const totalAlertas = dados.reduce((acc, linha) => {
            return gerarAlerta(linha.cpu, linha.cpuIdle, linha.processos) ? acc + 1 : acc;
        }, 0);

        return res.json({
            kpi: {
                cpuMedia: ultimo.cpu,
                cpuIdle: ultimo.cpuIdle,
                processos: ultimo.processos,
                alertas: totalAlertas
            },
            grafico: dados
        });

    } catch (erro) {
        console.error("Erro ao buscar dados da CPU:", erro);
        return res.status(500).json({
            error: "Erro ao buscar dados",
            details: erro.sqlMessage || erro.message
        });
    }
});

module.exports = router;
