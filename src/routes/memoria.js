var express = require("express");
var router = express.Router();
var memoriaController = require("../controllers/memoriaController");

router.get("/detalhes/:idMaquina", memoriaController.detalhes);
router.get("/historico/:idMaquina", memoriaController.historico);
router.get("/alertas/:idMaquina", memoriaController.alertas);
router.get("/alertas-criticos/:idMaquina", memoriaController.alertasCriticos);
router.get("/total-processos/:idMaquina", memoriaController.totalProcessos);
router.get("/soma-alertas/:idMaquina", memoriaController.somaAlertas);

module.exports = router;