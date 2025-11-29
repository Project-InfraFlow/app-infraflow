var contatoModel = require("../models/contatoModel");

function registrar(req, res) {
    var nome = req.body.nome;
    var email = req.body.email;
    var mensagem = req.body.mensagem;

    if (!nome || !email || !mensagem) {
        return res.status(400).send("Nome, e-mail e mensagem são obrigatórios.");
    }

    contatoModel.registrarContato(nome, email, mensagem)
        .then(function (resultado) {
            res.status(201).json({ ok: true });
        })
        .catch(function (erro) {
            console.error("Erro ao registrar contato:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao registrar contato");
        });
}

module.exports = {
    registrar
};
