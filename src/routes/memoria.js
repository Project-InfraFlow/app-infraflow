var express = require("express");
var router = express.Router();
var memoriaController = require("../controllers/memoriaController");

router.get("/detalhes/:idMaquina", memoriaController.getDetalhes);
router.get("/historico/:idMaquina", memoriaController.getHistorico);
router.get("/alertas/:idMaquina", memoriaController.getAlertas);
router.get("/processo-maior-memoria/:idMaquina", memoriaController.getProcessoMaiorMemoria); 

module.exports = router;