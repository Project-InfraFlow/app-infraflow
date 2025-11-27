var analiseModel = require("../models/analiseModel");

function buscarDados(req, res) {

    var maquinaId = req.query.maquinaId || 1;
    var limite = req.query.limite || 30;

    console.log(`Buscando dados da máquina ${maquinaId} (limite ${limite})`);

    analiseModel.buscarDados(maquinaId, limite)
        .then(resultado => {

            if (resultado.length > 0) {

                const dados = resultado.map(r => ({
                    hora: r.horario.toLocaleTimeString("pt-BR"),
                    cpu: r.cpu,
                    latencia: r.latencia,
                    processos: r.processos
                })).reverse();

                res.status(200).json(dados);
            } 
            else {
                res.status(204).send("Nenhum resultado encontrado!");
            }

        })
        .catch(erro => {
            console.log("Erro ao buscar dados:", erro.sqlMessage || erro);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    buscarDados
};
