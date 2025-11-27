var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get("/listarEmpresas", function (req, res) {
    usuarioController.listarEmpresas(req, res);
});

router.post("/cadastrarUser", function (req, res) {
    usuarioController.cadastrarUser(req, res);
})

router.get("/pesquisarUser/:pesquisa", function (req, res) {
     usuarioController.pesquisarUser(req, res); 
})

router.post("/enviar-codigo-reset", function (req, res) {
    usuarioController.enviarCodigoReset(req, res); 
});

router.get("/logs-aws", function (req, res) {
    usuarioController.buscarLogsAWS(req, res);
});

module.exports = router;