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

module.exports = {
    kpiAlertasTotais, 
    kpiAlertasPorTipo, 
    kpiAlertasPorComponente, 
    listarAlertasRecentes
}