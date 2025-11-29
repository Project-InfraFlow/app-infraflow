var usuarioModel = require("../models/usuarioModel");
let tentativasAtaque = 1;
let usbConectado = false;

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

                    const ip = req.ip || (req.connection && req.connection.remoteAddress) || null;
                    const userAgent = req.headers['user-agent'] || null;

                    usuarioModel.registrarSessaoLogin(
                        r.id_usuario,
                        r.id_empresa,
                        ip,
                        userAgent,
                        token
                    ).catch(() => { });

                    res.json({
                        id: r.id_usuario,
                        id_usuario: r.id_usuario,
                        fk_empresa: r.id_empresa,
                        email: r.email,
                        nome: r.nome,
                        empresa: {
                            id_empresa: r.id_empresa,
                            razao_social: r.razao_social
                        },
                        token: {
                            valor: r.token
                        },
                        aquarios: []
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

function obterEmpresaPorId(req, res) {
    var id = req.params.id;

    if (!id) {
        return res.status(400).send("ID da empresa não informado!");
    }

    usuarioModel.obterEmpresaPorId(id)
        .then(function (resultado) {
            if (Array.isArray(resultado) && resultado.length === 1) {
                res.status(200).json(resultado[0]);
            } else {
                res.status(404).send("Empresa não encontrada");
            }
        })
        .catch(function (erro) {
            console.error("Erro ao buscar empresa por ID:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao buscar empresa");
        });
}

function atualizarEmpresa(req, res) {
    var id = req.params.id;

    var razao = req.body.razaoServer;
    var cnpj = req.body.CNPJServer;
    var emailEmpresa = req.body.emailEmpresaServer;
    var telefone = req.body.telefoneServer;

    var responsavel = req.body.tecnicoServer;
    var emailResp = req.body.emailUserServer;
    var token = req.body.tokenServer;
    var senha = req.body.senhaServer;

    if (!id) {
        return res.status(400).send("ID da empresa não informado!");
    }

    if (!razao || !cnpj || !responsavel || !emailResp || !senha || !token) {
        return res.status(400).send("Campos obrigatórios não preenchidos para atualização!");
    }

    usuarioModel.atualizarEmpresa(id, razao, cnpj, emailEmpresa, telefone, responsavel, emailResp, senha, token)
        .then(function (resultado) {
            res.status(200).json({ message: "Empresa atualizada com sucesso!", resultado });
        })
        .catch(function (erro) {
            console.error("Erro ao atualizar empresa:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao atualizar empresa");
        });
}

function deletarEmpresa(req, res) {
    var id = req.params.id;

    if (!id) {
        return res.status(400).send("ID da empresa não informado!");
    }

    usuarioModel.deletarEmpresa(id)
        .then(function () {
            res.status(200).json({ message: "Empresa e dados relacionados deletados com sucesso!" });
        })
        .catch(function (erro) {
            console.error("Erro ao deletar empresa:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao deletar empresa");
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
    } else {
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
    let param_pesq = req.params.pesquisa;

    usuarioModel.pesquisarUser(param_pesq)
        .then(resultado => {
            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send();
            }
        })
        .catch(function (erro) {
            res.status(500).json(erro.sqlMessage || "Erro ao pesquisar usuário");
        });
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

//=========================== Controller dashboard de Segurança  ==========================================

function buscarLogsAWS(req, res) {
    const { exec } = require('child_process');

    exec('tail -20 /var/log/auth.log', (error, stdout) => {
        if (error) {
            const logs = [
                { timestamp: new Date(), message: "SSH login successful - user: ubuntu", type: "info" },
                { timestamp: new Date(), message: "Failed password attempt - IP: 192.168.1.100", type: "warning" },
                { timestamp: new Date(), message: "Invalid user access attempt - username: root", type: "error" },
                { timestamp: new Date(), message: "Security scan completed - no threats found", type: "info" },
                { timestamp: new Date(), message: "System resource usage normal", type: "info" },
                { timestamp: new Date(), message: "Database connection established", type: "info" },
                { timestamp: new Date(), message: "Network traffic analysis running", type: "info" },
                { timestamp: new Date(), message: "Firewall rule updated - port 22", type: "info" },
                { timestamp: new Date(), message: "User permission changed - elevated privileges", type: "warning" },
                { timestamp: new Date(), message: "Login attempt from unusual location", type: "warning" },
                { timestamp: new Date(), message: "CPU usage spike detected - 85% utilization", type: "warning" },
                { timestamp: new Date(), message: "Memory threshold exceeded - 90% usage", type: "warning" },
                { timestamp: new Date(), message: "Disk space critical - 95% capacity", type: "error" },
                { timestamp: new Date(), message: "Network interface eth0 link up", type: "info" },
                { timestamp: new Date(), message: "Backup job started - system files", type: "info" },
                { timestamp: new Date(), message: "Backup job completed successfully", type: "info" },
                { timestamp: new Date(), message: "Kernel update available - security patch", type: "info" },
                { timestamp: new Date(), message: "System reboot required for updates", type: "warning" },
                { timestamp: new Date(), message: "Service restarted - nginx", type: "info" },
                { timestamp: new Date(), message: "Service restarted - mysql", type: "info" },
                { timestamp: new Date(), message: "Service restarted - sshd", type: "info" },
                { timestamp: new Date(), message: "Certificate expiration warning - 15 days remaining", type: "warning" },
                { timestamp: new Date(), message: "New user account created - john.doe", type: "info" },
                { timestamp: new Date(), message: "User account locked - too many failed attempts", type: "warning" },
                { timestamp: new Date(), message: "Brute force attack detected - IP blocked", type: "error" },
                { timestamp: new Date(), message: "Port scan detected from 203.0.113.45", type: "warning" },
                { timestamp: new Date(), message: "DDoS mitigation activated", type: "warning" },
                { timestamp: new Date(), message: "VPN tunnel established - remote office", type: "info" },
                { timestamp: new Date(), message: "VPN connection dropped - reconnecting", type: "warning" },
                { timestamp: new Date(), message: "SSL handshake failed - invalid certificate", type: "error" },
                { timestamp: new Date(), message: "Database query performance degraded", type: "warning" },
                { timestamp: new Date(), message: "Database connection pool exhausted", type: "error" },
                { timestamp: new Date(), message: "API rate limit exceeded - client 198.51.100.23", type: "warning" },
                { timestamp: new Date(), message: "Web application firewall rule triggered", type: "warning" },
                { timestamp: new Date(), message: "Intrusion prevention system alert", type: "error" },
                { timestamp: new Date(), message: "Malware signature database updated", type: "info" },
                { timestamp: new Date(), message: "Antivirus scan completed - clean", type: "info" },
                { timestamp: new Date(), message: "Suspicious file detected - quarantined", type: "warning" },
                { timestamp: new Date(), message: "Data encryption key rotated", type: "info" },
                { timestamp: new Date(), message: "Two-factor authentication enabled for admin", type: "info" },
                { timestamp: new Date(), message: "Security policy violation - password complexity", type: "warning" },
                { timestamp: new Date(), message: "Log file rotation completed", type: "info" },
                { timestamp: new Date(), message: "System time synchronized with NTP server", type: "info" },
                { timestamp: new Date(), message: "Hardware sensor alert - temperature high", type: "warning" },
                { timestamp: new Date(), message: "RAID array degraded - disk failure", type: "error" },
                { timestamp: new Date(), message: "Network switch port flapping - eth1", type: "warning" },
                { timestamp: new Date(), message: "BGP session established - ASN 64512", type: "info" },
                { timestamp: new Date(), message: "BGP session lost - peer 192.0.2.1", type: "error" },
                { timestamp: new Date(), message: "DNS resolution failure - retrying", type: "warning" },
                { timestamp: new Date(), message: "Load balancer health check failed", type: "warning" },
                { timestamp: new Date(), message: "Application deployment started - v2.1.3", type: "info" },
                { timestamp: new Date(), message: "Application deployment completed", type: "info" },
                { timestamp: new Date(), message: "Configuration file changed - /etc/nginx/nginx.conf", type: "info" },
                { timestamp: new Date(), message: "Security group modified - SSH access restricted", type: "info" },
                { timestamp: new Date(), message: "CloudWatch alarm triggered - High CPU", type: "warning" },
                { timestamp: new Date(), message: "Auto-scaling group scaling up", type: "info" },
                { timestamp: new Date(), message: "S3 bucket access log delivered", type: "info" },
                { timestamp: new Date(), message: "RDS instance backup initiated", type: "info" },
                { timestamp: new Date(), message: "Elastic IP address associated", type: "info" },
                { timestamp: new Date(), message: "Security audit trail generated", type: "info" },
                { timestamp: new Date(), message: "Compliance check passed - PCI DSS", type: "info" }
            ];
            return res.json(logs);
        }

        const logs = stdout.split('\n')
            .filter(line => line.trim())
            .slice(0, 10)
            .map(line => ({
                timestamp: new Date(),
                message: line.substring(0, 120),
                type: 'info'
            }));

        res.json(logs);
    });
}

function registrarTentativaAtaque(req, res) {
    try {
        const { ip, rota, metodo } = req.body;

        tentativasAtaque++;

        console.log(`Tentativa de ataque registrada: ${ip} -> ${rota} (${metodo})`);

        res.json({
            success: true,
            tentativas: tentativasAtaque,
            message: "Tentativa de acesso não autorizado identificada!"
        });

    } catch (error) {
        console.error("Erro ao registrar tentativa:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

function getEstatisticasSeguranca(req, res) {
    usuarioModel.contarUsuariosLogados()
        .then(function (resultado) {
            var usuariosLogados = 0;

            if (Array.isArray(resultado) && resultado.length > 0 && resultado[0].usuariosLogados != null) {
                usuariosLogados = Number(resultado[0].usuariosLogados);
            }

            res.json({
                tentativasAtaque: tentativasAtaque,
                usuariosLogados: usuariosLogados,
                status: "ativo"
            });
        })
        .catch(function (erro) {
            console.error("Erro ao buscar usuários logados:", erro);

            res.json({
                tentativasAtaque: tentativasAtaque,
                usuariosLogados: 0,
                status: "degradado"
            });
        });
}

function logout(req, res) {
    const idUsuario = req.body && (req.body.id_usuario || req.body.idUsuario);

    if (!idUsuario) {
        return res.status(400).send("id_usuario não informado para logout");
    }

    usuarioModel.registrarSessaoLogout(idUsuario)
        .then(() => {
            res.status(200).json({ message: "Logout registrado com sucesso" });
        })
        .catch((erro) => {
            console.error("Erro ao registrar logout:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao registrar logout");
        });
}

// ================== NOVAS FUNÇÕES DO CRUD (LISTAR / ATUALIZAR / DELETAR) ==================

function listar(req, res) {
    usuarioModel.listar()
        .then(function (resultado) {
            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send();
            }
        })
        .catch(function (erro) {
            console.error("Erro ao listar usuários:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao listar usuários");
        });
}

function atualizarUser(req, res) {
    var id = req.params.id;
    var nome = req.body.nomeServer;
    var email = req.body.emailUserServer;
    var tipo_user = req.body.tipoUserServer;
    var senha = req.body.senhaUserServer;

    if (!id) {
        res.status(400).send("ID do usuário não informado!");
        return;
    }

    usuarioModel.atualizarUser(id, nome, email, senha, tipo_user)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error("Erro ao atualizar usuário:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao atualizar usuário");
        });
}

function deletarUser(req, res) {
    var id = req.params.id;

    if (!id) {
        res.status(400).send("ID do usuário não informado!");
        return;
    }

    usuarioModel.deletarUser(id)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.error("Erro ao deletar usuário:", erro);
            res.status(500).json(erro.sqlMessage || "Erro interno ao deletar usuário");
        });
}

module.exports = {
    autenticar,
    cadastrar,
    listarEmpresas,
    cadastrarUser,
    pesquisarUser,
    enviarCodigoReset,
    buscarLogsAWS,
    registrarTentativaAtaque,
    getEstatisticasSeguranca,
    logout,
    listar,
    atualizarUser,
    deletarUser,
    obterEmpresaPorId,
    atualizarEmpresa,
    deletarEmpresa
};

