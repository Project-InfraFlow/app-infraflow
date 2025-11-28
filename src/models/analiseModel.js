var database = require("../database/config");

function buscarDados(maquinaId, limite) {

    const sql = `
        SELECT 
            l.data_hora_captura AS horario,

            MAX(CASE WHEN c.nome_componente = 'CPU' THEN l.dados_float END) AS cpu,
            MAX(CASE WHEN c.nome_componente = 'Latência CPU' THEN l.dados_float END) AS latencia,
            MAX(CASE WHEN c.nome_componente = 'Processos' THEN l.dados_float END) AS processos

        FROM leitura l
        JOIN componente c 
            ON c.id_componente = l.fk_id_componente
        WHERE l.fk_id_maquina = ${maquinaId}
        GROUP BY l.data_hora_captura
        ORDER BY l.data_hora_captura DESC
        LIMIT ${limite};
    `;

    return database.executar(sql);
}

module.exports = {
    buscarDados
};
