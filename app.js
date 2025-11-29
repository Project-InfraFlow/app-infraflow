var ambiente_processo = 'producao';
//var ambiente_processo = 'desenvolvimento';

var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';
require("dotenv").config({ path: caminho_env });

var express = require("express");
var cors = require("cors");
var path = require("path");

var leiturasRouter = require("./src/routes/leituras");
var indexRouter = require("./src/routes/index");
var usuarioRouter = require("./src/routes/usuarios");
var avisosRouter = require("./src/routes/avisos");
var medidasRouter = require("./src/routes/medidas");
var empresasRouter = require("./src/routes/empresas");
var segurancaRouter = require("./src/routes/segurancaRoutes");
var memoriaRouter = require("./src/routes/memoria");
var cpuRouter = require("./src/routes/cpu");
var alertaRouter = require("./src/routes/alertas-route");
var redeRouter = require("./src/routes/redeRoute");
var latenciaRouter = require("./src/routes/latencia");
var iaRouter = require("./src/routes/ia");
var contatoRouter = require("./src/routes/contato");
var maquinaRouter = require("./src/routes/maquinas");




var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/usuarios", usuarioRouter);
app.use("/avisos", avisosRouter);
app.use("/medidas", medidasRouter);
app.use("/empresas", empresasRouter);
app.use("/api/seguranca", segurancaRouter);
app.use("/api/memoria", memoriaRouter);
app.use("/api/cpu", cpuRouter);
app.use("/contato", contatoRouter);
app.use("/alertas-route", alertaRouter);
app.use("/redeRoute", redeRouter);
app.use("/api", latenciaRouter);
app.use("/maquinas", maquinaRouter);
app.use("/api/leituras", leiturasRouter);
app.use("/ia", iaRouter); 

app.get("/dashboard/dashboard_CPU", function(req, res) {
    res.sendFile(path.join(__dirname, "public/dashboard_CPU.html"));
});

app.get("/dashboard/memoria", function(req, res) {
    res.sendFile(path.join(__dirname, "public/dashboard/memoria.html"));
});

app.get("/dashboard/disco", function(req, res) {
    res.sendFile(path.join(__dirname, "public/disco.html"));
});

app.get("/dashboard/dashbord_rede", function(req, res) {
    res.sendFile(path.join(__dirname, "public/dashbord_rede.html"));
});

app.get("/dashboard/seguranca", function(req, res) {
    res.sendFile(path.join(__dirname, "public/seguranca.html"));
});

app.get("/dashboard/dashboard-alertas", function(req, res) {
    res.sendFile(path.join(__dirname, "public/dashboard-alertas.html"));
});

var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

app.listen(PORTA_APP, function () {
    console.log(`
Servidor rodando em http://${HOST_APP}:${PORTA_APP}

Ambiente atual: ${process.env.AMBIENTE_PROCESSO}

Se desenvolvimento → banco local
Se produção → banco remoto
`);
});