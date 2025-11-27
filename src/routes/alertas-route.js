var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");


router.get("/kpiAlertasTotais", function (req, res) {
     usuarioController.kpiUsers(req, res); 
})

module.exports = router;