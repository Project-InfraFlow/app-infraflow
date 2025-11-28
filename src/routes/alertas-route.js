// var express = require("express");
// var router = express.Router();

// var alertasController = require("../controllers/alertasController");

// // CORREÇÃO: Use o database do alertasController ou importe corretamente
// router.get("/kpiAlertasTotais", function (req, res) {
//      alertasController.kpiAlertasTotais(req, res); 
// })

// router.get("/kpiCritico", function (req, res) {
//      alertasController.kpiCritico(req, res); 
// })

// router.get("/kpiAtencao", function (req, res) {
//      alertasController.kpiAtencao(req, res); 
// })

// router.get("/listarAlertas", function (req, res) {
//      alertasController.listarAlertas(req, res); 
// })

// router.get("/kpiStatusAndamento", function (req, res) {
//     alertasController.kpiStatusAndamento(req, res); 
// });

// // CORREÇÃO: Movendo a lógica para o controller
// router.get('/graficoComponentes', function (req, res) {
//     alertasController.graficoComponentes(req, res);
// });

// module.exports = router;