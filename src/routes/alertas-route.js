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

router.get("/listarAlertasRecentes", (req, res) => {
    alertasController.listarAlertasRecentes(req, res);
}); 

router.get("/heatmapAlertasHoraComponente", (req, res) => {
    alertasController.heatmapAlertasHoraComponente(req, res);
});

router.post("/registrarOcorrencia", (req, res) => {
    alertasController.registrarOcorrencia(req, res);
});

router.get("/kpiAlertasCriticos", function(req, res) {
    alertasController.kpiAlertasCriticos(req, res);
});

router.get("/kpiAlertasSemRegistro", function (req, res) {
    alertasController.kpiAlertasSemRegistro(req, res);
});
module.exports = router;