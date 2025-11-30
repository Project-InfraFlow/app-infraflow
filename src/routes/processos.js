const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

router.get('/', (req, res) => {
    exec('ps -e | wc -l', (err, stdout, stderr) => {
        if (err) {
            console.error('Erro ao contar processos:', err);
            return res.status(500).json({ error: 'Falha ao contar processos' });
        }

        const total = parseInt(stdout.trim(), 10);
        if (isNaN(total)) {
            return res.status(500).json({ error: 'Resultado inválido ao contar processos' });
        }

        return res.json({ total });
    });
});

module.exports = router;
