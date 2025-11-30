const express = require("express");
const router = express.Router();
const db = require("../database/config"); 



router.get("/latest/:idMaquina", function (req, res) {
    const idMaquina = req.params.idMaquina;

    const query = `
        SELECT 
            dados_texto,
            dados_float,
            data_hora_captura
        FROM leitura
        WHERE fk_id_maquina = ${idMaquina}
        ORDER BY data_hora_captura DESC
        LIMIT 50;
    `;

    db.executar(query)
        .then(result => {
            const resposta = {
                latencia: null,
                jitter: null,
                perda: null,
                velocidade: null
            };

            result.forEach(r => {
                if (r.dados_texto.includes("Latencia")) resposta.latencia = r.dados_float;
                if (r.dados_texto.includes("Jitter")) resposta.jitter = r.dados_float;
                if (r.dados_texto.includes("Perda")) resposta.perda = r.dados_float;
                if (r.dados_texto.includes("Velocidade")) resposta.velocidade = r.dados_float;
            });

            res.status(200).json(resposta);
        })
        .catch(erro => {
            console.error("Erro no /rede/latest:", erro);
            res.status(500).json(erro);
        });
});



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
        AND dados_texto LIKE '%${filtro}%'
        ORDER BY data_hora_captura DESC
        LIMIT 20;
    `;

    db.executar(query)
    .then(resultado => res.status(200).json(resultado))
    .catch(erro => {
        console.log("Erro ao buscar dados:", erro);
        res.status(500).json(erro);
    });
});

module.exports = router;
