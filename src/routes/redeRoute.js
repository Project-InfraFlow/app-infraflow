const express = require("express");
const router = express.Router();
const db = require("../database/config"); 

// =============================
// ROTA: Retorna últimas leituras de rede
// =============================
router.get("/ultimas/:idMaquina", async function (req, res) {
    const idMaquina = req.params.idMaquina;

    const query = `
        SELECT 
            dados_float,
            dados_texto,
            data_hora_captura
        FROM leitura
        WHERE fk_id_maquina = ${idMaquina}
        AND (
            dados_texto LIKE 'Latencia%' OR
            dados_texto LIKE 'Jitter%' OR
            dados_texto LIKE 'Perda%' OR
            dados_texto LIKE 'Velocidade%'
        )
        ORDER BY data_hora_captura DESC
        LIMIT 10;
    `;

    db.query(query, function (erro, resultado) {
        if (erro) {
            console.log("Erro ao buscar rede: ", erro);
            res.status(500).json(erro);
        } else {
            res.status(200).json(resultado);
        }
    });
});


// =============================
// HISTÓRICO PARA GRÁFICO
// =============================
router.get("/historico/:idMaquina/:metric", async function (req, res) {
    const idMaquina = req.params.idMaquina;
    const metric = req.params.metric; // latencia / jitter / perda / velocidade

    const mapaMetricas = {
        latencia: "Latencia%",
        jitter: "Jitter%",
        perda: "Perda%",
        velocidade: "Velocidade%"
    };

    const filtro = mapaMetricas[metric];

    if (!filtro) {
        return res.status(400).json({ erro: "Métrica inválida." });
    }

    const query = `
        SELECT 
            dados_float AS valor,
            data_hora_captura
        FROM leitura
        WHERE fk_id_maquina = ${idMaquina}
        AND dados_texto LIKE '${filtro}'
        ORDER BY data_hora_captura DESC
        LIMIT 20;
    `;

    db.query(query, (erro, resultado) => {
        if (erro) {
            console.log("Erro histórico rede:", erro);
            res.status(500).json(erro);
        } else {
            res.status(200).json(resultado.reverse()); // gráfico precisa do mais antigo primeiro
        }
    });
});

module.exports = router;
