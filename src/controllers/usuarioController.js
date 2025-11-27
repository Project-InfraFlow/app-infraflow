var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {
    var email = (req.body && (req.body.email || req.body.emailServer)) ? String(req.body.email || req.body.emailServer).trim() : undefined;
    var senha = (req.body && (req.body.senha || req.body.senhaServer)) ? req.body.senha || req.body.senhaServer : undefined;
    var token = (req.body && (req.body.token || req.body.tokenServer)) ? req.body.token || req.body.tokenServer : undefined;

    if (email == undefined || email === "") {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");
    } else if (token == undefined) {
        res.status(400).send("Seu token está undefined!");
    } else {
        usuarioModel.autenticar(email, senha, token)
            .then(function (resultadoAutenticar) {
                if (Array.isArray(resultadoAutenticar) && resultadoAutenticar.length == 1) {
                    const r = resultadoAutenticar[0];
                    // Resposta mantendo compatibilidade e entregando os IDs exigidos
                    res.json({
                        id: r.id_usuario,                  // compatibilidade
                        id_usuario: r.id_usuario,          // para sessionStorage.ID_USUARIO
                        fk_empresa: r.id_empresa,          // para sessionStorage.ID_EMPRESA
                        email: r.email,
                        nome: r.nome,
                        empresa: {
                            id_empresa: r.id_empresa,
                            razao_social: r.razao_social
                        },
                        token: {
                            valor: r.token
                        },
                        aquarios: [] // mantém seu shape antigo
                    });
                } else if (Array.isArray(resultadoAutenticar) && resultadoAutenticar.length == 0) {
                    res.status(403).send("Email ou senha ou token inválido(s)");
                } else {
                    res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                }
            })
            .catch(function (erro) {
                res.status(500).json(erro.sqlMessage || "Erro interno ao autenticar");
            });
    }
}

function cadastrar(req, res) {
    var razao = req.body.razaoServer;
    var cnpj = req.body.CNPJServer;
    var emailEmpresa = req.body.emailEmpresaServer;
    var telefone = req.body.telefoneServer;
    var tecnico = req.body.tecnicoServer; 
    var emailUser = req.body.emailUserServer;
    var senha = req.body.senhaServer;
    var token = req.body.tokenServer; 

    if (razao == undefined) {
        res.status(400).send("A razão social está undefined!");
    } else if (cnpj == undefined) {
        res.status(400).send("O CNPJ está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("A senha está undefined!");
    } else if (emailUser == undefined) {
        res.status(400).send("O e-mail do usuário está undefined!");
    } else if ((emailEmpresa == undefined || String(emailEmpresa).trim() === "") && 
               (telefone == undefined || String(telefone).trim() === "")) {
        res.status(400).send("É necessário preencher pelo menos o e-mail ou o telefone da empresa!");
    } else {
        usuarioModel.cadastrar(razao, cnpj, emailEmpresa, telefone, tecnico, emailUser, senha, token)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                res.status(500).json(erro.sqlMessage || "Erro interno ao cadastrar");
            });
    }
}

function listarEmpresas(req, res) {
    usuarioModel.listarEmpresas()
        .then(async resultado => {
            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send();
            }
        })
        .catch(function (erro) {
            res.status(500).json(erro.sqlMessage || "Erro ao listar empresas");
        });
}

function cadastrarUser(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailUserServer;
    var tipo_user = req.body.tipoUserServer; 
    var senha = req.body.senhaUserServer;

    if (nome == undefined) {
        res.status(400).send("o nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("O email está undefined!");
    } else if (tipo_user == undefined) {
        res.status(400).send("o tipo_user está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("A senha do usuário está undefined!");
    }  else {
        usuarioModel.cadastrarUser(nome, email, senha, tipo_user)
            .then(function (resultado) {
                res.status(200).json(resultado);
            })
            .catch(function (erro) {
                res.status(500).json(erro.sqlMessage || "Erro interno ao cadastrar");
            });
    }
}

function pesquisarUser(req, res) {
    let param_pesq = req.params.pesquisa

    usuarioModel.pesquisarUser(param_pesq)
    .then(resultado => {
        if (resultado.length > 0) {
            res.status(200).json(resultado)
        }
    })
}

function enviarCodigoReset(req, res) {
    var email = (req.body && req.body.email) ? String(req.body.email).trim() : undefined;

    if (email === undefined || email === "") {
        res.status(400).send("O e-mail não foi fornecido!");
        return;
    }


    usuarioModel.verificarEmail(email)
        .then(function (resultadoConsulta) {
            
            if (Array.isArray(resultadoConsulta) && resultadoConsulta.length === 1) {
                const usuario = resultadoConsulta[0];
                
                const codigo = Math.floor(100000 + Math.random() * 900000); 
                
                res.status(200).json({ 
                    message: "Se o e-mail estiver cadastrado, o código foi enviado.",
                    id_usuario: usuario.id_usuario 
                });
                
            } else {

                res.status(200).json({ 
                    message: "Se o e-mail estiver cadastrado, o código foi enviado." 
                });
            }
        })
        .catch(function (erro) {
            console.error("Erro ao verificar e-mail:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao tentar buscar o e-mail.");
        });
}

function buscarLogsAWS(req, res) {
    const { exec } = require('child_process');
    
    exec('tail -20 /var/log/auth.log', (error, stdout) => {
        if (error) {
            console.log('Logs reais indisponiveis, usando logs simulados...');
            return enviarLogsSimulados(res);
        }
        
        const logLines = stdout.split('\n').filter(line => line.trim());
        
        if (logLines.length === 0) {
            return enviarLogsSimulados(res);
        }
        
        const logs = logLines.slice(0, 15).map(line => ({
            timestamp: new Date(),
            message: formatarLogReal(line),
            type: classificarLog(line)
        }));
        
        console.log(`${logs.length} logs reais enviados`);
        res.json(logs);
    });
}

function enviarLogsSimulados(res) {
    const eventos = [
        "SSH login successful - user: ubuntu",
        "Failed password attempt - IP: 192.168.1.100", 
        "Invalid user access attempt - username: root",
        "SSH authentication successful",
        "Sudo command executed by admin user",
        "AWS CloudWatch synchronization started",
        "Automatic backup in progress",
        "Active monitoring - Main door camera",
        "User session started - terminal: pts/0",
        "Database connection established",
        "Security scan completed - no threats found",
        "Network traffic analysis running",
        "System update available - security patches",
        "Firewall rule updated - port 22",
        "User permission changed - elevated privileges",
        "Login attempt from unusual location",
        "System resource usage normal",
        "Security protocol enabled - 2FA",
        "Data encryption active - AES-256",
        "Intrusion detection system online",
        "VPN connection established",
        "Security audit log generated",
        "Access control list updated",
        "Malware scan initiated",
        "Network intrusion attempt blocked"
    ];
    
    const tipos = ["info", "warning", "error"];
    const logs = [];
    
    // Gera 15-20 logs simulados
    const numLogs = Math.floor(Math.random() * 6) + 15;
    
    for (let i = 0; i < numLogs; i++) {
        logs.push({
            timestamp: new Date(Date.now() - Math.random() * 3600000), // Última hora
            message: eventos[Math.floor(Math.random() * eventos.length)],
            type: tipos[Math.floor(Math.random() * tipos.length)]
        });
    }
    
    // Ordena por timestamp (mais recente primeiro)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`${logs.length} logs simulados enviados`);
    res.json(logs.slice(0, 20));
}

function formatarLogReal(line) {
    if (line.includes('Accepted publickey')) return 'SSH login accepted';
    if (line.includes('Invalid user')) return 'Invalid user access attempt';
    if (line.includes('Failed password')) return 'Failed password authentication';
    if (line.includes('session opened')) return 'User session initiated';
    if (line.includes('Connection closed')) return 'Connection terminated';
    if (line.includes('sudo')) return 'Privileged command executed';
    return line.substring(0, 120);
}

function classificarLog(line) {
    if (line.includes('Invalid') || line.includes('Failed')) return 'warning';
    if (line.includes('error') || line.includes('Error')) return 'error';
    return 'info';
}

module.exports = {
    autenticar,
    cadastrar, 
    listarEmpresas, 
    cadastrarUser, 
    pesquisarUser, 
    enviarCodigoReset,
    buscarLogsAWS
};
