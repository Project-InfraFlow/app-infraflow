const { kpiAlerta } = require("../controllers/alertasController");
var database = require("../database/config")

function kpiAlertasTotais() {
    var instrucaoSql = `
    SELECT 
    COUNT(a.id_alerta) AS alertasTotais 
FROM 
    alerta AS a 
JOIN 
    leitura AS l ON a.fk_id_leitura = l.id_leitura 
WHERE 
    l.data_hora_captura >= NOW() - INTERVAL 24 HOUR;`
    return database.executar(instrucaoSql);
}

function kpiAlertasPorTipo() {
    var instrucaoSql = `
    SELECT
        IFNULL(SUM(
            CASE 
                WHEN c.nome_componente = 'CPU' AND l.dados_float BETWEEN 45 AND 85 THEN 1
                WHEN c.nome_componente = 'RAM' AND l.dados_float BETWEEN 54 AND 83 THEN 1
                WHEN c.nome_componente = 'Disco' AND l.dados_float BETWEEN 80 AND 90 THEN 1
                WHEN c.nome_componente = 'Rede' AND l.dados_float BETWEEN 50 AND 74 THEN 1
                ELSE 0
            END
        ), 0) AS total_atencao,

        IFNULL(SUM(
            CASE 
                WHEN c.nome_componente = 'CPU' AND l.dados_float > 85 THEN 1
                WHEN c.nome_componente = 'RAM' AND l.dados_float > 84 THEN 1
                WHEN c.nome_componente = 'Disco' AND l.dados_float > 90 THEN 1
                WHEN c.nome_componente = 'Rede' AND l.dados_float >= 75 THEN 1
                ELSE 0
            END
        ), 0) AS total_critico
    FROM alerta AS a
    JOIN leitura AS l ON a.fk_id_leitura = l.id_leitura
    JOIN componente AS c ON a.fk_id_componente = c.id_componente
    WHERE 
        l.data_hora_captura >= NOW() - INTERVAL 24 HOUR;
    `;
    
    return database.executar(instrucaoSql);
}

function kpiAlertasPorComponente() {

    var instrucaoSql = `
        SELECT 
    c.nome_componente,
    COUNT(a.id_alerta) AS total_alertas
FROM componente AS c
LEFT JOIN leitura AS l ON l.fk_id_componente = c.id_componente
LEFT JOIN alerta AS a ON a.fk_id_leitura = l.id_leitura
WHERE 
    l.data_hora_captura >= NOW() - INTERVAL 24 HOUR
    OR l.id_leitura IS NULL
GROUP BY 
    c.nome_componente
ORDER BY 
    c.nome_componente; 
    `;
    
    return database.executar(instrucaoSql);
}


module.exports = {
    kpiAlertasTotais, 
    kpiAlertasPorTipo, 
    kpiAlertasPorComponente
}