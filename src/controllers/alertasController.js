var alertasModel = require("../models/alertasModel"); // Mantém a importação

function kpiAlertasTotais (req, res){
 
    alertasModel.kpiAlertasTotais() 
    .then(resultado => {
        if(resultado.length > 0) {
            
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

function kpiAlertasPorTipo(req, res){
 
    alertasModel.kpiAlertasPorTipo() 
    .then(resultado => {
        if(resultado.length > 0) {
            
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

function kpiAlertasPorComponente(req, res){
    
    alertasModel.kpiAlertasPorComponente() 
    .then(resultado => {
        if(resultado.length > 0) {
          
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

module.exports = {
    kpiAlertasTotais, 
    kpiAlertasPorTipo, 
    kpiAlertasPorComponente, 
    listarAlertasRecentes, 
    heatmapAlertasHoraComponente, 
    registrarOcorrencia
}