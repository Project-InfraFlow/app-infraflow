var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
});

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get("/listarEmpresas", function (req, res) {
    usuarioController.listarEmpresas(req, res);
});

router.post("/cadastrarUser", function (req, res) {
    usuarioController.cadastrarUser(req, res);
});

router.get("/empresa/:id", function (req, res) {
    usuarioController.obterEmpresaPorId(req, res);
});

router.put("/empresa/:id", function (req, res) {
    usuarioController.atualizarEmpresa(req, res);
});

router.delete("/empresa/:id", function (req, res) {
    usuarioController.deletarEmpresa(req, res);
});

router.get("/pesquisarUser/:pesquisa", function (req, res) {
    usuarioController.pesquisarUser(req, res);
});

router.post("/enviar-codigo-reset", function (req, res) {
    usuarioController.enviarCodigoReset(req, res);
});

router.get("/logs-aws", function (req, res) {
    usuarioController.buscarLogsAWS(req, res);
});

router.post("/registrar-tentativa", function (req, res) {
    usuarioController.registrarTentativaAtaque(req, res);
});

router.get("/estatisticas-seguranca", function (req, res) {
    usuarioController.getEstatisticasSeguranca(req, res);
});

router.post("/logout", function (req, res) {
    usuarioController.logout(req, res);
});

// ================== ROTAS NOVAS DO CRUD DE USUÁRIOS (TELA CADASTRO) ==================

router.get("/listar", function (req, res) {
    usuarioController.listar(req, res);
});

router.put("/:id", function (req, res) {
    usuarioController.atualizarUser(req, res);
});

router.delete("/:id", function (req, res) {
    usuarioController.deletarUser(req, res);
});

module.exports = router;
