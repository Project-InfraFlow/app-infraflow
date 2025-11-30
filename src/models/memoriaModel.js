var database = require("../database/config");

function buscarDetalhes(idMaquina) {
    return database.executar(`
        SELECT dados_float AS uso_percent, 30 AS total_gb, 
               ROUND(30 - (dados_float / 100) * 30, 2) AS livre_gb,
               data_hora_captura
        FROM leitura l
        JOIN componente c ON c.id_componente = l.fk_id_componente
        WHERE c.nome_componente = 'RAM'
        AND l.fk_id_maquina = ${idMaquina}
        ORDER BY data_hora_captura DESC LIMIT 1
    `);
}

function buscarHistorico(idMaquina, limite) {
    return database.executar(`
        SELECT dados_float AS uso_percent, 30 AS total_gb, 
               ROUND(30 - (dados_float / 100) * 30, 2) AS livre_gb,
               data_hora_captura
        FROM leitura l
        JOIN componente c ON c.id_componente = l.fk_id_componente
        WHERE c.nome_componente = 'RAM'
        AND l.fk_id_maquina = ${idMaquina}
        ORDER BY data_hora_captura DESC LIMIT ${limite}
    `);
}

function buscarAlertas(idMaquina, horas) {
    return database.executar(`
        SELECT a.descricao, l.dados_float AS uso_percent, l.data_hora_captura as data_hora
        FROM alerta a
        JOIN leitura l ON l.id_leitura = a.fk_id_leitura
        JOIN componente c ON c.id_componente = a.fk_id_componente
        WHERE c.nome_componente = 'RAM'
        AND l.fk_id_maquina = ${idMaquina}
        AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
        ORDER BY l.data_hora_captura DESC
    `);
}

function buscarAlertasCriticos(idMaquina, horas) {
    return database.executar(`
        SELECT COUNT(*) as total_alertas_criticos
        FROM alerta a
        JOIN leitura l ON l.id_leitura = a.fk_id_leitura
        JOIN componente c ON c.id_componente = a.fk_id_componente
        WHERE c.nome_componente = 'RAM'
        AND l.fk_id_maquina = ${idMaquina}
        AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
        AND l.dados_float >= 84
    `);
}

function buscarSomaAlertas(idMaquina, horas) {
    return database.executar(`
        SELECT COUNT(*) as total_alertas
        FROM alerta a
        JOIN leitura l ON l.id_leitura = a.fk_id_leitura
        JOIN componente c ON c.id_componente = a.fk_id_componente
        WHERE c.nome_componente = 'RAM'
        AND l.fk_id_maquina = ${idMaquina}
        AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
        AND a.fk_parametro_alerta = 4
    `);
}

module.exports = { 
    buscarDetalhes, 
    buscarHistorico, 
    buscarAlertas,
    buscarAlertasCriticos,
    buscarSomaAlertas  
};