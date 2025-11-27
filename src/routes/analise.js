const express = require('express');
const router = express.Router();
var database = require("../database/config");

router.get('/', function (req, res) {

    const maquinaId = req.query.maquinaId || 1;
    const limite = req.query.limite || 30;

    const sql = `
        SELECT 
            l.data_hora_captura AS horario,

            MAX(CASE WHEN c.nome_componente = 'CPU' THEN l.dados END) AS cpu,
            MAX(CASE WHEN c.nome_componente = 'Latência CPU' THEN l.dados END) AS latencia,
            MAX(CASE WHEN c.nome_componente = 'Processos' THEN l.dados END) AS processos

        FROM leitura l
        JOIN componente c 
            ON c.id_componente = l.fk_id_componente
        WHERE l.fk_id_maquina = ${maquinaId}
        GROUP BY l.data_hora_captura
        ORDER BY l.data_hora_captura DESC
        LIMIT ${limite};
    `;

    database.executar(sql)
        .then(resultado => {

            const dados = resultado.map(r => ({
                hora: r.horario.toLocaleTimeString("pt-BR"),
                cpu: r.cpu,
                latencia: r.latencia,
                processos: r.processos
            })).reverse();

            res.json(dados);
        })
        .catch(erro => {
            res.status(500).json({
                error: "Erro ao buscar dados",
                details: erro.sqlMessage || erro.message
            });
        });
});

module.exports = router;
