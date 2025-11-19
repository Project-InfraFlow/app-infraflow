const estadoApp = { usuarioLogado: false };

class SistemaLogin {
    constructor() {
        this.usuarios = {
            admin: 'admin123',
            operador: 'op123',
            monitor: 'mon123'
        };
    }

    validarCredenciais(usuario, senha) {
        return this.usuarios[usuario] === senha;
    }

    realizarLogin(usuario, senha) {
        if (this.validarCredenciais(usuario, senha)) {
            estadoApp.usuarioLogado = true;
            localStorage.setItem('infraflow_user', usuario);
            this.mostrarDashboard();
            return true;
        }
        return false;
    }

    realizarLogout() {
        estadoApp.usuarioLogado = false;
        localStorage.removeItem('infraflow_user');
        this.mostrarLogin();
        pararMockTempoReal();
    }

    verificarSessao() {
        const usuarioSalvo = localStorage.getItem('infraflow_user');
        if (usuarioSalvo && this.usuarios[usuarioSalvo]) {
            estadoApp.usuarioLogado = true;
            this.mostrarDashboard();
            return true;
        }
        return false;
    }

    mostrarLogin() {
        const login = document.getElementById('loginScreen');
        const dash = document.getElementById('dashboard');
        if (login) login.classList.remove('hidden');
        if (dash) dash.classList.add('hidden');
    }

    mostrarDashboard() {
        const login = document.getElementById('loginScreen');
        const dash = document.getElementById('dashboard');
        if (login) login.classList.add('hidden');
        if (dash) dash.classList.remove('hidden');
    }
}

function pararMockTempoReal() {}

function cadastrarUser() {}

function edit_user() {}

function delete_user() {}

document.addEventListener('DOMContentLoaded', function () {
    const sistemaLogin = new SistemaLogin();

    const storedUser = localStorage.getItem('infraflow_user');
    const sidebarUser = document.getElementById('sidebarUser');
    if (storedUser && sidebarUser) {
        sidebarUser.textContent = storedUser;
    }

    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const views = Array.from(document.querySelectorAll('.view'));

    navItems.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const view = btn.getAttribute('data-view');
            navItems.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            views.forEach(function (v) { v.classList.remove('active'); });
            const target = document.getElementById('view-' + view);
            if (target) target.classList.add('active');
        });
    });

    const tabBtns = Array.from(document.querySelectorAll('.cadastro-tabs .tab-btn'));
    const tabs = Array.from(document.querySelectorAll('.cadastro-content .tab-content'));

    tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const tab = btn.getAttribute('data-tab');
            tabBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            tabs.forEach(function (t) { t.classList.remove('active'); });
            const target = document.getElementById('tab-' + tab);
            if (target) target.classList.add('active');
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            try {
                sessionStorage.clear();
                localStorage.removeItem('infraflow_user');
            } catch (e) {}
            window.location.replace('../login.html');
        });
    }

    const usuarioForm = document.getElementById('usuarioForm');
    if (usuarioForm) {
        usuarioForm.addEventListener('submit', function (e) {
            e.preventDefault();
        });
    }

    const maquinaForm = document.getElementById('maquinaForm');
    if (maquinaForm) {
        maquinaForm.addEventListener('submit', function (e) {
            e.preventDefault();
        });
    }

    const edgeSelector = document.getElementById('edgeSelector');
    const monitorSelecionado = document.getElementById('monitor-selecionado');
    if (edgeSelector && monitorSelecionado) {
        monitorSelecionado.textContent = edgeSelector.value;
        edgeSelector.addEventListener('change', function () {
            monitorSelecionado.textContent = edgeSelector.value;
        });
    }

    const lastUpdateTime = document.getElementById('lastUpdateTime');
    if (lastUpdateTime) {
        function atualizarHora() {
            const agora = new Date();
            const h = String(agora.getHours()).padStart(2, '0');
            const m = String(agora.getMinutes()).padStart(2, '0');
            const s = String(agora.getSeconds()).padStart(2, '0');
            lastUpdateTime.textContent = h + ':' + m + ':' + s;
        }
        atualizarHora();
        setInterval(atualizarHora, 1000);
    }
});
