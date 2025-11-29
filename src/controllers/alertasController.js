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
    // Renomeei para refletir o novo Model
    alertasModel.kpiAlertasPorComponente() 
    .then(resultado => {
        if(resultado.length > 0) {
            // O resultado será um array de objetos, pronto para ser enviado ao JS
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


module.exports = {
    kpiAlertasTotais, 
    kpiAlertasPorTipo, 
    kpiAlertasPorComponente
}