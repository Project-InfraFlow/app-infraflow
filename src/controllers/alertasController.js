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


function kpiAtencao (req, res){
 
    alertasModel.kpiAtencao() 
    .then(resultado => {
        if(resultado.length > 0) {
            
            res.status(200).json(resultado); 
        } else {
            
            res.status(204).send("Nenhum resultado encontrado."); 
        }
    })
    .catch(erro => {
        console.error("ERRO no controller kpiAtencao: ", erro);
        res.status(500).json(erro.sqlMessage || erro.message || "Erro interno do servidor.");
    });
}

function kpiCritico (req, res){
 
    alertasModel.kpiCritico() 
    .then(resultado => {
        if(resultado.length > 0) {
            
            res.status(200).json(resultado); 
        } else {
            
            res.status(204).send("Nenhum resultado encontrado."); 
        }
    })
    .catch(erro => {
        console.error("ERRO no controller kpiCritico: ", erro);
        res.status(500).json(erro.sqlMessage || erro.message || "Erro interno do servidor.");
    });
}

module.exports = {
    kpiAlertasTotais,
    kpiAtencao, 
    kpiCritico
}