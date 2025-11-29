var database = require("../database/config");

function registrarContato(nome, email, mensagem) {
    var instrucao = `
        INSERT INTO contato_site (nome, email, mensagem, data_envio)
        VALUES ('${nome}', '${email}', '${mensagem}', NOW());
    `;
    return database.executar(instrucao);
}

module.exports = {
    registrarContato
};
