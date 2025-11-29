var database = require("../database/config");

function buscarUltimaLeituraMemoria(idMaquina) {
    var query = `
        SELECT l.dados_float as uso_percent, l.data_hora_captura
        FROM leitura l
        JOIN componente c ON l.fk_id_componente = c.id_componente
        WHERE c.nome_componente = 'Memória RAM'
        AND l.fk_id_maquina = ?
        ORDER BY l.data_hora_captura DESC
        LIMIT 1
    `;
    return database.executar(query, [idMaquina]);
}

function buscarHistoricoMemoria(idMaquina, limite = 50) {
    var query = `
        SELECT l.dados_float as uso_percent, l.data_hora_captura, l.fk_id_maquina as id_maquina
        FROM leitura l
        JOIN componente c ON l.fk_id_componente = c.id_componente
        WHERE c.nome_componente = 'Memória RAM'
        AND l.fk_id_maquina = ?
        ORDER BY l.data_hora_captura DESC
        LIMIT ?
    `;
    return database.executar(query, [idMaquina, limite]);
}

function buscarAlertasMemoria(idMaquina, horas = 24) {
    var query = `
        SELECT a.id_alerta, a.descricao, a.status_alerta, l.dados_float as uso_percent,
               l.data_hora_captura as data_hora, m.nome_maquina, c.nome_componente
        FROM alerta a
        INNER JOIN leitura l ON a.fk_id_leitura = l.id_leitura
        INNER JOIN componente c ON a.fk_id_componente = c.id_componente
        INNER JOIN maquina m ON l.fk_id_maquina = m.id_maquina
        WHERE c.nome_componente = 'Memória RAM'
        AND l.fk_id_maquina = ?
        AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        AND a.status_alerta = 1
        ORDER BY l.data_hora_captura DESC
    `;
    return database.executar(query, [idMaquina, horas]);
}

// NOVA FUNÇÃO: Buscar processo com maior uso de memória
function buscarProcessoMaiorMemoria(idMaquina) {
    var query = `
        SELECT l.dados_float as memoria_percent, l.dados_texto as processo_nome, l.data_hora_captura
        FROM leitura l
        JOIN componente c ON l.fk_id_componente = c.id_componente
        WHERE c.nome_componente = 'Processo Maior Memória'
        AND l.fk_id_maquina = ?
        ORDER BY l.data_hora_captura DESC
        LIMIT 1
    `;
    return database.executar(query, [idMaquina]);
}

module.exports = {
    buscarUltimaLeituraMemoria,
    buscarHistoricoMemoria,
    buscarAlertasMemoria,
    buscarProcessoMaiorMemoria  
};