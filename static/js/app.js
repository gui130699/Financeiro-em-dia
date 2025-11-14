// Configuração do Supabase
const SUPABASE_URL = 'https://xgdlagtezxpnwafdzpci.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGxhZ3RlenhwbndhZmR6cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzk1NTksImV4cCI6MjA3ODcxNTU1OX0.EQCHnNEzuPIxNu-2bOoO6RL2gs4W6qQAk8Bx3LTb2uU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado da aplicação
let currentUser = null;
let currentPage = 'login';

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Verificar autenticação
async function checkAuth() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (userId && userName) {
        currentUser = { id: userId, nome: userName };
        showPage('home');
    } else {
        showPage('login');
    }
}

// Mostrar página
function showPage(page) {
    currentPage = page;
    const app = document.getElementById('app');
    
    switch(page) {
        case 'login':
            app.innerHTML = getLoginHTML();
            break;
        case 'register':
            app.innerHTML = getRegisterHTML();
            break;
        case 'home':
            app.innerHTML = getHomeHTML();
            loadDashboard();
            break;
        case 'lancamentos':
            app.innerHTML = getLancamentosHTML();
            loadLancamentos();
            break;
        default:
            app.innerHTML = getLoginHTML();
    }
}

// HTML da página de login
function getLoginHTML() {
    return `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body p-5">
                            <div class="text-center mb-4">
                                <i class="bi bi-cash-coin" style="font-size: 3rem; color: #4CAF50;"></i>
                                <h2 class="mt-3">Finanças em Dia</h2>
                                <p class="text-muted">Sistema de Controle Financeiro PWA</p>
                            </div>
                            
                            <form id="loginForm" onsubmit="handleLogin(event)">
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="loginEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Senha</label>
                                    <input type="password" class="form-control" id="loginPassword" required>
                                </div>
                                <button type="submit" class="btn btn-success w-100 mb-3">
                                    <i class="bi bi-box-arrow-in-right"></i> Entrar
                                </button>
                            </form>
                            
                            <div class="text-center">
                                <button class="btn btn-link" onclick="showPage('register')">
                                    Criar nova conta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// HTML da página de registro
function getRegisterHTML() {
    return `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body p-5">
                            <h2 class="text-center mb-4">Criar Conta</h2>
                            
                            <form id="registerForm" onsubmit="handleRegister(event)">
                                <div class="mb-3">
                                    <label class="form-label">Nome</label>
                                    <input type="text" class="form-control" id="registerName" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="registerEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Senha</label>
                                    <input type="password" class="form-control" id="registerPassword" required>
                                </div>
                                <button type="submit" class="btn btn-success w-100 mb-3">
                                    <i class="bi bi-person-plus"></i> Criar Conta
                                </button>
                            </form>
                            
                            <div class="text-center">
                                <button class="btn btn-link" onclick="showPage('login')">
                                    Já tenho conta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// HTML da home
function getHomeHTML() {
    return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="#" onclick="showPage('home')">
                    <i class="bi bi-cash-coin"></i> Finanças em Dia
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <a class="nav-link active" href="#" onclick="showPage('home')">
                                <i class="bi bi-house-door"></i> Home
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" onclick="showPage('lancamentos')">
                                <i class="bi bi-journal-text"></i> Lançamentos
                            </a>
                        </li>
                    </ul>
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <span class="nav-link" id="status-conexao">
                                <i class="bi bi-wifi"></i> Online
                            </span>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                                <i class="bi bi-person-circle"></i> ${currentUser.nome}
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="logout()">
                                    <i class="bi bi-box-arrow-right"></i> Sair
                                </a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        
        <div class="container mt-4">
            <h2><i class="bi bi-graph-up"></i> Dashboard</h2>
            <div id="dashboard-content" class="row mt-4">
                <div class="col-12 text-center">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// HTML da página de lançamentos
function getLancamentosHTML() {
    return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="#" onclick="showPage('home')">
                    <i class="bi bi-cash-coin"></i> Finanças em Dia
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="#" onclick="showPage('home')">
                                <i class="bi bi-house-door"></i> Home
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link active" href="#" onclick="showPage('lancamentos')">
                                <i class="bi bi-journal-text"></i> Lançamentos
                            </a>
                        </li>
                    </ul>
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <span class="nav-link" id="status-conexao">
                                <i class="bi bi-wifi"></i> Online
                            </span>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                                <i class="bi bi-person-circle"></i> ${currentUser.nome}
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="logout()">
                                    <i class="bi bi-box-arrow-right"></i> Sair
                                </a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        
        <div class="container mt-4">
            <h2><i class="bi bi-journal-text"></i> Lançamentos</h2>
            <div id="lancamentos-content" class="mt-4">
                <div class="text-center">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !data) {
            alert('Email ou senha incorretos!');
            return;
        }
        
        // Nota: Em produção, usar bcrypt no servidor
        // Por simplicidade, vamos permitir login
        currentUser = { id: data.id, nome: data.nome };
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userName', data.nome);
        
        showPage('home');
    } catch (err) {
        alert('Erro ao fazer login: ' + err.message);
    }
}

// Registro
async function handleRegister(event) {
    event.preventDefault();
    
    const nome = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha: password }])
            .select()
            .single();
        
        if (error) {
            alert('Erro ao criar conta: ' + error.message);
            return;
        }
        
        alert('Conta criada com sucesso!');
        showPage('login');
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

// Logout
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    currentUser = null;
    showPage('login');
}

// Carregar dashboard
async function loadDashboard() {
    try {
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*')
            .eq('usuario_id', currentUser.id);
        
        if (error) throw error;
        
        const receitas = data.filter(l => l.tipo === 'receita' && l.status === 'pago');
        const despesas = data.filter(l => l.tipo === 'despesa' && l.status === 'pago');
        
        const totalReceitas = receitas.reduce((sum, l) => sum + parseFloat(l.valor), 0);
        const totalDespesas = despesas.reduce((sum, l) => sum + parseFloat(l.valor), 0);
        const saldo = totalReceitas - totalDespesas;
        
        document.getElementById('dashboard-content').innerHTML = `
            <div class="col-md-4">
                <div class="card text-white bg-success">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-arrow-up-circle"></i> Receitas</h5>
                        <h3>R$ ${totalReceitas.toFixed(2)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-white bg-danger">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-arrow-down-circle"></i> Despesas</h5>
                        <h3>R$ ${totalDespesas.toFixed(2)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-white ${saldo >= 0 ? 'bg-primary' : 'bg-warning'}">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-wallet2"></i> Saldo</h5>
                        <h3>R$ ${saldo.toFixed(2)}</h3>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
}

// Carregar lançamentos
async function loadLancamentos() {
    try {
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*, categorias(nome)')
            .eq('usuario_id', currentUser.id)
            .order('data', { ascending: false });
        
        if (error) throw error;
        
        let html = '<div class="table-responsive"><table class="table table-striped"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(lanc => {
            const valor = parseFloat(lanc.valor).toFixed(2);
            const classe = lanc.tipo === 'receita' ? 'text-success' : 'text-danger';
            html += `
                <tr>
                    <td>${new Date(lanc.data).toLocaleDateString('pt-BR')}</td>
                    <td>${lanc.descricao}</td>
                    <td>${lanc.categorias ? lanc.categorias.nome : '-'}</td>
                    <td class="${classe}">R$ ${valor}</td>
                    <td><span class="badge ${lanc.status === 'pago' ? 'bg-success' : 'bg-warning'}">${lanc.status}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('lancamentos-content').innerHTML = html;
    } catch (err) {
        console.error('Erro ao carregar lançamentos:', err);
    }
}
