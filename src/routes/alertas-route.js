var express = require("express");
var router = express.Router();

var alertasController = require("../controllers/alertasController");

router.get("/kpiAlertasTotais", function (req, res) {
     alertasController.kpiAlertasTotais(req, res); 
})


router.get("/kpiAlertasPorTipo", function (req, res) {
     alertasController.kpiAlertasPorTipo(req, res); 
})

router.get("/kpiAlertasPorComponente", function (req, res) {
     alertasController.kpiAlertasPorComponente(req, res); 
})


module.exports = router;