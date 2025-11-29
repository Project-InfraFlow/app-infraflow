var maquinaModel = require("../models/maquinaModel");

function listarPorEmpresa(req, res) {
    var idEmpresa = req.params.idEmpresa;

    if (!idEmpresa) {
        res.status(400).json({ erro: "idEmpresa não informado." });
        return;
    }

    maquinaModel.listarPorEmpresa(idEmpresa)
        .then(function (resultado) {
            if (resultado.length === 0) {
                res.status(204).send();
            } else {
                res.status(200).json(resultado);
            }
        })
        .catch(function (erro) {
            console.log("Erro ao listar máquinas: ", erro.sqlMessage || erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

function cadastrar(req, res) {
    var nome_maquina = req.body.nome_maquina;
    var so = req.body.so;
    var localizacao = req.body.localizacao;
    var km = req.body.km || "";
    var fk_empresa_maquina = req.body.fk_empresa_maquina;

    if (!nome_maquina || !so || !localizacao || !fk_empresa_maquina) {
        res.status(400).json({ erro: "Preencha nome_maquina, so, localizacao e fk_empresa_maquina." });
        return;
    }

    maquinaModel.cadastrar(nome_maquina, so, localizacao, km, fk_empresa_maquina)
        .then(function (resultado) {
            res.status(201).json(resultado);
        })
        .catch(function (erro) {
            console.log("Erro ao cadastrar máquina: ", erro.sqlMessage || erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

function atualizar(req, res) {
    var id_maquina = req.params.idMaquina;
    var nome_maquina = req.body.nome_maquina;
    var so = req.body.so;
    var localizacao = req.body.localizacao;
    var km = req.body.km || "";

    if (!id_maquina) {
        res.status(400).json({ erro: "idMaquina não informado." });
        return;
    }

    if (!nome_maquina || !so || !localizacao) {
        res.status(400).json({ erro: "Preencha nome_maquina, so e localizacao." });
        return;
    }

    maquinaModel.atualizar(id_maquina, nome_maquina, so, localizacao, km)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log("Erro ao atualizar máquina: ", erro.sqlMessage || erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

function deletar(req, res) {
    var id_maquina = req.params.idMaquina;

    if (!id_maquina) {
        res.status(400).json({ erro: "idMaquina não informado." });
        return;
    }

    maquinaModel.deletar(id_maquina)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log("Erro ao deletar máquina: ", erro.sqlMessage || erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

module.exports = {
    listarPorEmpresa,
    cadastrar,
    atualizar,
    deletar
};
