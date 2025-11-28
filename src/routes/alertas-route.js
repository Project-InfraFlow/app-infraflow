var express = require("express");
var router = express.Router();

var alertasController = require("../controllers/alertasController");

router.get("/kpiAlertasTotais", function (req, res) {
     alertasController.kpiAlertasTotais(req, res); 
})

router.get("/kpiCritico", function (req, res) {
     alertasController.kpiCritico(req, res); 
})

router.get("/kpiAtencao", function (req, res) {
     alertasController.kpiAtencao(req, res); 
})

router.get("/listarAlertas", function (req, res) {
     alertasController.listarAlertas(req, res); 
})

module.exports = router;