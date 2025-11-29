var express = require("express");
var router = express.Router();

var maquinaController = require("../controllers/maquinaController");

// listar máquinas de uma empresa
router.get("/listar/:idEmpresa", function (req, res) {
    maquinaController.listarPorEmpresa(req, res);
});

// cadastrar nova máquina
router.post("/cadastrar", function (req, res) {
    maquinaController.cadastrar(req, res);
});

// atualizar máquina
router.put("/:idMaquina", function (req, res) {
    maquinaController.atualizar(req, res);
});

// deletar máquina
router.delete("/:idMaquina", function (req, res) {
    maquinaController.deletar(req, res);
});

module.exports = router;
