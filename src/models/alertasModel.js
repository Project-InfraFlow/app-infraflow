const { kpiAlerta } = require("../controllers/alertasController");
var database = require("../database/config")

function kpiAlertasTotais() {
    var instrucaoSql = `
    SELECT 
    COUNT(a.id_alerta) AS alertasTotais 
FROM 
    alerta AS a 
JOIN 
    leitura AS l ON a.fk_id_leitura = l.id_leitura -- Assumindo que a ligação é feita assim
WHERE 
    l.data_hora_captura >= NOW() - INTERVAL 24 HOUR;`
    return database.executar(instrucaoSql);
}

function kpiAtencao() {
    var instrucaoSql = `
   SELECT
    COUNT(a.id_alerta) AS alertasAtencao
FROM
    alerta AS a
JOIN
    leitura AS l ON a.fk_id_leitura = l.id_leitura
JOIN
    componente AS c ON l.fk_id_componente = c.id_componente
WHERE
    l.data_hora_captura >= NOW() - INTERVAL 24 HOUR
    AND (
        -- Condição 1: Verifica se o alerta está na faixa de Atenção (Alta Utilização)
        (c.nome_componente = 'CPU' AND l.dados_float >= 45 AND l.dados_float <= 85) OR
        (c.nome_componente = 'Memória RAM' AND l.dados_float >= 54 AND l.dados_float <= 83) OR
        (c.nome_componente = 'Disco' AND l.dados_float >= 80 AND l.dados_float <= 90) OR
        (c.nome_componente = 'Rede' AND l.dados_float >= 50 AND l.dados_float <= 74)
    );`
    return database.executar(instrucaoSql);
}


function kpiCritico() {
    var instrucaoSql = `
   SELECT
    COUNT(a.id_alerta) AS alertasCriticos
FROM
    alerta AS a
JOIN
    leitura AS l ON a.fk_id_leitura = l.id_leitura
JOIN
    componente AS c ON l.fk_id_componente = c.id_componente
WHERE
    l.data_hora_captura >= NOW() - INTERVAL 24 HOUR
    AND (
        (c.nome_componente = 'CPU' AND l.dados_float > 85) OR
        (c.nome_componente = 'Memória RAM' AND l.dados_float > 84) OR
        (c.nome_componente = 'Disco' AND l.dados_float > 90) OR
        (c.nome_componente = 'Rede' AND l.dados_float >= 75)
    );`
    return database.executar(instrucaoSql);
}

function listarAlertas() {
    var instrucaoSql = `
    `
    return database.executar(instrucaoSql);
}

function kpiStatusAndamento() {
    const instrucaoSql = `
        SELECT
            SUM(dt_abertura IS NULL) AS sem_abertura,
            COUNT(*) AS total_alertas
        FROM alerta
    `;
    return database.executar(instrucaoSql);
}



// gráficos

function kpiAlertasPorComponente() {
    const sql = `
        SELECT 
            c.nome_componente AS componente,
            COUNT(a.id_alerta) AS total
        FROM alerta a
        JOIN leitura l ON a.fk_id_leitura = l.id_leitura
        JOIN componente c ON l.fk_id_componente = c.id_componente
        WHERE l.data_hora_captura >= NOW() - INTERVAL 24 HOUR
        GROUP BY c.nome_componente
        ORDER BY c.nome_componente;
    `;
    return database.executar(sql);
}

module.exports = {
    kpiAlertasTotais, 
    kpiAtencao, 
    kpiCritico, 
    kpiStatusAndamento, 
    kpiAlertasPorComponente
}