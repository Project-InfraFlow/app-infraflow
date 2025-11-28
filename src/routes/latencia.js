var express = require("express");
var router = express.Router();

router.get("/latencia", async (req, res) => {
    try {
        const { maquinaId = 1, limite = 5 } = req.query;
        
        // DADOS MOCKADOS - FUNCIONA 100%
        const resultados = [
            { latencia: 45.5, timestamp: new Date().toISOString() },
            { latencia: 42.1, timestamp: new Date(Date.now() - 30000).toISOString() },
            { latencia: 48.9, timestamp: new Date(Date.now() - 60000).toISOString() },
            { latencia: 39.7, timestamp: new Date(Date.now() - 90000).toISOString() },
            { latencia: 51.2, timestamp: new Date(Date.now() - 120000).toISOString() }
        ];
        
        console.log("✅ Rota /api/latencia funcionando! Retornando dados mockados");
        res.json(resultados);
        
    } catch (error) {
        console.error('❌ Erro na rota de latência:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;    