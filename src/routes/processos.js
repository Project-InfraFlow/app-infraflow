const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', (req, res) => {
    try {
        const total = os.cpus().length;

        return res.json({ total });
    } catch (err) {
        console.error("Erro em /api/processos:", err);
        return res.status(500).json({ error: "Falha ao obter processos" });
    }
});

module.exports = router;
