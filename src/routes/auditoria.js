const express = require('express');
const router = express.Router();

router.post('/tentativa-acesso', async (req, res) => {
    try {
        const { ip_origem, endpoint, metodo_http, payload, motivo, user_agent } = req.body;
        
        const [result] = await db.execute(`
            INSERT INTO tentativa_acesso_nao_autorizado 
            (ip_origem, user_agent, endpoint, metodo_http, payload, motivo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [ip_origem, user_agent || req.get('User-Agent'), endpoint, metodo_http, payload, motivo]);
        
        res.status(201).json({ 
            message: 'Tentativa registrada', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Erro ao registrar tentativa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

router.get('/estatisticas-seguranca', async (req, res) => {
    try {
        const [tentativasAcesso] = await db.execute(`
            SELECT COUNT(*) as total,
                   COUNT(DISTINCT ip_origem) as ips_unicos,
                   MAX(data_hora) as ultima_tentativa
            FROM tentativa_acesso_nao_autorizado 
            WHERE data_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);
        
        const [alertasCriticos] = await db.execute(`
            SELECT COUNT(*) as total
            FROM alerta 
            WHERE data_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            AND descricao LIKE '%crítico%'
        `);
        
        const [logsSeguranca] = await db.execute(`
            SELECT tipo_evento, COUNT(*) as total
            FROM log_seguranca 
            WHERE data_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY tipo_evento
        `);
        
        res.json({
            tentativas_24h: tentativasAcesso[0],
            alertas_24h: alertasCriticos[0],
            logs_por_tipo: logsSeguranca
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;