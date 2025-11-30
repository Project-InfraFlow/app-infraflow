var memoriaModel = require("../models/memoriaModel");

async function detalhes(req, res) {
    try {
        const resultado = await memoriaModel.buscarDetalhes(req.params.idMaquina);
        resultado.length > 0 ? res.json(resultado[0]) : res.status(204).send();
    } catch (erro) {
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

async function historico(req, res) {
    try {
        const resultado = await memoriaModel.buscarHistorico(req.params.idMaquina, req.query.limite || 50);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

async function alertas(req, res) {
    try {
        const resultado = await memoriaModel.buscarAlertas(req.params.idMaquina, req.query.horas || 24);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

async function alertasCriticos(req, res) {
    try {
        const resultado = await memoriaModel.buscarAlertasCriticos(
            req.params.idMaquina, 
            req.query.horas || 1
        );
        res.json({ total: resultado[0]?.total_alertas_criticos || 0 });
    } catch (erro) {
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

async function totalProcessos(req, res) {
    try {
        const totalProcessos = Math.floor(Math.random() * 100) + 150;
        res.json({ total: totalProcessos });
    } catch (erro) {
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

async function somaAlertas(req, res) {
    try {
        const resultado = await memoriaModel.buscarSomaAlertas(
            req.params.idMaquina, 
            req.query.horas || 1
        );
        console.log('DEBUG somaAlertas - Resultado:', resultado);
        res.json({ total: resultado[0]?.total_alertas || 0 });
    } catch (erro) {
        console.error('ERRO somaAlertas:', erro);
        res.status(500).json(erro.sqlMessage || erro.message);
    }
}

module.exports = { 
    detalhes, 
    historico, 
    alertas,
    alertasCriticos,
    totalProcessos,
    somaAlertas  
};