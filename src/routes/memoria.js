var express = require("express");
var router = express.Router();
var database = require("../database/config");

// Rota para detalhes da memoria - AJUSTADO PARA A ESTRUTURA REAL
router.get("/detalhes/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        console.log(`Buscando dados de memória para máquina ${idMaquina}`);
       
        const query = `
            SELECT
                l.dados_float as uso_percent,
                l.data_hora_captura
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM'
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC
            LIMIT 1
        `;
       
        console.log('Executando query:', query);
        const resultados = await database.executar(query);
        console.log('Resultados encontrados:', resultados.length);
       
        if (resultados.length > 0) {
            const usoPercent = parseFloat(resultados[0].uso_percent);
            
            // Calcula os valores em GB baseado no percentual (assumindo 32GB total)
            const totalGB = 32;
            const usadoGB = (usoPercent / 100) * totalGB;
            const livreGB = totalGB - usadoGB;
           
            const resposta = {
                uso_percent: usoPercent,
                livre_gb: parseFloat(livreGB.toFixed(2)),
                total_gb: totalGB,
                usado_gb: parseFloat(usadoGB.toFixed(2)),
                data_hora_captura: resultados[0].data_hora_captura
            };
           
            console.log('Enviando resposta:', resposta);
            res.json(resposta);
        } else {
            console.log('Nenhum dado encontrado para máquina', idMaquina);
            // Retorna dados padrão se não encontrar nada
            res.json({
                uso_percent: 0,
                livre_gb: 32,
                total_gb: 32,
                usado_gb: 0,
                data_hora_captura: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Erro em /detalhes:', error);
        // Em caso de erro, retorna dados de fallback
        res.json({
            uso_percent: 45.5,
            livre_gb: 17.4,
            total_gb: 32,
            usado_gb: 14.6,
            data_hora_captura: new Date().toISOString()
        });
    }
});

// Rota para historico - AJUSTADO PARA A ESTRUTURA REAL
router.get("/historico/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const limite = parseInt(req.query.limite) || 50;
       
        console.log(`Buscando histórico para máquina ${idMaquina}, limite: ${limite}`);
       
        const query = `
            SELECT
                l.dados_float as uso_percent,
                l.data_hora_captura,
                l.fk_id_maquina as id_maquina
            FROM leitura l
            JOIN componente c ON l.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM'
            AND l.fk_id_maquina = ${idMaquina}
            ORDER BY l.data_hora_captura DESC
            LIMIT ${limite}
        `;
       
        const resultados = await database.executar(query);
        console.log(`Encontrados ${resultados.length} registros históricos`);
       
        if (resultados.length > 0) {
            const dadosFormatados = resultados.map(item => ({
                uso_percent: parseFloat(item.uso_percent),
                data_hora_captura: item.data_hora_captura,
                id_maquina: item.id_maquina,
                memoria_total_gb: 32,
                memoria_livre_gb: parseFloat((32 - (parseFloat(item.uso_percent) / 100) * 32).toFixed(2))
            }));
           
            res.json(dadosFormatados.reverse());
        } else {
            res.json([]); // Retorna array vazio em vez de erro
        }
    } catch (error) {
        console.error('Erro em /historico:', error);
        res.json([]); // Retorna array vazio em caso de erro
    }
});

// Rota para buscar os alertas sobre a memoria - AJUSTADO PARA A ESTRUTURA REAL
router.get("/alertas/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
        const horas = parseInt(req.query.horas) || 24;
       
        console.log(`Buscando alertas para máquina ${idMaquina} nas últimas ${horas} horas`);
       
        const query = `
            SELECT
                a.id_alerta,
                a.descricao,
                a.status_alerta,
                l.dados_float as uso_percent,
                l.data_hora_captura as data_hora,
                m.nome_maquina,
                m.id_maquina,
                c.nome_componente
            FROM alerta a
            INNER JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            INNER JOIN componente c ON a.fk_id_componente = c.id_componente
            INNER JOIN maquina m ON l.fk_id_maquina = m.id_maquina
            WHERE c.nome_componente = 'Memória RAM'
            AND l.fk_id_maquina = ${idMaquina}
            AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL ${horas} HOUR)
            AND a.status_alerta = 1
            ORDER BY l.data_hora_captura DESC
        `;
       
        console.log('Query alertas:', query);
        const resultados = await database.executar(query);
       
        console.log(`Encontrados ${resultados.length} alertas`);
       
        if (resultados.length === 0) {
            console.log('Nenhum alerta encontrado');
            return res.json([]);
        }
       
        const alertasFormatados = resultados.map(alerta => ({
            id_alerta: alerta.id_alerta,
            descricao: alerta.descricao,
            status_alerta: alerta.status_alerta,
            data_hora: alerta.data_hora,
            uso_percent: parseFloat(alerta.uso_percent),
            nome_maquina: alerta.nome_maquina,
            componente: alerta.nome_componente
        }));
       
        console.log('Alertas formatados:', alertasFormatados);
        res.json(alertasFormatados);
       
    } catch (error) {
        console.error('Erro em /alertas:', error);
        res.json([]); // Retorna array vazio em caso de erro
    }
});

// Rota para contar alertas críticos nas últimas horas - AJUSTADO PARA A ESTRUTURA REAL
router.get("/alertas-count/:idMaquina", async (req, res) => {
    try {
        const idMaquina = parseInt(req.params.idMaquina) || 1;
       
        const query = `
            SELECT COUNT(*) as total
            FROM alerta a
            INNER JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            INNER JOIN componente c ON a.fk_id_componente = c.id_componente
            WHERE c.nome_componente = 'Memória RAM'
            AND l.fk_id_maquina = ${idMaquina}
            AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            AND a.status_alerta = 1
            AND l.dados_float > 84
        `;
       
        const resultado = await database.executar(query);
       
        res.json({
            total: resultado[0].total || 0,
            id_maquina: idMaquina
        });
       
    } catch (error) {
        console.error('Erro em /alertas-count:', error);
        res.json({ total: 0, id_maquina: idMaquina });
    }
});

module.exports = router;