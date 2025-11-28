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

function kpiStatusAndamento(req, res) {
    alertasModel.kpiStatusAndamento()
        .then(resultado => {
            console.log("Resultado do model kpiStatusAndamento:", resultado);

            // Alguns drivers retornam array com um objeto, outros retornam diretamente objeto.
            const row = Array.isArray(resultado) && resultado.length ? resultado[0] : resultado;

            if (!row) {
                return res.status(204).send("Nenhum resultado encontrado.");
            }

            // Normaliza nome das chaves para garantir front consistente
            const data = {
                sem_abertura: Number(row.sem_abertura) || 0,
                total_alertas: Number(row.total_alertas) || 0
            };

            res.status(200).json(data);
        })
        .catch(erro => {
            console.error("ERRO no controller kpiStatusAndamento:", erro);
            res.status(500).json({ error: erro.sqlMessage || erro.message || "Erro interno do servidor." });
        });
}

function kpiAlertasPorComponente(req, res) {
    alertasModel.kpiAlertasPorComponente()
    .then(result => {
        if (!result.length) return res.status(200).json([]);

        res.status(200).json(result);
    })
    .catch(err => {
        console.error("Erro kpiAlertasPorComponente:", err);
        res.status(500).json(err);
    });
}


 function graficoComponentes (req, res) {
    console.log('📊 Controller graficoComponentes acionado');
    
    // CORREÇÃO: Use a variável global ou import do database que já existe no controller
    const sql = `
        SELECT c.nome_componente AS componente,
               COUNT(a.id_alerta) AS qtd
        FROM alerta a
        JOIN componente c ON a.fk_id_componente = c.id_componente
        GROUP BY c.nome_componente;
    `;

    // Use a mesma conexão que suas outras funções usam
    database.executar(sql, function (err, resultado) {
        if (err) {
            console.log('❌ Erro na query graficoComponentes:', err);
            return res.status(500).json(err);
        }
        console.log('✅ Dados retornados para gráfico:', resultado);
        return res.json(resultado);
    });
}

module.exports = {
    kpiAlertasTotais,
    kpiAtencao, 
    kpiCritico, 
    kpiStatusAndamento, 
    kpiAlertasPorComponente,
    graficoComponentes
}