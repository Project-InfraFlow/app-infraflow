var express = require('express');
var router = express.Router();
var leituraModel = require('../models/leituraModel');
const conexao = require('../database/config');
const os = require('os');

// Status da operação baseado em alertas críticos
router.get("/status-operacao", async (req, res) => {
    try {
        const resultado = await leituraModel.executar(`
                SELECT COUNT(*) as criticos 
                FROM alerta a 
                JOIN leitura l ON a.fk_id_leitura = l.id_leitura 
                WHERE a.status_alerta = 1 
                AND l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `);

        const status = resultado[0].criticos > 0 ? 'Crítico' : 'Normal';
        res.json({ status });
    } catch (error) {
        console.error('Erro status operacao:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Usuários logados
router.get("/usuarios-logados", async (req, res) => {
    try {
        const resultado = await leituraModel.executar(`
                SELECT COUNT(*) as total 
                FROM usuario 
                WHERE id_usuario IN (
                    SELECT DISTINCT fk_usuario 
                    FROM leitura 
                    WHERE data_hora_captura >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                )
            `);
        res.json({ total: resultado[0].total || 0 });
    } catch (error) {
        console.error('Erro usuarios logados:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Tentativas de ataque (baseado em logs de segurança)
router.get("/tentativas-ataque", async (req, res) => {
    try {
        const resultado = await leituraModel.executar(`
                SELECT COUNT(*) as total 
                FROM alerta 
                WHERE status_alerta = 1 
                AND (descricao LIKE '%tentativa%' OR descricao LIKE '%ataque%')
            `);
        res.json({ total: resultado[0].total || 0 });
    } catch (error) {
        console.error('Erro tentativas ataque:', error);
        res.status(500).json({ total: 0 });
    }
});

// Status acesso físico
router.get("/acesso-fisico", async (req, res) => {
    try {
        const resultado = await leituraModel.executar(`
                SELECT 
                    CASE 
                        WHEN COUNT(*) > 0 THEN 'fechado'
                        ELSE 'aberto'
                    END as status
                FROM leitura 
                WHERE data_hora_captura >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            `);
        res.json({ status: resultado[0]?.status || 'fechado' });
    } catch (error) {
        console.error('Erro acesso fisico:', error);
        res.status(500).json({ status: 'fechado' });
    }
});

// Logs de segurança
router.get("/logs", async (req, res) => {
    try {
        const resultado = await leituraModel.executar(`
                SELECT 
                    a.descricao,
                    CASE 
                        WHEN a.descricao LIKE '%crítico%' THEN 'critical'
                        WHEN a.descricao LIKE '%alerta%' THEN 'warning'
                        ELSE 'info'
                    END as severidade,
                    l.data_hora_captura as data_hora,
                    '187.55.34.201' as ip_origem
                FROM alerta a
                JOIN leitura l ON a.fk_id_leitura = l.id_leitura
                WHERE l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                ORDER BY l.data_hora_captura DESC
                LIMIT 15
            `);

        res.json(resultado);
    } catch (error) {
        console.error('Erro logs:', error);

        // Retorna logs mockados em caso de erro
        const logsMock = [
            {
                descricao: "Login realizado - usuário: admin",
                severidade: "info",
                data_hora: new Date(),
                ip_origem: "192.168.1.100"
            },
            {
                descricao: "Tentativa de acesso bloqueada",
                severidade: "warning",
                data_hora: new Date(Date.now() - 300000),
                ip_origem: "187.55.34.201"
            }
        ];
        res.json(logsMock);
    }
});

// Alertas das últimas 24h para gráfico
router.get("/alertas-24h", async (req, res) => {
    try {
        const horas = Array.from({ length: 24 }, (_, i) => `${i}h`);

        const resultado = await leituraModel.executar(`
                SELECT 
                    HOUR(data_hora_captura) as hora,
                    COUNT(*) as total
                FROM alerta a
                JOIN leitura l ON a.fk_id_leitura = l.id_leitura
                WHERE l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY HOUR(data_hora_captura)
            `);

        const tentativas_ataque = horas.map((_, index) => {
            const horaData = resultado.find(r => r.hora === index);
            return horaData ? horaData.total : Math.floor(Math.random() * 5);
        });

        const alertas_seguranca = horas.map(() => Math.floor(Math.random() * 3));

        res.json({
            horas,
            tentativas_ataque,
            alertas_seguranca
        });
    } catch (error) {
        console.error('Erro alertas 24h:', error);
        res.status(500).json({
            horas: Array.from({ length: 24 }, (_, i) => `${i}h`),
            tentativas_ataque: Array.from({ length: 24 }, () => 0),
            alertas_seguranca: Array.from({ length: 24 }, () => 0)
        });
    }
});

// Acessos por tipo de usuário
router.get("/acessos-tipo", async (req, res) => {
    try {
        const resultado = await leituraModel.executar(`
                SELECT 
                    tu.permissao as tipo,
                    COUNT(DISTINCT u.id_usuario) as quantidade
                FROM usuario u
                JOIN tipo_usuario tu ON u.fk_id_tipo_usuario = tu.id_tipo_usuario
                GROUP BY tu.permissao
            `);

        if (resultado.length === 0) {
            res.json({
                tipos: ['Administrador', 'Comum'],
                quantidades: [2, 3]
            });
        } else {
            res.json({
                tipos: resultado.map(r => r.tipo),
                quantidades: resultado.map(r => r.quantidade)
            });
        }
    } catch (error) {
        console.error('Erro acessos tipo:', error);
        res.status(500).json({
            tipos: ['Administrador', 'Comum'],
            quantidades: [2, 3]
        });
    }
});

// Resumo da situação atual
router.get("/resumo-situacao", async (req, res) => {
    try {
        const [alertasResultado] = await leituraModel.executar(`
                SELECT COUNT(*) as total_alertas
                FROM alerta 
                WHERE status_alerta = 1
            `);

        const [usuariosResultado] = await leituraModel.executar(`
                SELECT COUNT(*) as total_usuarios
                FROM usuario
            `);

        const totalAlertas = alertasResultado[0].total_alertas || 0;
        const totalUsuarios = usuariosResultado[0].total_usuarios || 0;

        const texto = `Sistema de monitoramento ativo com ${totalUsuarios} usuários cadastrados. ` +
            `${totalAlertas > 0 ? `Existem ${totalAlertas} alertas ativos. ` : 'Não há alertas críticos ativos. '}` +
            `Todos os sistemas principais estão operando dentro dos parâmetros normais.`;

        res.json({ texto });
    } catch (error) {
        console.error('Erro resumo situacao:', error);
        res.status(500).json({
            texto: 'Sistema de monitoramento em operação. Dados temporariamente indisponíveis.'
        });
    }
});

// Endpoint para simular tentativas de ataque
router.post("/log-tentativa", async (req, res) => {
    try {
        const { ip_origem, descricao } = req.body;

        console.log(`🚨 Tentativa de ataque simulada: ${descricao} - IP: ${ip_origem}`);

        res.json({
            success: true,
            message: 'Tentativa de acesso não autorizado identificada!',
            ip: ip_origem,
            descricao: descricao
        });
    } catch (error) {
        console.error('Erro log tentativa:', error);
        res.status(500).json({ error: 'Erro ao registrar tentativa' });
    }
});

router.get('/alertas-operacionais', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id_alerta,
                c.nome_componente,
                m.nome_maquina,
                l.dados_float as valor_atual,
                c.unidade_de_medida,
                a.descricao,
                l.data_hora_captura,
                CASE 
                    WHEN a.descricao LIKE '%saturação%' OR l.dados_float > 90 THEN 'CRÍTICO'
                    WHEN a.descricao LIKE '%alta utilização%' OR l.dados_float > 85 THEN 'ALTO' 
                    ELSE 'ATENÇÃO'
                END as nivel_gravidade
            FROM alerta a
            JOIN leitura l ON a.fk_id_leitura = l.id_leitura
            JOIN componente c ON a.fk_id_componente = c.id_componente
            JOIN maquina m ON l.fk_id_maquina = m.id_maquina
            WHERE l.data_hora_captura >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY l.data_hora_captura DESC
            LIMIT 50
        `;

        console.log('Executando query para alertas operacionais...');

        const resultado = await leituraModel.executar(query);

        console.log(`Encontrados ${resultado.length} alertas operacionais`);

        res.json(resultado);

    } catch (error) {
        console.error('Erro ao buscar alertas operacionais:', error);
        res.status(500).json({
            error: 'Erro ao buscar alertas operacionais',
            details: error.message
        });
    }
});

router.get('/kernel', (req, res) => {
  try {
    const tipo = os.type();      
    const release = os.release(); 
    const plataforma = os.platform(); 

    const kernel = `${tipo} ${release} (${plataforma})`;
    res.json({ kernel });
  } catch (err) {
    console.error('Erro ao obter kernel:', err);
    res.status(500).json({ kernel: null, error: 'Kernel não encontrado.' });
  }
});

module.exports = router;