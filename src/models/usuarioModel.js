var database = require("../database/config");

function autenticar(email, senha, token) {
    var instrucaoSql = `
        SELECT 
            u.id_usuario,
            u.nome,
            u.email,
            u.senha,
            e.id_empresa,
            e.razao_social,
            t.token
        FROM usuario AS u
        JOIN empresa AS e 
            ON u.fk_empresa = e.id_empresa
        JOIN token_acesso AS t 
            ON t.fk_id_empresa = u.fk_empresa
        WHERE u.email = '${email}'
          AND u.senha = '${senha}'
          AND t.token = '${token}'
          AND t.ativo = 1
          AND t.data_expiracao > NOW()
        LIMIT 1;
    `;
    return database.executar(instrucaoSql);
}

//=========================== Models dashboard de Usuário adm (InfraFlow) ==========================================

async function cadastrar(razao, cnpj, emailEmpresa, telefone, tecnico, emailUser, senha, token) {
    console.log("Iniciando processo de cadastro completo...");

    try {
        let insertContato = `
            INSERT INTO tipo_contato (telefone, email)
            VALUES ('${telefone}', '${emailEmpresa}');
        `;
        let resultadoContato = await database.executar(insertContato);
        let idTipoContato = resultadoContato.insertId;

        let insertEmpresa = `
            INSERT INTO empresa (razao_social, cnpj, status, fk_tipo_contato)
            VALUES ('${razao}', '${cnpj}', 1, ${idTipoContato});
        `;
        let resultadoEmpresa = await database.executar(insertEmpresa);
        let idEmpresa = resultadoEmpresa.insertId;

        let insertUsuario = `
            INSERT INTO usuario (nome, email, senha, fk_id_tipo_usuario, fk_empresa)
            VALUES ('${tecnico}', '${emailUser}', '${senha}', 2, ${idEmpresa});
        `;
        let resultadoUsuario = await database.executar(insertUsuario);
        let idUsuario = resultadoUsuario.insertId;

        let insertToken = `
            INSERT INTO token_acesso (data_criacao, data_expiracao, ativo, token, fk_id_empresa)
            VALUES (NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 1, '${token}', ${idEmpresa});
        `;
        await database.executar(insertToken);

        console.log("Cadastro concluído com sucesso!");
        return { mensagem: "Cadastro completo realizado com sucesso!", idUsuario: idUsuario };
    } catch (erro) {
        console.log("Erro ao cadastrar:", erro.sqlMessage || erro);
        throw erro;
    }
}

function atualizarEmpresa(idEmpresa, razao, cnpj, emailEmpresa, telefone, responsavel, emailResp, senhaResp, token) {
    var instrucaoSql = `
        UPDATE empresa e
        JOIN tipo_contato tc 
            ON e.fk_tipo_contato = tc.id_tipo_contato
        JOIN usuario u 
            ON u.fk_empresa = e.id_empresa
        JOIN token_acesso t 
            ON t.fk_id_empresa = e.id_empresa
        SET 
            e.razao_social = '${razao}',
            e.cnpj = '${cnpj}',
            tc.telefone = '${telefone}',
            tc.email = '${emailEmpresa}',
            u.nome = '${responsavel}',
            u.email = '${emailResp}',
            u.senha = '${senhaResp}',
            t.token = '${token}'
        WHERE e.id_empresa = ${idEmpresa};
    `;
    return database.executar(instrucaoSql);
}


function listarEmpresas() {
    var instrucaoSql = `
        SELECT 
            e.id_empresa, 
            e.razao_social, 
            e.cnpj,  
            u.nome, 
            CASE WHEN e.status = 1 THEN 'Ativo' ELSE 'Inativo' END AS status
        FROM empresa AS e
        JOIN usuario AS u 
            ON e.id_empresa = u.fk_empresa
        WHERE u.fk_id_tipo_usuario = 1;  
    `;
    return database.executar(instrucaoSql);
}


function obterEmpresaPorId(idEmpresa) {
    var instrucaoSql = `
        SELECT 
            e.id_empresa,
            e.razao_social,
            e.cnpj,
            e.status,
            tc.telefone,
            tc.email AS emailEmpresa,
            u.id_usuario,
            u.nome AS responsavel,
            u.email AS emailResponsavel,
            u.senha AS senhaResponsavel,
            t.token
        FROM empresa AS e
        JOIN tipo_contato AS tc 
            ON tc.id_tipo_contato = e.fk_tipo_contato
        JOIN usuario AS u 
            ON u.fk_empresa = e.id_empresa
        LEFT JOIN token_acesso AS t 
            ON t.fk_id_empresa = e.id_empresa
        WHERE e.id_empresa = ${idEmpresa}
        LIMIT 1;
    `;
    return database.executar(instrucaoSql);
}


function pesquisarUser(pesquisa) {
    var instrucaoSql = `
        SELECT 
            e.id_empresa, 
            e.razao_social, 
            e.cnpj,  
            u.nome, 
            CASE WHEN e.status = 1 THEN 'Ativo' ELSE 'Inativo' END AS status
        FROM empresa AS e
        JOIN usuario AS u 
            ON e.id_empresa = u.fk_empresa
        WHERE u.fk_id_tipo_usuario = 1
          AND u.nome LIKE '${pesquisa}%';
    `;
    return database.executar(instrucaoSql);
}


//=========================== Models dashboard de Usuário comum ==========================================

// LISTAR USUÁRIOS PARA A TELA DE CADASTRO
function listar() {
    var instrucaoSql = `
        SELECT 
            id_usuario AS idusuario,
            nome,
            email,
            fk_id_tipo_usuario AS tipo_permissao
        FROM usuario
        WHERE fk_empresa = 1
        ORDER BY id_usuario;
    `;
    return database.executar(instrucaoSql);
}


function cadastrarUser(nome, email, senha, tipo_user) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, fk_id_tipo_usuario, fk_empresa)
        VALUES ('${nome}', '${email}', '${senha}', ${tipo_user}, 1);
    `;
    return database.executar(instrucaoSql);
}

function atualizarUser(id, nome, email, senha, tipo_user) {
    var instrucaoSql = `
        UPDATE usuario
        SET nome = '${nome}',
            email = '${email}',
            senha = '${senha}',
            fk_id_tipo_usuario = ${tipo_user}
        WHERE id_usuario = ${id};
    `;
    return database.executar(instrucaoSql);
}

function deletarUser(id) {
    var instrucaoSql = `
        DELETE FROM usuario
        WHERE id_usuario = ${id};
    `;
    return database.executar(instrucaoSql);
}

function deletarEmpresa(idEmpresa) {
    // 1) ALERTAS ligados às leituras dessa empresa
    var sqlDeletarAlertas = `
        DELETE a FROM alerta a
        JOIN leitura l ON a.fk_id_leitura = l.id_leitura
        JOIN maquina m ON l.fk_id_maquina = m.id_maquina
        WHERE m.fk_empresa_maquina = ${idEmpresa};
    `;

    // 2) LEITURAS das máquinas da empresa
    var sqlDeletarLeituras = `
        DELETE l FROM leitura l
        JOIN maquina m ON l.fk_id_maquina = m.id_maquina
        WHERE m.fk_empresa_maquina = ${idEmpresa};
    `;

    // 3) PARAMETROS de componentes das máquinas da empresa
    var sqlDeletarParametroComponente = `
        DELETE pc FROM parametro_componente pc
        JOIN componente c ON pc.fk_id_componente = c.id_componente
        JOIN maquina m ON c.fk_id_maquina = m.id_maquina
        WHERE m.fk_empresa_maquina = ${idEmpresa};
    `;

    // 4) NÚCLEOS CPU ligados às máquinas da empresa
    var sqlDeletarNucleos = `
        DELETE nc FROM nucleo_cpu nc
        JOIN maquina m ON nc.fk_id_maquina = m.id_maquina
        WHERE m.fk_empresa_maquina = ${idEmpresa};
    `;

    // 5) COMPONENTES das máquinas da empresa
    var sqlDeletarComponentes = `
        DELETE c FROM componente c
        JOIN maquina m ON c.fk_id_maquina = m.id_maquina
        WHERE m.fk_empresa_maquina = ${idEmpresa};
    `;

    // 6) MÁQUINAS da empresa
    var sqlDeletarMaquinas = `
        DELETE FROM maquina
        WHERE fk_empresa_maquina = ${idEmpresa};
    `;

    // 7) TOKENS da empresa
    var sqlDeletarTokens = `
        DELETE FROM token_acesso
        WHERE fk_id_empresa = ${idEmpresa};
    `;

    // 8) USUÁRIOS da empresa
    var sqlDeletarUsuarios = `
        DELETE FROM usuario
        WHERE fk_empresa = ${idEmpresa};
    `;

    // 9) EMPRESA
    var sqlDeletarEmpresa = `
        DELETE FROM empresa
        WHERE id_empresa = ${idEmpresa};
    `;

    // Encadeia as execuções
    return database.executar(sqlDeletarAlertas)
        .then(() => database.executar(sqlDeletarLeituras))
        .then(() => database.executar(sqlDeletarParametroComponente))
        .then(() => database.executar(sqlDeletarNucleos))
        .then(() => database.executar(sqlDeletarComponentes))
        .then(() => database.executar(sqlDeletarMaquinas))
        .then(() => database.executar(sqlDeletarTokens))
        .then(() => database.executar(sqlDeletarUsuarios))
        .then(() => database.executar(sqlDeletarEmpresa));
}

// Funções recuperação de senha 

function verificarEmail(email) {
    var instrucaoSql = `
        SELECT 
            id_usuario, 
            fk_empresa, 
            email,
            nome 
        FROM usuario 
        WHERE email = '${email}'
        LIMIT 1;
    `;
    return database.executar(instrucaoSql);
}

//=========================== Models dashboard de Segurança ==========================================

function contarUsuariosLogados() {
    var instrucao = `
        SELECT COUNT(*) AS usuariosLogados
        FROM seguranca_sessao
        WHERE status = 'ONLINE';
    `;
    return database.executar(instrucao);
}

function registrarSessaoLogin(idUsuario, idEmpresa, ip, userAgent, tokenUsado) {
    var instrucao = `
        INSERT INTO seguranca_sessao (
            fk_usuario,
            fk_empresa,
            status,
            data_login,
            ip_acesso,
            user_agent,
            token_usado,
            risco
        ) VALUES (
            ${idUsuario},
            ${idEmpresa},
            'ONLINE',
            NOW(),
            ${ip ? `'${ip}'` : 'NULL'},
            ${userAgent ? `'${userAgent.replace(/'/g, "''")}'` : 'NULL'},
            ${tokenUsado ? `'${tokenUsado}'` : 'NULL'},
            0
        );
    `;
    return database.executar(instrucao);
}

function registrarSessaoLogout(idUsuario) {
    var instrucao = `
        UPDATE seguranca_sessao
        SET status = 'OFFLINE',
            data_logout = NOW()
        WHERE fk_usuario = ${idUsuario}
          AND status = 'ONLINE'
        ORDER BY id_sessao DESC
        LIMIT 1;
    `;
    console.log("SQL LOGOUT =>", instrucao);
    return database.executar(instrucao);
}

module.exports = {
    autenticar,
    cadastrar,
    listarEmpresas,
    cadastrarUser,
    pesquisarUser,
    verificarEmail,
    contarUsuariosLogados,
    registrarSessaoLogin,
    registrarSessaoLogout,
    listar,
    atualizarUser,
    deletarUser,
    obterEmpresaPorId,
    atualizarEmpresa,
    deletarEmpresa
};

