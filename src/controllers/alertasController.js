var alertasModel = require("../models/alertasModel"); // Mantém a importação

function kpiAlertasTotais(req, res) {

    alertasModel.kpiAlertasTotais()
        .then(resultado => {
            if (resultado.length > 0) {

                res.status(200).json(resultado);
            } else {

                res.status(204).send("Nenhum resultado encontrado.");
            }
        })
        .catch(erro => {
            console.error("ERRO no controller kpiAlertasTotais: ", erro);
            res.status(500).json(erro.sqlMessage || erro.message || "Erro interno do servidor.");
        });
}

function kpiAlertasPorTipo(req, res) {

    alertasModel.kpiAlertasPorTipo()
        .then(resultado => {
            if (resultado.length > 0) {

                res.status(200).json(resultado);
            } else {

                res.status(204).send("Nenhum resultado encontrado.");
            }
        })
        .catch(erro => {
            console.error("ERRO no controller kpiAlertasPorTipo: ", erro);
            res.status(500).json(erro.sqlMessage || erro.message || "Erro interno do servidor.");
        });
}

function kpiAlertasPorComponente(req, res) {

    alertasModel.kpiAlertasPorComponente()
        .then(resultado => {
            if (resultado.length > 0) {

                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum resultado encontrado.");
            }
        })
        .catch(erro => {
            console.error("ERRO no controller kpiAlertasPorComponente: ", erro);
            res.status(500).json(erro.sqlMessage || erro.message || "Erro interno do servidor.");
        });
}

function listarAlertasRecentes(req, res) {
    alertasModel.listarAlertasRecentes()
        .then(resultado => {
            if (resultado.length === 0) {
                return res.status(204).send("Nenhum alerta encontrado.");
            }
            res.status(200).json(resultado);
        })
        .catch(erro => {
            console.error("Erro ao listar alertas: ", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno no servidor.");
        });
}

function heatmapAlertasHoraComponente(req, res) {
    alertasModel.heatmapAlertasHoraComponente()
        .then(resultado => {
            if (resultado.length === 0) {
                return res.status(204).send("Nenhum dado para heatmap.");
            }
            res.status(200).json(resultado);
        })
        .catch(erro => {
            console.error("Erro no Heatmap:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno no servidor.");
        });
}

function registrarOcorrencia(req, res) {
    const { id_alerta, descricao } = req.body;

    if (!id_alerta || !descricao) {
        return res.status(400).send("Campos inválidos.");
    }

    alertasModel.registrarOcorrencia(id_alerta, descricao)
        .then(() => res.status(200).send("Ocorrência registrada com sucesso."))
        .catch(erro => {
            console.error("Erro ao registrar ocorrência:", erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function kpiAlertasCriticos(req, res) {

    alertasModel.kpiAlertasCriticos()
        .then(resultado => {

            if (resultado.length === 0) {
                return res.status(204).send("Nenhum dado encontrado.");
            }

            let { alertasHoje, lambda } = resultado[0];

            if (!lambda || lambda <= 0) lambda = 1; // evita NaN caso não haja histórico

            // Calcula probabilidade Poisson: P(X = k)
            function poisson(k, lambda) {
                return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
            }

            // fatorial simples
            function factorial(n) {
                return n <= 1 ? 1 : n * factorial(n - 1);
            }

            let prob = poisson(alertasHoje, lambda) * 100;

            // Classificação
            let mensagem = "";

            if (prob > 15) {
                mensagem = `${alertasHoje} alertas hoje. ${prob.toFixed(2)}% de chance. Normal.`;
            } else if (prob > 1) {
                mensagem = `${alertasHoje} alertas hoje. ${prob.toFixed(2)}% de chance. Raro.`;
            } else {
                mensagem = `${alertasHoje} alertas hoje. <1% de chance. Fora da curva.`;
            }

            res.json({
                alertasHoje,
                lambda,
                probabilidade: prob.toFixed(2),
                mensagem
            });
        })
        .catch(erro => {
            console.error("Erro no controller kpiAlertasCriticos:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

function kpiAlertasSemRegistro(req, res) {

    alertasModel.kpiAlertasSemRegistro()
        .then(resultado => {

            if (!resultado || resultado.length === 0) {
                return res.status(204).send("Nenhum resultado.");
            }

            const total = resultado[0].alertasSemRegistro;
            let mensagem = "";

            if (total === 0) {
                mensagem = "Nenhum alerta sem registro.";
            } else if (total < 5) {
                mensagem = `${total} alertas sem registro. Baixo volume.`;
            } else if (total < 15) {
                mensagem = `${total} alertas sem registro. Atenção.`;
            } else {
                mensagem = `${total} alertas sem registro. Crítico.`;
            }

            res.json({
                alertasSemRegistro: total,
                mensagem
            });

        })
        .catch(erro => {
            console.error("Erro na KPI Alertas Sem Registro:", erro);
            res.status(500).json(erro.sqlMessage || erro);
        });
}

function alertasComRegistroLista(req, res) {
    alertasModel.alertasComRegistroLista()
        .then(resultado => {
            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum alerta com registro encontrado.");
            }
        })
        .catch(erro => {
            console.error("ERRO ao buscar alertas com registro: ", erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

module.exports = {
    kpiAlertasTotais,
    kpiAlertasPorTipo,
    kpiAlertasPorComponente,
    listarAlertasRecentes,
    heatmapAlertasHoraComponente,
    registrarOcorrencia,
    kpiAlertasCriticos, 
    kpiAlertasSemRegistro, 
    alertasComRegistroLista
}