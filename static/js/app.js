// Configuração do Supabase
const SUPABASE_URL = 'https://xgdlagtezxpnwafdzpci.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGxhZ3RlenhwbndhZmR6cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzk1NTksImV4cCI6MjA3ODcxNTU1OX0.EQCHnNEzuPIxNu-2bOoO6RL2gs4W6qQAk8Bx3LTb2uU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado da aplicação
let currentUser = null;
let currentPage = 'login';
let categorias = [];
let lancamentos = [];

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Atualizar status de conexão
    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
});

function updateConnectionStatus() {
    const statusEl = document.getElementById('status-conexao');
    if (statusEl) {
        if (navigator.onLine) {
            statusEl.innerHTML = '<i class="bi bi-wifi"></i> Online';
            statusEl.className = 'nav-link text-success';
        } else {
            statusEl.innerHTML = '<i class="bi bi-wifi-off"></i> Offline';
            statusEl.className = 'nav-link text-warning';
        }
    }
}

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
async function showPage(page) {
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
            await loadDashboard();
            break;
        case 'lancamentos':
            app.innerHTML = getLancamentosHTML();
            await loadCategorias();
            await loadLancamentos();
            // Definir data atual
            document.getElementById('lanc-data').valueAsDate = new Date();
            break;
        case 'categorias':
            app.innerHTML = getCategoriasHTML();
            await loadCategoriasPage();
            break;
        case 'relatorios':
            app.innerHTML = getRelatoriosHTML();
            break;
        default:
            app.innerHTML = getLoginHTML();
    }
    
    updateConnectionStatus();
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
        ${getNavbar('home')}
        
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
        ${getNavbar('lancamentos')}
        
        <div class="container mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-journal-text"></i> Lançamentos</h2>
                <button class="btn btn-success" onclick="showNovoLancamento()">
                    <i class="bi bi-plus-circle"></i> Novo Lançamento
                </button>
            </div>
            
            <!-- Formulário de Novo Lançamento -->
            <div id="form-novo-lancamento" class="card mb-4" style="display: none;">
                <div class="card-body">
                    <h5 class="card-title">Novo Lançamento</h5>
                    <form onsubmit="salvarLancamento(event)">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="form-label">Data</label>
                                <input type="date" class="form-control" id="lanc-data" required>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Tipo</label>
                                <select class="form-select" id="lanc-tipo" required onchange="filtrarCategorias()">
                                    <option value="">Selecione...</option>
                                    <option value="receita">Receita</option>
                                    <option value="despesa">Despesa</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Categoria</label>
                                <select class="form-select" id="lanc-categoria" required>
                                    <option value="">Selecione o tipo primeiro</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Valor (R$)</label>
                                <input type="number" step="0.01" class="form-control" id="lanc-valor" required>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <label class="form-label">Descrição</label>
                                <input type="text" class="form-control" id="lanc-descricao" required>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="lanc-status">
                                    <option value="pendente">Pendente</option>
                                    <option value="pago">Pago</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Parcelas</label>
                                <input type="number" class="form-control" id="lanc-parcelas" min="1" value="1">
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <label class="form-label">Observações</label>
                                <textarea class="form-control" id="lanc-observacoes" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-check-circle"></i> Salvar
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="cancelarNovoLancamento()">
                                <i class="bi bi-x-circle"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Lista de Lançamentos -->
            <div id="lancamentos-content">
                <div class="text-center">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Navbar reutilizável
function getNavbar(activePage) {
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
                            <a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="#" onclick="showPage('home')">
                                <i class="bi bi-house-door"></i> Home
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === 'lancamentos' ? 'active' : ''}" href="#" onclick="showPage('lancamentos')">
                                <i class="bi bi-journal-text"></i> Lançamentos
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === 'categorias' ? 'active' : ''}" href="#" onclick="showPage('categorias')">
                                <i class="bi bi-tags"></i> Categorias
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === 'relatorios' ? 'active' : ''}" href="#" onclick="showPage('relatorios')">
                                <i class="bi bi-file-earmark-bar-graph"></i> Relatórios
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

// Carregar categorias
async function loadCategorias() {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .order('nome');
        
        if (error) throw error;
        categorias = data;
        
        // Se não tiver categorias, criar padrões
        if (categorias.length === 0) {
            await criarCategoriasInicio();
        }
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
    }
}

// Criar categorias padrão
async function criarCategoriasInicio() {
    const categoriasPadroes = [
        { nome: 'Salário', tipo: 'receita' },
        { nome: 'Freelance', tipo: 'receita' },
        { nome: 'Investimentos', tipo: 'receita' },
        { nome: 'Alimentação', tipo: 'despesa' },
        { nome: 'Transporte', tipo: 'despesa' },
        { nome: 'Moradia', tipo: 'despesa' },
        { nome: 'Saúde', tipo: 'despesa' },
        { nome: 'Educação', tipo: 'despesa' },
        { nome: 'Lazer', tipo: 'despesa' },
        { nome: 'Outros', tipo: 'receita' },
        { nome: 'Outros', tipo: 'despesa' }
    ];
    
    for (const cat of categoriasPadroes) {
        await supabase.from('categorias').insert([{
            usuario_id: currentUser.id,
            nome: cat.nome,
            tipo: cat.tipo
        }]);
    }
    
    await loadCategorias();
}

// Filtrar categorias por tipo
function filtrarCategorias() {
    const tipo = document.getElementById('lanc-tipo').value;
    const selectCat = document.getElementById('lanc-categoria');
    
    selectCat.innerHTML = '<option value="">Selecione...</option>';
    
    if (tipo) {
        const catsFiltradas = categorias.filter(c => c.tipo === tipo);
        catsFiltradas.forEach(cat => {
            selectCat.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
        });
    }
}

// Mostrar formulário de novo lançamento
function showNovoLancamento() {
    document.getElementById('form-novo-lancamento').style.display = 'block';
    document.getElementById('lanc-data').valueAsDate = new Date();
}

// Cancelar novo lançamento
function cancelarNovoLancamento() {
    document.getElementById('form-novo-lancamento').style.display = 'none';
    document.getElementById('form-novo-lancamento').querySelector('form').reset();
}

// Salvar lançamento
async function salvarLancamento(event) {
    event.preventDefault();
    
    const data = document.getElementById('lanc-data').value;
    const tipo = document.getElementById('lanc-tipo').value;
    const categoria_id = document.getElementById('lanc-categoria').value;
    const valor = parseFloat(document.getElementById('lanc-valor').value);
    const descricao = document.getElementById('lanc-descricao').value;
    const status = document.getElementById('lanc-status').value;
    const parcelas = parseInt(document.getElementById('lanc-parcelas').value);
    const observacoes = document.getElementById('lanc-observacoes').value;
    
    try {
        if (parcelas > 1) {
            // Parcelado
            const numeroContrato = `PAR${Date.now()}`;
            const dataBase = new Date(data);
            
            for (let i = 1; i <= parcelas; i++) {
                const dataParcela = new Date(dataBase);
                dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
                
                await supabase.from('lancamentos').insert([{
                    usuario_id: currentUser.id,
                    tipo,
                    categoria_id,
                    valor,
                    descricao: `${descricao} (${i}/${parcelas})`,
                    data: dataParcela.toISOString().split('T')[0],
                    status: i === 1 ? status : 'pendente',
                    observacoes,
                    eh_parcelado: true,
                    parcela_atual: i,
                    total_parcelas: parcelas,
                    numero_contrato: numeroContrato
                }]);
            }
            
            alert(`${parcelas} parcelas criadas com sucesso!`);
        } else {
            // Lançamento simples
            const { error } = await supabase.from('lancamentos').insert([{
                usuario_id: currentUser.id,
                tipo,
                categoria_id,
                valor,
                descricao,
                data,
                status,
                observacoes,
                eh_parcelado: false
            }]);
            
            if (error) throw error;
            alert('Lançamento salvo com sucesso!');
        }
        
        cancelarNovoLancamento();
        await loadLancamentos();
        await loadDashboard();
    } catch (err) {
        alert('Erro ao salvar: ' + err.message);
    }
}

// Carregar lançamentos
async function loadLancamentos() {
    try {
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*, categorias(nome)')
            .eq('usuario_id', currentUser.id)
            .order('data', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        lancamentos = data;
        
        if (data.length === 0) {
            document.getElementById('lancamentos-content').innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Nenhum lançamento cadastrado ainda.
                    Clique em "Novo Lançamento" para começar!
                </div>
            `;
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>';
        
        data.forEach(lanc => {
            const valor = parseFloat(lanc.valor).toFixed(2);
            const classeValor = lanc.tipo === 'receita' ? 'text-success' : 'text-danger';
            const classeRow = lanc.tipo === 'receita' ? 
                (lanc.status === 'pago' ? 'table-success' : 'table-warning') :
                (lanc.status === 'pago' ? 'table-light' : 'table-danger');
            
            html += `
                <tr class="${classeRow}">
                    <td>${new Date(lanc.data).toLocaleDateString('pt-BR')}</td>
                    <td>${lanc.descricao}</td>
                    <td>${lanc.categorias ? lanc.categorias.nome : '-'}</td>
                    <td class="${classeValor}"><strong>R$ ${valor}</strong></td>
                    <td>
                        <span class="badge ${lanc.status === 'pago' ? 'bg-success' : 'bg-warning'}">
                            ${lanc.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="toggleStatus(${lanc.id}, '${lanc.status}')" title="Alternar status">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="excluirLancamento(${lanc.id})" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('lancamentos-content').innerHTML = html;
    } catch (err) {
        console.error('Erro ao carregar lançamentos:', err);
        document.getElementById('lancamentos-content').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Erro ao carregar lançamentos: ${err.message}
            </div>
        `;
    }
}

// Alternar status pago/pendente
async function toggleStatus(id, statusAtual) {
    const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';
    
    try {
        const { error } = await supabase
            .from('lancamentos')
            .update({ status: novoStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadLancamentos();
        await loadDashboard();
    } catch (err) {
        alert('Erro ao atualizar status: ' + err.message);
    }
}

// Excluir lançamento
async function excluirLancamento(id) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    
    try {
        const { error } = await supabase
            .from('lancamentos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadLancamentos();
        await loadDashboard();
    } catch (err) {
        alert('Erro ao excluir: ' + err.message);
    }
}

// Página de categorias
function getCategoriasHTML() {
    return `
        ${getNavbar('categorias')}
        <div class="container mt-4">
            <h2><i class="bi bi-tags"></i> Categorias</h2>
            <div id="categorias-content">
                <div class="text-center">
                    <div class="spinner-border text-success"></div>
                </div>
            </div>
        </div>
    `;
}

async function loadCategoriasPage() {
    await loadCategorias();
    
    let html = '<div class="row">';
    html += '<div class="col-md-6"><h4>Receitas</h4><ul class="list-group">';
    categorias.filter(c => c.tipo === 'receita').forEach(cat => {
        html += `<li class="list-group-item">${cat.nome}</li>`;
    });
    html += '</ul></div>';
    
    html += '<div class="col-md-6"><h4>Despesas</h4><ul class="list-group">';
    categorias.filter(c => c.tipo === 'despesa').forEach(cat => {
        html += `<li class="list-group-item">${cat.nome}</li>`;
    });
    html += '</ul></div></div>';
    
    document.getElementById('categorias-content').innerHTML = html;
}

// Página de relatórios
function getRelatoriosHTML() {
    return `
        ${getNavbar('relatorios')}
        <div class="container mt-4">
            <h2><i class="bi bi-file-earmark-bar-graph"></i> Relatórios</h2>
            <div class="alert alert-info mt-4">
                <i class="bi bi-info-circle"></i> Funcionalidade de relatórios em desenvolvimento.
            </div>
        </div>
    `;
}
