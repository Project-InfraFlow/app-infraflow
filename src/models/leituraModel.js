var database = require("../database/config");

function executar(query) {
    console.log("Executando a instrução SQL: \n" + query);
    return database.executar(query);
}

module.exports = {
    executar
};