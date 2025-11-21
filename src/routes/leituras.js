const express = require('express');
const router = express.Router();

var database = require("../database/config");

router.get('/', function (req, res) {
    console.log('Rota /api/leituras chamada');
    
    const maquinaId = req.query.maquinaId || 1;
    const limite = req.query.limite || 50;
    
    console.log(`Parâmetros: maquinaId=${maquinaId}, limite=${limite}`);

    const sql = `
        SELECT
            l.data_hora_captura AS horario,
            MAX(CASE WHEN c.nome_componente = 'CPU' THEN l.dados_float END) AS cpu,
            MAX(CASE WHEN c.nome_componente = 'Memória RAM' THEN l.dados_float END) AS ram,
            MAX(CASE WHEN c.nome_componente = 'Disco' THEN l.dados_float END) AS disco,
            MAX(CASE WHEN c.nome_componente = 'Rede' THEN l.dados_float END) AS rede
        FROM leitura l
        JOIN componente c ON c.id_componente = l.fk_id_componente
        WHERE l.fk_id_maquina = ${maquinaId}
        GROUP BY l.data_hora_captura
        ORDER BY l.data_hora_captura DESC
        LIMIT ${limite}
    `;

    console.log('Executando query SQL');

    database.executar(sql)
        .then(resultado => {
            console.log(`Dados encontrados: ${resultado.length} leituras`);
            
            if (resultado.length > 0) {
                console.log('Primeira leitura:', resultado[0]);
            }
            
            const dadosOrdenados = resultado.reverse();
            res.json(dadosOrdenados);
        })
        .catch(erro => {
            console.error('❌ Erro no banco:', erro);
            res.status(500).json({ 
                error: 'Erro ao buscar leituras do banco',
                details: erro.sqlMessage || erro.message
            });
        });
});

module.exports = router;