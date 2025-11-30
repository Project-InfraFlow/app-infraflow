const express = require("express");
const router = express.Router();
const db = require("../database/config");

router.get("/ultimas/:idMaquina", async function (req, res) {
    const idMaquina = req.params.idMaquina;
    console.log(`Buscando ultimas leituras para maquina ${idMaquina}`);

    const query = `
        SELECT 
            dados_float,
            dados_texto,
            data_hora_captura
        FROM leitura
        WHERE fk_id_maquina = ${idMaquina}
        AND fk_id_componente = 4
        AND (
            dados_texto LIKE '%Latencia%' OR
            dados_texto LIKE '%Jitter%' OR
            dados_texto LIKE '%Perda%' OR
            dados_texto LIKE '%Velocidade%'
        )
        ORDER BY data_hora_captura DESC
        LIMIT 20;
    `;

    console.log(`Executando query: ${query}`);

    db.executar(query)
    .then(resultado => {
        console.log(`Resultado encontrado: ${resultado.length} registros`);
        console.log(`Dados:`, resultado);
        res.status(200).json(resultado);
    })
    .catch(erro => {
        console.log("Erro ao buscar rede: ", erro);
        res.status(500).json(erro);
    });
});

router.get("/historico/:idMaquina/:metric", async function (req, res) {
    const idMaquina = req.params.idMaquina;
    const metric = req.params.metric;

    console.log(`Buscando historico: maquina ${idMaquina}, metrica ${metric}`);

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
        AND fk_id_componente = 4
        AND dados_texto LIKE '${filtro}'
        ORDER BY data_hora_captura DESC
        LIMIT 20;
    `;

    console.log(`Executando query historico: ${query}`);

    db.executar(query)
    .then(resultado => {
        console.log(`Historico encontrado: ${resultado.length} registros`);
        console.log(`Dados historico:`, resultado);
        res.status(200).json(resultado);
    })
    .catch(erro => {
        console.log("Erro ao buscar dados:", erro);
        res.status(500).json(erro);
    });
});

// NOVA ROTA PARA DEBUG - VERIFICAR DADOS NO BANCO
router.get("/debug/:idMaquina", async function (req, res) {
    const idMaquina = req.params.idMaquina;
    
    const query = `
        SELECT 
            id_leitura,
            fk_id_componente,
            fk_id_maquina,
            dados_float,
            dados_texto,
            data_hora_captura
        FROM leitura
        WHERE fk_id_maquina = ${idMaquina}
        ORDER BY data_hora_captura DESC
        LIMIT 10;
    `;

    console.log(`Executando query debug: ${query}`);

    db.executar(query)
    .then(resultado => {
        console.log(`Debug - Total registros: ${resultado.length}`);
        console.log(`Debug - Dados:`, resultado);
        res.status(200).json(resultado);
    })
    .catch(erro => {
        console.log("Erro debug:", erro);
        res.status(500).json(erro);
    });
});

module.exports = router;