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

function listarAlertasRecentes() {
    const sql = `
        SELECT 
            a.id_alerta,
            m.nome_maquina AS portico,
            l.data_hora_captura AS dataHora,
            c.nome_componente AS componente,
            l.dados_float AS valor,
            a.status_alerta AS tipo_alerta  -- 1 = atenção, 2 = crítico
        FROM alerta AS a
        JOIN leitura AS l ON a.fk_id_leitura = l.id_leitura
        JOIN componente AS c ON a.fk_id_componente = c.id_componente
        JOIN maquina AS m ON c.fk_id_maquina = m.id_maquina
        ORDER BY l.data_hora_captura DESC;
    `;
    return database.executar(sql);
}

function heatmapAlertasHoraComponente() {
    const sql = `
        SELECT 
            c.nome_componente AS componente,
            HOUR(l.data_hora_captura) AS hora,
            COUNT(*) AS total_alertas
        FROM alerta AS a
        JOIN leitura AS l ON a.fk_id_leitura = l.id_leitura
        JOIN componente AS c ON a.fk_id_componente = c.id_componente
        GROUP BY c.nome_componente, HOUR(l.data_hora_captura)
        ORDER BY c.nome_componente, hora;
    `;
    return database.executar(sql);
}

function registrarOcorrencia(id_alerta, descricao) {
    const sql = `
        UPDATE alerta
        SET descricao = '${descricao}'
        WHERE id_alerta = ${id_alerta};
    `;
    return database.executar(sql);
}

function kpiAlertasCriticos() {
    var sql = `
    WITH media AS (
        SELECT AVG(alertas_por_dia) AS lambda
        FROM (
            SELECT DATE(l.data_hora_captura) AS dia,
                   COUNT(a.id_alerta) AS alertas_por_dia
            FROM alerta a
            JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            WHERE l.data_hora_captura >= CURDATE() - INTERVAL 30 DAY
              AND l.data_hora_captura < CURDATE()
            GROUP BY dia
        ) t
    ),
    hoje AS (
        SELECT COUNT(*) AS alertasHoje
        FROM alerta a
        JOIN leitura l ON a.fk_id_leitura = l.id_leitura
        WHERE DATE(l.data_hora_captura) = CURDATE()
    )
    SELECT 
        hoje.alertasHoje,
        media.lambda
    FROM hoje, media;
    `;

    return database.executar(sql);
}

function kpiAlertasSemRegistro() {
    const sql = `
        SELECT COUNT(*) AS alertasSemRegistro
        FROM alerta
        WHERE descricao IS NULL
           OR TRIM(descricao) = '';
    `;
    return database.executar(sql);
}

module.exports = {
    kpiAlertasTotais, 
    kpiAlertasPorTipo, 
    kpiAlertasPorComponente, 
    listarAlertasRecentes, 
    heatmapAlertasHoraComponente, 
    registrarOcorrencia, 
    kpiAlertasCriticos, 
    kpiAlertasSemRegistro
}