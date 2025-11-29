var database = require("../database/config");

function listarPorEmpresa(idEmpresa) {
    var instrucao = `
        SELECT 
            id_maquina,
            nome_maquina,
            so,
            localizacao,
            km,
            fk_empresa_maquina
        FROM maquina
        WHERE fk_empresa_maquina = ${idEmpresa}
        ORDER BY id_maquina;
    `;
    return database.executar(instrucao);
}

function cadastrar(nome_maquina, so, localizacao, km, fk_empresa_maquina) {
    var instrucao = `
        INSERT INTO maquina (nome_maquina, so, localizacao, km, fk_empresa_maquina)
        VALUES ('${nome_maquina}', '${so}', '${localizacao}', '${km}', ${fk_empresa_maquina});
    `;
    return database.executar(instrucao);
}

function atualizar(id_maquina, nome_maquina, so, localizacao, km) {
    var instrucao = `
        UPDATE maquina
        SET 
            nome_maquina = '${nome_maquina}',
            so = '${so}',
            localizacao = '${localizacao}',
            km = '${km}'
        WHERE id_maquina = ${id_maquina};
    `;
    return database.executar(instrucao);
}

function deletar(id_maquina) {
    var instrucao = `
        DELETE FROM maquina
        WHERE id_maquina = ${id_maquina};
    `;
    return database.executar(instrucao);
}

module.exports = {
    listarPorEmpresa,
    cadastrar,
    atualizar,
    deletar
};
