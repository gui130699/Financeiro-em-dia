// ============================================
// FINANCEIRO EM DIA - PWA
// Todas as funcionalidades do Flask convertidas para JavaScript
// Versão: 2025-11-14 21:30 - Removido parcela_total (não existe no banco)
// ============================================

// Configuração do Supabase
const SUPABASE_URL = 'https://xgdlagtezxpnwafdzpci.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGxhZ3RlenhwbndhZmR6cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzk1NTksImV4cCI6MjA3ODcxNTU1OX0.EQCHnNEzuPIxNu-2bOoO6RL2gs4W6qQAk8Bx3LTb2uU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global
let currentUser = null;
let currentPage = 'login';
let categorias = [];
let contasFixas = [];
let mesAtual = new Date().toISOString().slice(0, 7);

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
});

function updateConnectionStatus() {
    const statusEl = document.getElementById('status-conexao');
    if (statusEl) {
        statusEl.innerHTML = navigator.onLine ? 
            '<i class="bi bi-wifi"></i> Online' : 
            '<i class="bi bi-wifi-off"></i> Offline';
        statusEl.className = navigator.onLine ? 'nav-link text-success' : 'nav-link text-warning';
    }
}

async function checkAuth() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (userId && userName) {
        currentUser = { id: parseInt(userId), nome: userName };
        showPage('home');
    } else {
        showPage('login');
    }
}

// ============================================
// NAVEGAÇÃO E PÁGINAS
// ============================================

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
            document.getElementById('lanc-data').valueAsDate = new Date();
            break;
        case 'categorias':
            app.innerHTML = getCategoriasHTML();
            await loadCategoriasPage();
            break;
        case 'contas_fixas':
            app.innerHTML = getContasFixasHTML();
            await loadCategorias();
            await loadContasFixas();
            break;
        case 'contas_parceladas':
            app.innerHTML = getContasParceladasHTML();
            await loadContasParceladas();
            break;
        case 'relatorios':
            app.innerHTML = getRelatoriosHTML();
            await loadRelatorios();
            break;
        default:
            app.innerHTML = getLoginHTML();
    }
    
    updateConnectionStatus();
}

// ============================================
// AUTENTICAÇÃO
// ============================================

function getLoginHTML() {
    return `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow-lg">
                        <div class="card-body p-5">
                            <div class="text-center mb-4">
                                <i class="bi bi-cash-coin" style="font-size: 4rem; color: #4CAF50;"></i>
                                <h2 class="mt-3">Finanças em Dia</h2>
                                <p class="text-muted">Controle Financeiro PWA</p>
                            </div>
                            
                            <form onsubmit="handleLogin(event)">
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="loginEmail" required 
                                           placeholder="seu@email.com">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Senha</label>
                                    <input type="password" class="form-control" id="loginPassword" required
                                           placeholder="••••••••">
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

function getRegisterHTML() {
    return `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow-lg">
                        <div class="card-body p-5">
                            <h2 class="text-center mb-4">Criar Conta</h2>
                            
                            <form onsubmit="handleRegister(event)">
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
                                    <input type="password" class="form-control" id="registerPassword" 
                                           required minlength="6">
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
            showAlert('Email ou senha incorretos!', 'danger');
            return;
        }
        
        currentUser = { id: data.id, nome: data.nome };
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userName', data.nome);
        
        showAlert(`Bem-vindo(a), ${data.nome}!`, 'success');
        showPage('home');
    } catch (err) {
        showAlert('Erro ao fazer login: ' + err.message, 'danger');
    }
}

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
            showAlert('Erro ao criar conta: ' + error.message, 'danger');
            return;
        }
        
        // Criar categorias padrão
        await criarCategoriasIniciais(data.id);
        
        showAlert('Conta criada com sucesso!', 'success');
        showPage('login');
    } catch (err) {
        showAlert('Erro: ' + err.message, 'danger');
    }
}

function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    currentUser = null;
    showPage('login');
}

// ============================================
// NAVBAR
// ============================================

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
                            <a class="nav-link ${activePage === 'contas_fixas' ? 'active' : ''}" href="#" onclick="showPage('contas_fixas')">
                                <i class="bi bi-arrow-repeat"></i> Contas Fixas
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === 'contas_parceladas' ? 'active' : ''}" href="#" onclick="showPage('contas_parceladas')">
                                <i class="bi bi-credit-card"></i> Parceladas
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

// ============================================
// HOME / DASHBOARD
// ============================================

function getHomeHTML() {
    return `
        ${getNavbar('home')}
        <div class="container mt-4">
            <h2><i class="bi bi-graph-up"></i> Dashboard - ${getNomeMes()}</h2>
            <div id="dashboard-content" class="row mt-4">
                <div class="col-12 text-center">
                    <div class="spinner-border text-success"></div>
                </div>
            </div>
            
            <div class="mt-5">
                <h4>Últimos Lançamentos</h4>
                <div id="ultimos-lancamentos"></div>
            </div>
        </div>
    `;
}

async function loadDashboard() {
    try {
        console.log('Carregando dashboard para usuário:', currentUser);
        
        // Calcular o último dia do mês corretamente
        const [ano, mes] = mesAtual.split('-').map(Number);
        const ultimoDia = new Date(ano, mes, 0).getDate();
        
        const mesInicio = `${mesAtual}-01`;
        const mesFim = `${mesAtual}-${String(ultimoDia).padStart(2, '0')}`;
        
        console.log('Período:', mesInicio, 'até', mesFim);
        
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .gte('data', mesInicio)
            .lte('data', mesFim);
        
        if (error) {
            console.error('Erro na query Supabase:', error);
            console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
            throw error;
        }
        
        console.log('Lançamentos carregados:', data?.length || 0);
        
        const receitas = data.filter(l => l.tipo === 'receita' && l.status === 'pago');
        const receitasPendentes = data.filter(l => l.tipo === 'receita' && l.status === 'pendente');
        const despesas = data.filter(l => l.tipo === 'despesa' && l.status === 'pago');
        const despesasPendentes = data.filter(l => l.tipo === 'despesa' && l.status === 'pendente');
        
        const totalReceitas = receitas.reduce((sum, l) => sum + parseFloat(l.valor), 0);
        const totalReceitasPendentes = receitasPendentes.reduce((sum, l) => sum + parseFloat(l.valor), 0);
        const totalDespesas = despesas.reduce((sum, l) => sum + parseFloat(l.valor), 0);
        const totalDespesasPendentes = despesasPendentes.reduce((sum, l) => sum + parseFloat(l.valor), 0);
        const saldo = totalReceitas - totalDespesas;
        const saldoPrevisto = (totalReceitas + totalReceitasPendentes) - (totalDespesas + totalDespesasPendentes);
        
        document.getElementById('dashboard-content').innerHTML = `
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-success"><i class="bi bi-arrow-up-circle"></i> Receitas Recebidas</h6>
                        <h4>R$ ${totalReceitas.toFixed(2)}</h4>
                        <small class="text-muted">${receitas.length} lançamentos</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-danger"><i class="bi bi-arrow-down-circle"></i> Despesas Pagas</h6>
                        <h4>R$ ${totalDespesas.toFixed(2)}</h4>
                        <small class="text-muted">${despesas.length} lançamentos</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title ${saldo >= 0 ? 'text-primary' : 'text-warning'}"><i class="bi bi-wallet2"></i> Saldo Atual</h6>
                        <h4 class="${saldo >= 0 ? 'text-primary' : 'text-warning'}">R$ ${saldo.toFixed(2)}</h4>
                        <small class="text-muted">${saldo >= 0 ? 'Positivo' : 'Negativo'}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-info"><i class="bi bi-calendar-check"></i> Saldo Previsto</h6>
                        <h4>R$ ${saldoPrevisto.toFixed(2)}</h4>
                        <small class="text-muted">Com pendentes</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-warning"><i class="bi bi-clock"></i> A Receber</h6>
                        <h4>R$ ${totalReceitasPendentes.toFixed(2)}</h4>
                        <small class="text-muted">${receitasPendentes.length} pendentes</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-danger"><i class="bi bi-exclamation-circle"></i> A Pagar</h6>
                        <h4>R$ ${totalDespesasPendentes.toFixed(2)}</h4>
                        <small class="text-muted">${despesasPendentes.length} pendentes</small>
                    </div>
                </div>
            </div>
        `;
        
        // Carregar últimos lançamentos
        await loadUltimosLancamentos();
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        console.error('Stack trace:', err.stack);
        console.error('Erro completo:', JSON.stringify(err, null, 2));
        
        const dashboardEl = document.getElementById('dashboard-content');
        if (dashboardEl) {
            const errorMsg = err.message || err.msg || JSON.stringify(err);
            dashboardEl.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i> <strong>Erro ao carregar dashboard</strong>
                        <br>${errorMsg}
                        <br><small>Verifique o console (F12) para mais detalhes</small>
                    </div>
                </div>
            `;
        }
        showAlert('Erro ao carregar dashboard', 'danger');
    }
}

async function loadUltimosLancamentos() {
    try {
        console.log('Carregando últimos lançamentos...');
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*, categorias(nome)')
            .eq('usuario_id', currentUser.id)
            .order('data', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('Erro ao buscar últimos lançamentos:', error);
            throw error;
        }
        
        console.log('Últimos lançamentos encontrados:', data?.length || 0);
        
        if (data.length === 0) {
            document.getElementById('ultimos-lancamentos').innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Nenhum lançamento ainda.
                </div>
            `;
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-sm table-hover"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(lanc => {
            const valor = parseFloat(lanc.valor).toFixed(2);
            const classeValor = lanc.tipo === 'receita' ? 'text-success' : 'text-danger';
            html += `
                <tr>
                    <td>${formatDate(lanc.data)}</td>
                    <td>${lanc.descricao}</td>
                    <td><span class="badge bg-secondary">${lanc.categorias ? lanc.categorias.nome : '-'}</span></td>
                    <td class="${classeValor}"><strong>R$ ${valor}</strong></td>
                    <td><span class="badge ${lanc.status === 'pago' ? 'bg-success' : 'bg-warning'}">${lanc.status}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('ultimos-lancamentos').innerHTML = html;
    } catch (err) {
        console.error('Erro ao carregar últimos lançamentos:', err);
        const ultimosEl = document.getElementById('ultimos-lancamentos');
        if (ultimosEl) {
            ultimosEl.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> Erro ao carregar últimos lançamentos: ${err.message}
                </div>
            `;
        }
    }
}

// ============================================
// LANÇAMENTOS
// ============================================

function getLancamentosHTML() {
    return `
        ${getNavbar('lancamentos')}
        <div class="container mt-4">
            <h2><i class="bi bi-journal-text"></i> Lançamentos</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">Adicionar Lançamento</h5>
                    <form onsubmit="handleAddLancamento(event)">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <label class="form-label">Data</label>
                                <input type="date" class="form-control" id="lanc-data" required>
                            </div>
                            <div class="col-md-5 mb-3">
                                <label class="form-label">Descrição</label>
                                <input type="text" class="form-control" id="lanc-descricao" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Categoria</label>
                                <select class="form-select" id="lanc-categoria" required>
                                    <option value="">Carregando...</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Valor</label>
                                <input type="number" step="0.01" class="form-control" id="lanc-valor" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Parcelas</label>
                                <input type="number" class="form-control" id="lanc-parcelas" min="1" value="1">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">
                            <i class="bi bi-plus-circle"></i> Adicionar
                        </button>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Filtrar</h5>
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" id="filtro-tipo" onchange="loadLancamentos()">
                                <option value="">Todos</option>
                                <option value="receita">Receitas</option>
                                <option value="despesa">Despesas</option>
                            </select>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filtro-status" onchange="loadLancamentos()">
                                <option value="">Todos</option>
                                <option value="pago">Pagos</option>
                                <option value="pendente">Pendentes</option>
                            </select>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Categoria</label>
                            <select class="form-select" id="filtro-categoria" onchange="loadLancamentos()">
                                <option value="">Todas</option>
                            </select>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Mês/Ano</label>
                            <input type="month" class="form-control" id="filtro-mes" value="${mesAtual}" onchange="loadLancamentos()">
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="lancamentos-list" class="mt-4"></div>
        </div>
    `;
}

async function loadCategorias() {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .order('nome');
        
        if (error) throw error;
        
        categorias = data || [];
        
        // Atualizar todos os selects de categoria
        const selects = ['lanc-categoria', 'filtro-categoria', 'conta-fixa-categoria'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Selecione...</option>' +
                    categorias.map(c => `<option value="${c.id}">${c.nome} (${c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)})</option>`).join('');
                if (currentValue) select.value = currentValue;
            }
        });
        
        // Atualizar filtro de categoria
        const filtroCategoria = document.getElementById('filtro-categoria');
        if (filtroCategoria) {
            filtroCategoria.innerHTML = '<option value="">Todas</option>' +
                categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        }
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
    }
}

async function handleAddLancamento(event) {
    event.preventDefault();
    
    const data = document.getElementById('lanc-data').value;
    const descricao = document.getElementById('lanc-descricao').value;
    const categoria_id = parseInt(document.getElementById('lanc-categoria').value);
    const valor = parseFloat(document.getElementById('lanc-valor').value);
    const parcelas = parseInt(document.getElementById('lanc-parcelas').value) || 1;
    
    try {
        // Buscar o tipo da categoria selecionada
        const { data: categoria, error: catError } = await supabase
            .from('categorias')
            .select('tipo')
            .eq('id', categoria_id)
            .single();
        
        if (catError) throw catError;
        const tipo = categoria.tipo;
        
        if (parcelas > 1) {
            // Criar lançamento parcelado (sempre pendente)
            await criarLancamentoParcelado(data, descricao, categoria_id, valor, tipo, parcelas);
        } else {
            // Criar lançamento simples (sempre pendente)
            const { error } = await supabase
                .from('lancamentos')
                .insert([{
                    usuario_id: currentUser.id,
                    data,
                    descricao,
                    categoria_id,
                    valor,
                    tipo,
                    status: 'pendente',
                    conta_fixa_id: null,
                    parcela_atual: null
                }]);
            
            if (error) throw error;
        }
        
        showAlert('Lançamento adicionado com sucesso!', 'success');
        event.target.reset();
        document.getElementById('lanc-data').valueAsDate = new Date();
        document.getElementById('lanc-parcelas').value = 1;
        await loadLancamentos();
    } catch (err) {
        showAlert('Erro ao adicionar lançamento: ' + err.message, 'danger');
    }
}

async function criarLancamentoParcelado(dataInicial, descricao, categoria_id, valorTotal, tipo, parcelas) {
    const contratoId = `${Date.now()}_${currentUser.id}`;
    const valorParcela = valorTotal / parcelas;
    
    const lancamentos = [];
    for (let i = 0; i < parcelas; i++) {
        const data = new Date(dataInicial);
        data.setMonth(data.getMonth() + i);
        
        lancamentos.push({
            usuario_id: currentUser.id,
            data: data.toISOString().split('T')[0],
            descricao: `${descricao} (${i + 1}/${parcelas})`,
            categoria_id,
            valor: valorParcela,
            tipo,
            status: 'pendente',
            conta_fixa_id: null,
            parcela_atual: i + 1
        });
    }
    
    const { error } = await supabase
        .from('lancamentos')
        .insert(lancamentos);
    
    if (error) throw error;
}

async function loadLancamentos() {
    try {
        console.log('Carregando lançamentos...');
        const mes = document.getElementById('filtro-mes')?.value || mesAtual;
        const tipo = document.getElementById('filtro-tipo')?.value;
        const status = document.getElementById('filtro-status')?.value;
        const categoria_id = document.getElementById('filtro-categoria')?.value;
        
        // Calcular o último dia do mês corretamente
        const [ano, mesNum] = mes.split('-').map(Number);
        const ultimoDia = new Date(ano, mesNum, 0).getDate();
        
        const mesInicio = `${mes}-01`;
        const mesFim = `${mes}-${String(ultimoDia).padStart(2, '0')}`;
        
        console.log('Filtros:', { mes, tipo, status, categoria_id, mesInicio, mesFim });
        
        let query = supabase
            .from('lancamentos')
            .select('*, categorias(nome)')
            .eq('usuario_id', currentUser.id)
            .gte('data', mesInicio)
            .lte('data', mesFim)
            .order('data', { ascending: false });
        
        if (tipo) query = query.eq('tipo', tipo);
        if (status) query = query.eq('status', status);
        if (categoria_id) query = query.eq('categoria_id', parseInt(categoria_id));
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Erro ao buscar lançamentos:', error);
            throw error;
        }
        
        console.log('Lançamentos carregados:', data?.length || 0);
        
        const listEl = document.getElementById('lancamentos-list');
        
        if (data.length === 0) {
            listEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Nenhum lançamento encontrado.
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach(lanc => {
            const valor = parseFloat(lanc.valor).toFixed(2);
            const classeValor = lanc.tipo === 'receita' ? 'text-success' : 'text-danger';
            const parcelaInfo = lanc.parcela_atual ? ` (Parcela ${lanc.parcela_atual})` : '';
            
            html += `
                <tr>
                    <td>${formatDate(lanc.data)}</td>
                    <td>${lanc.descricao}${parcelaInfo}</td>
                    <td><span class="badge bg-secondary">${lanc.categorias ? lanc.categorias.nome : '-'}</span></td>
                    <td class="${classeValor}"><strong>R$ ${valor}</strong></td>
                    <td><span class="badge ${lanc.tipo === 'receita' ? 'bg-success' : 'bg-danger'}">${lanc.tipo}</span></td>
                    <td>
                        <button class="btn btn-sm ${lanc.status === 'pago' ? 'btn-success' : 'btn-warning'}" 
                                onclick="toggleStatus(${lanc.id}, '${lanc.status}')">
                            ${lanc.status === 'pago' ? '<i class="bi bi-check-circle"></i> Pago' : '<i class="bi bi-clock"></i> Pendente'}
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editarLancamento(${lanc.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLancamento(${lanc.id})" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        listEl.innerHTML = html;
    } catch (err) {
        console.error('Erro ao carregar lançamentos:', err);
        const listEl = document.getElementById('lancamentos-list');
        if (listEl) {
            listEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> Erro ao carregar lançamentos: ${err.message}
                    <br><small>Verifique o console para mais detalhes</small>
                </div>
            `;
        }
        showAlert('Erro ao carregar lançamentos: ' + err.message, 'danger');
    }
}

async function toggleStatus(id, statusAtual) {
    const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';
    
    try {
        const { error } = await supabase
            .from('lancamentos')
            .update({ status: novoStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadLancamentos();
        if (currentPage === 'home') await loadDashboard();
    } catch (err) {
        showAlert('Erro ao alterar status', 'danger');
    }
}

async function editarLancamento(id) {
    try {
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Preencher formulário com dados
        document.getElementById('lanc-data').value = data.data;
        document.getElementById('lanc-descricao').value = data.descricao.split(' (')[0]; // Remove info de parcela
        document.getElementById('lanc-categoria').value = data.categoria_id;
        document.getElementById('lanc-valor').value = data.valor;
        document.getElementById('lanc-tipo').value = data.tipo;
        document.getElementById('lanc-status').value = data.status;
        document.getElementById('lanc-parcelas').value = 1;
        
        // Mudar botão para atualizar
        const form = document.querySelector('form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await handleUpdateLancamento(id);
        };
        
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<i class="bi bi-check-circle"></i> Atualizar';
        btn.className = 'btn btn-primary';
        
        // Adicionar botão cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary ms-2';
        cancelBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancelar';
        cancelBtn.onclick = () => {
            form.reset();
            form.onsubmit = handleAddLancamento;
            btn.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar';
            btn.className = 'btn btn-success';
            cancelBtn.remove();
        };
        btn.after(cancelBtn);
        
        // Scroll para o formulário
        form.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showAlert('Erro ao carregar lançamento', 'danger');
    }
}

async function handleUpdateLancamento(id) {
    const data = document.getElementById('lanc-data').value;
    const descricao = document.getElementById('lanc-descricao').value;
    const categoria_id = parseInt(document.getElementById('lanc-categoria').value);
    const valor = parseFloat(document.getElementById('lanc-valor').value);
    const tipo = document.getElementById('lanc-tipo').value;
    const status = document.getElementById('lanc-status').value;
    
    try {
        const { error } = await supabase
            .from('lancamentos')
            .update({ data, descricao, categoria_id, valor, tipo, status })
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Lançamento atualizado com sucesso!', 'success');
        
        // Resetar formulário
        const form = document.querySelector('form');
        form.reset();
        form.onsubmit = handleAddLancamento;
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar';
        btn.className = 'btn btn-success';
        document.querySelector('button.btn-secondary')?.remove();
        
        await loadLancamentos();
    } catch (err) {
        showAlert('Erro ao atualizar lançamento: ' + err.message, 'danger');
    }
}

async function deleteLancamento(id) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    
    try {
        const { error } = await supabase
            .from('lancamentos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Lançamento excluído com sucesso!', 'success');
        await loadLancamentos();
        if (currentPage === 'home') await loadDashboard();
    } catch (err) {
        showAlert('Erro ao excluir lançamento', 'danger');
    }
}

// ============================================
// CATEGORIAS
// ============================================

function getCategoriasHTML() {
    return `
        ${getNavbar('categorias')}
        <div class="container mt-4">
            <h2><i class="bi bi-tags"></i> Categorias</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">Nova Categoria</h5>
                    <form onsubmit="handleAddCategoria(event)" class="row g-3">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="cat-nome" placeholder="Nome da categoria" required>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="cat-tipo" required>
                                <option value="despesa">Despesa</option>
                                <option value="receita">Receita</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button type="submit" class="btn btn-success w-100">
                                <i class="bi bi-plus-circle"></i> Adicionar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div id="categorias-list"></div>
        </div>
    `;
}

async function loadCategoriasPage() {
    await loadCategorias();
    displayCategorias();
}

function displayCategorias() {
    const listEl = document.getElementById('categorias-list');
    
    if (categorias.length === 0) {
        listEl.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Nenhuma categoria cadastrada.
            </div>
        `;
        return;
    }
    
    const despesas = categorias.filter(c => c.tipo === 'despesa');
    const receitas = categorias.filter(c => c.tipo === 'receita');
    
    let html = '<div class="row">';
    
    // Coluna de Despesas
    html += '<div class="col-md-6">';
    if (despesas.length > 0) {
        html += `
            <h5><i class="bi bi-arrow-down-circle text-danger"></i> Despesas</h5>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th style="width: 80px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        despesas.forEach(cat => {
            html += `
                <tr>
                    <td>${cat.nome}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" onclick="editarCategoria(${cat.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteCategoria(${cat.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
    } else {
        html += '<p class="text-muted">Nenhuma categoria de despesa</p>';
    }
    html += '</div>';
    
    // Coluna de Receitas
    html += '<div class="col-md-6">';
    if (receitas.length > 0) {
        html += `
            <h5><i class="bi bi-arrow-up-circle text-success"></i> Receitas</h5>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th style="width: 80px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        receitas.forEach(cat => {
            html += `
                <tr>
                    <td>${cat.nome}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" onclick="editarCategoria(${cat.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteCategoria(${cat.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
    } else {
        html += '<p class="text-muted">Nenhuma categoria de receita</p>';
    }
    html += '</div>';
    
    html += '</div>';
    listEl.innerHTML = html;
}

async function handleAddCategoria(event) {
    event.preventDefault();
    
    const nome = document.getElementById('cat-nome').value;
    const tipo = document.getElementById('cat-tipo').value;
    
    try {
        const { error } = await supabase
            .from('categorias')
            .insert([{ usuario_id: currentUser.id, nome, tipo }]);
        
        if (error) throw error;
        
        showAlert('Categoria adicionada com sucesso!', 'success');
        event.target.reset();
        await loadCategoriasPage();
    } catch (err) {
        showAlert('Erro ao adicionar categoria: ' + err.message, 'danger');
    }
}

async function editarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;
    
    const novoNome = prompt('Novo nome da categoria:', categoria.nome);
    if (!novoNome || novoNome === categoria.nome) return;
    
    try {
        const { error } = await supabase
            .from('categorias')
            .update({ nome: novoNome })
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Categoria atualizada!', 'success');
        await loadCategoriasPage();
    } catch (err) {
        showAlert('Erro ao atualizar categoria', 'danger');
    }
}

async function deleteCategoria(id) {
    if (!confirm('Tem certeza? Lançamentos desta categoria ficarão sem categoria.')) return;
    
    try {
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Categoria excluída!', 'success');
        await loadCategoriasPage();
    } catch (err) {
        showAlert('Erro ao excluir categoria', 'danger');
    }
}

async function criarCategoriasIniciais(usuarioId) {
    const categoriasIniciais = [
        { usuario_id: usuarioId, nome: 'Alimentação', tipo: 'despesa' },
        { usuario_id: usuarioId, nome: 'Transporte', tipo: 'despesa' },
        { usuario_id: usuarioId, nome: 'Moradia', tipo: 'despesa' },
        { usuario_id: usuarioId, nome: 'Saúde', tipo: 'despesa' },
        { usuario_id: usuarioId, nome: 'Lazer', tipo: 'despesa' },
        { usuario_id: usuarioId, nome: 'Salário', tipo: 'receita' },
        { usuario_id: usuarioId, nome: 'Investimentos', tipo: 'receita' },
        { usuario_id: usuarioId, nome: 'Outros', tipo: 'despesa' }
    ];
    
    await supabase.from('categorias').insert(categoriasIniciais);
}

// ============================================
// CONTAS FIXAS
// ============================================

function getContasFixasHTML() {
    return `
        ${getNavbar('contas_fixas')}
        <div class="container mt-4">
            <h2><i class="bi bi-arrow-repeat"></i> Contas Fixas</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="card-title mb-0">Nova Conta Fixa</h5>
                        <button class="btn btn-primary" onclick="gerarContasFixasMes()">
                            <i class="bi bi-calendar-plus"></i> Gerar p/ Mês Atual
                        </button>
                    </div>
                    <form onsubmit="handleAddContaFixa(event)">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Descrição</label>
                                <input type="text" class="form-control" id="conta-fixa-descricao" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label">Categoria</label>
                                <select class="form-select" id="conta-fixa-categoria" required>
                                    <option value="">Carregando...</option>
                                </select>
                            </div>
                            <div class="col-md-2 mb-3">
                                <label class="form-label">Valor</label>
                                <input type="number" step="0.01" class="form-control" id="conta-fixa-valor" required>
                            </div>
                            <div class="col-md-1 mb-3">
                                <label class="form-label">Dia</label>
                                <input type="number" min="1" max="31" class="form-control" id="conta-fixa-dia" required>
                            </div>
                            <div class="col-md-2 mb-3">
                                <label class="form-label">Tipo</label>
                                <select class="form-select" id="conta-fixa-tipo" required>
                                    <option value="despesa">Despesa</option>
                                    <option value="receita">Receita</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">
                            <i class="bi bi-plus-circle"></i> Adicionar Conta Fixa
                        </button>
                    </form>
                </div>
            </div>
            
            <div id="contas-fixas-list"></div>
        </div>
    `;
}

async function loadContasFixas() {
    try {
        console.log('Carregando contas fixas para usuário:', currentUser);
        const { data, error } = await supabase
            .from('contas_fixas')
            .select('*, categorias(nome)')
            .eq('usuario_id', currentUser.id)
            .order('dia_vencimento');
        
        if (error) {
            console.error('Erro na query Supabase (contas fixas):', error);
            throw error;
        }
        
        console.log('Contas fixas carregadas:', data?.length || 0);
        contasFixas = data || [];
        
        // Verificar se elemento existe antes de chamar display
        if (document.getElementById('contas-fixas-list')) {
            displayContasFixas();
        } else {
            console.error('Elemento contas-fixas-list não encontrado no DOM!');
        }
    } catch (err) {
        console.error('Erro ao carregar contas fixas:', err);
        const listEl = document.getElementById('contas-fixas-list');
        if (listEl) {
            listEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> Erro ao carregar contas fixas: ${err.message}
                    <br><small>Verifique o console para mais detalhes</small>
                </div>
            `;
        } else {
            console.error('Não foi possível mostrar erro: elemento não existe');
        }
        showAlert('Erro ao carregar contas fixas: ' + err.message, 'danger');
    }
}

function displayContasFixas() {
    const listEl = document.getElementById('contas-fixas-list');
    
    if (!listEl) {
        console.error('Elemento contas-fixas-list não encontrado!');
        return;
    }
    
    if (contasFixas.length === 0) {
        listEl.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Nenhuma conta fixa cadastrada.
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Dia</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    contasFixas.forEach(conta => {
        const valor = parseFloat(conta.valor).toFixed(2);
        const classeValor = conta.tipo === 'receita' ? 'text-success' : 'text-danger';
        
        html += `
            <tr class="${!conta.ativa ? 'table-secondary' : ''}">
                <td>${conta.descricao}</td>
                <td><span class="badge bg-secondary">${conta.categorias ? conta.categorias.nome : '-'}</span></td>
                <td class="${classeValor}"><strong>R$ ${valor}</strong></td>
                <td>${conta.dia_vencimento}</td>
                <td><span class="badge ${conta.tipo === 'receita' ? 'bg-success' : 'bg-danger'}">${conta.tipo}</span></td>
                <td>
                    <button class="btn btn-sm ${conta.ativa ? 'btn-success' : 'btn-secondary'}" 
                            onclick="toggleContaFixaStatus(${conta.id}, ${conta.ativa})">
                        ${conta.ativa ? '<i class="bi bi-check-circle"></i> Ativa' : '<i class="bi bi-x-circle"></i> Inativa'}
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteContaFixa(${conta.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    listEl.innerHTML = html;
}

async function handleAddContaFixa(event) {
    event.preventDefault();
    
    const descricao = document.getElementById('conta-fixa-descricao').value;
    const categoria_id = parseInt(document.getElementById('conta-fixa-categoria').value);
    const valor = parseFloat(document.getElementById('conta-fixa-valor').value);
    const dia_vencimento = parseInt(document.getElementById('conta-fixa-dia').value);
    const tipo = document.getElementById('conta-fixa-tipo').value;
    
    try {
        const { error } = await supabase
            .from('contas_fixas')
            .insert([{
                usuario_id: currentUser.id,
                descricao,
                categoria_id,
                valor,
                dia_vencimento,
                tipo,
                ativa: true
            }]);
        
        if (error) throw error;
        
        showAlert('Conta fixa adicionada com sucesso!', 'success');
        event.target.reset();
        await loadContasFixas();
    } catch (err) {
        showAlert('Erro ao adicionar conta fixa: ' + err.message, 'danger');
    }
}

async function toggleContaFixaStatus(id, ativaAtual) {
    try {
        const { error } = await supabase
            .from('contas_fixas')
            .update({ ativa: !ativaAtual })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadContasFixas();
    } catch (err) {
        showAlert('Erro ao alterar status', 'danger');
    }
}

async function deleteContaFixa(id) {
    if (!confirm('Tem certeza que deseja excluir esta conta fixa?')) return;
    
    try {
        const { error } = await supabase
            .from('contas_fixas')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Conta fixa excluída!', 'success');
        await loadContasFixas();
    } catch (err) {
        showAlert('Erro ao excluir conta fixa', 'danger');
    }
}

async function gerarContasFixasMes() {
    const mes = mesAtual;
    
    if (!confirm(`Gerar lançamentos das contas fixas ativas para ${getNomeMes()}?`)) return;
    
    try {
        const contasAtivas = contasFixas.filter(c => c.ativa);
        
        if (contasAtivas.length === 0) {
            showAlert('Nenhuma conta fixa ativa!', 'warning');
            return;
        }
        
        const lancamentos = [];
        
        for (const conta of contasAtivas) {
            const data = `${mes}-${String(conta.dia_vencimento).padStart(2, '0')}`;
            
            // Verificar se já existe
            const { data: existe } = await supabase
                .from('lancamentos')
                .select('id')
                .eq('usuario_id', currentUser.id)
                .eq('conta_fixa_id', conta.id)
                .eq('data', data)
                .single();
            
            if (!existe) {
                lancamentos.push({
                    usuario_id: currentUser.id,
                    data,
                    descricao: conta.descricao,
                    categoria_id: conta.categoria_id,
                    valor: conta.valor,
                    tipo: conta.tipo,
                    status: 'pendente',
                    conta_fixa_id: conta.id,
                    parcela_atual: null,
                    parcela_total: null,
                    contrato_parcelado: null
                });
            }
        }
        
        if (lancamentos.length === 0) {
            showAlert('Todas as contas fixas já foram geradas para este mês!', 'info');
            return;
        }
        
        const { error } = await supabase
            .from('lancamentos')
            .insert(lancamentos);
        
        if (error) throw error;
        
        showAlert(`${lancamentos.length} lançamentos criados com sucesso!`, 'success');
    } catch (err) {
        showAlert('Erro ao gerar contas fixas: ' + err.message, 'danger');
    }
}

// ============================================
// CONTAS PARCELADAS
// ============================================

function getContasParceladasHTML() {
    return `
        ${getNavbar('contas_parceladas')}
        <div class="container mt-4">
            <h2><i class="bi bi-credit-card"></i> Contas Parceladas</h2>
            
            <div id="contratos-parcelados"></div>
        </div>
    `;
}

async function loadContasParceladas() {
    try {
        console.log('Carregando contas parceladas para usuário:', currentUser);
        
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*')
            .eq('usuario_id', currentUser.id)
            .not('parcela_atual', 'is', null)
            .order('data');
        
        if (error) {
            console.error('Erro na query Supabase (parceladas):', error);
            throw error;
        }
        
        console.log('Lançamentos parcelados encontrados:', data?.length || 0);
        
        // Agrupar por descrição base (sem a parte da parcela)
        const contratos = {};
        data.forEach(lanc => {
            // Extrair descrição base removendo " (X/Y)"
            const descricaoBase = lanc.descricao.replace(/\s*\(\d+\/\d+\)$/, '');
            const contratoKey = `${descricaoBase}_${lanc.categoria_id}_${lanc.tipo}`;
            
            if (!contratos[contratoKey]) {
                contratos[contratoKey] = [];
            }
            contratos[contratoKey].push(lanc);
        });
        
        // Filtrar apenas grupos com mais de 1 parcela
        const contratosFiltrados = {};
        Object.keys(contratos).forEach(key => {
            if (contratos[key].length > 1 || contratos[key][0].parcela_atual > 0) {
                contratosFiltrados[key] = contratos[key];
            }
        });
        
        console.log('Contratos agrupados:', Object.keys(contratosFiltrados).length);
        displayContratosParcelados(contratosFiltrados);
    } catch (err) {
        console.error('Erro ao carregar contas parceladas:', err);
        const listEl = document.getElementById('contratos-parcelados');
        if (listEl) {
            listEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> Erro ao carregar contas parceladas: ${err.message}
                    <br><small>Verifique o console para mais detalhes</small>
                </div>
            `;
        }
        showAlert('Erro ao carregar contas parceladas: ' + err.message, 'danger');
    }
}

function displayContratosParcelados(contratos) {
    const listEl = document.getElementById('contratos-parcelados');
    
    if (!listEl) {
        console.error('Elemento contratos-parcelados não encontrado!');
        return;
    }
    
    if (Object.keys(contratos).length === 0) {
        console.log('Nenhum contrato parcelado para exibir');
        listEl.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Nenhuma conta parcelada encontrada.
            </div>
        `;
        return;
    }
    
    console.log('Montando HTML para', Object.keys(contratos).length, 'contratos');
    let html = '';
    
    for (const [contratoId, parcelas] of Object.entries(contratos)) {
        const primeira = parcelas[0];
        const valorTotal = parcelas.reduce((sum, p) => sum + parseFloat(p.valor), 0);
        const pagas = parcelas.filter(p => p.status === 'pago').length;
        const pendentes = parcelas.length - pagas;
        const valorPago = parcelas.filter(p => p.status === 'pago').reduce((sum, p) => sum + parseFloat(p.valor), 0);
        const valorPendente = parcelas.filter(p => p.status === 'pendente').reduce((sum, p) => sum + parseFloat(p.valor), 0);
        
        html += `
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${primeira.descricao.split(' (')[0]}</h5>
                        <span class="badge bg-light text-dark">${pagas}/${parcelas.length} pagas</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <strong>Valor Total:</strong><br>
                            <span class="text-${primeira.tipo === 'receita' ? 'success' : 'danger'}">R$ ${valorTotal.toFixed(2)}</span>
                        </div>
                        <div class="col-md-3">
                            <strong>Valor Pago:</strong><br>
                            <span class="text-success">R$ ${valorPago.toFixed(2)}</span>
                        </div>
                        <div class="col-md-3">
                            <strong>Valor Pendente:</strong><br>
                            <span class="text-warning">R$ ${valorPendente.toFixed(2)}</span>
                        </div>
                        <div class="col-md-3">
                            <div class="btn-group w-100">
                                <button class="btn btn-success btn-sm" onclick='quitarIntegral(${JSON.stringify(parcelas.filter(p => p.status === "pendente").map(p => p.id))}, ${valorPendente})'>
                                    <i class="bi bi-check-all"></i> Quitar Integral
                                </button>
                                <button class="btn btn-warning btn-sm" onclick='quitarParcial(${JSON.stringify(parcelas.filter(p => p.status === "pendente").map(p => p.id))})'>
                                    <i class="bi bi-check-circle"></i> Quitar Parcial
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Parcela</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        parcelas.forEach(parcela => {
            html += `
                <tr class="${parcela.status === 'pago' ? 'table-success' : ''}">
                    <td>Parcela ${parcela.parcela_atual}</td>
                    <td>${formatDate(parcela.data)}</td>
                    <td>R$ ${parseFloat(parcela.valor).toFixed(2)}</td>
                    <td>
                        <span class="badge ${parcela.status === 'pago' ? 'bg-success' : 'bg-warning'}">
                            ${parcela.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm ${parcela.status === 'pago' ? 'btn-warning' : 'btn-success'}" 
                                onclick="toggleStatus(${parcela.id}, '${parcela.status}')">
                            ${parcela.status === 'pago' ? 'Desfazer' : 'Pagar'}
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    listEl.innerHTML = html;
}

async function quitarIntegral(parcelasIds, valorPendente) {
    console.log('Quitação integral - IDs:', parcelasIds, 'Valor pendente:', valorPendente);
    
    if (!parcelasIds || parcelasIds.length === 0) {
        showAlert('Nenhuma parcela pendente!', 'info');
        return;
    }
    
    const desconto = parseFloat(prompt(`Valor pendente: R$ ${valorPendente.toFixed(2)}\n\nInforme o desconto (em R$):`, '0') || 0);
    
    if (desconto < 0 || desconto > valorPendente) {
        showAlert('Desconto inválido!', 'danger');
        return;
    }
    
    const valorFinal = valorPendente - desconto;
    const msg = desconto > 0 
        ? `Quitar por R$ ${valorFinal.toFixed(2)} (desconto de R$ ${desconto.toFixed(2)})?`
        : `Quitar todas as parcelas pendentes por R$ ${valorFinal.toFixed(2)}?`;
    
    if (!confirm(msg)) return;
    
    try {
        console.log('Executando quitação integral...');
        const { error } = await supabase
            .from('lancamentos')
            .update({ status: 'pago' })
            .in('id', parcelasIds);
        
        if (error) {
            console.error('Erro ao quitar:', error);
            throw error;
        }
        
        console.log('Quitação integral realizada com sucesso');
        showAlert('Quitação integral realizada com sucesso!', 'success');
        await loadContasParceladas();
    } catch (err) {
        console.error('Erro ao quitar:', err);
        showAlert('Erro ao quitar: ' + err.message, 'danger');
    }
}

async function quitarParcial(parcelasIds) {
    console.log('Quitação parcial - IDs disponíveis:', parcelasIds);
    
    if (!parcelasIds || parcelasIds.length === 0) {
        showAlert('Nenhuma parcela pendente!', 'info');
        return;
    }
    
    const quantas = parseInt(prompt(`Quantas parcelas deseja quitar? (máx: ${parcelasIds.length})`, '1'));
    
    if (!quantas || quantas < 1) {
        console.log('Quitação parcial cancelada');
        return;
    }
    
    try {
        console.log('Buscando', quantas, 'parcelas pendentes...');
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*')
            .in('id', parcelasIds)
            .order('parcela_atual')
            .limit(quantas);
        
        if (error) {
            console.error('Erro ao buscar parcelas:', error);
            throw error;
        }
        
        console.log('Parcelas encontradas:', data?.length || 0);
        
        if (data.length === 0) {
            showAlert('Nenhuma parcela pendente!', 'info');
            return;
        }
        
        const valorTotal = data.reduce((sum, p) => sum + parseFloat(p.valor), 0);
        
        if (!confirm(`Quitar ${data.length} parcelas por R$ ${valorTotal.toFixed(2)}?`)) return;
        
        const ids = data.map(p => p.id);
        
        const { error: updateError } = await supabase
            .from('lancamentos')
            .update({ status: 'pago' })
            .in('id', ids);
        
        if (updateError) {
            console.error('Erro ao atualizar parcelas:', updateError);
            throw updateError;
        }
        
        console.log(data.length, 'parcelas quitadas com sucesso');
        showAlert(`${data.length} parcelas quitadas com sucesso!`, 'success');
        await loadContasParceladas();
    } catch (err) {
        console.error('Erro ao quitar parcelas:', err);
        showAlert('Erro ao quitar parcelas: ' + err.message, 'danger');
    }
}

// ============================================
// RELATÓRIOS
// ============================================

function getRelatoriosHTML() {
    return `
        ${getNavbar('relatorios')}
        <div class="container mt-4">
            <h2><i class="bi bi-file-earmark-bar-graph"></i> Relatórios</h2>
            
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">Filtros</h5>
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Data Início</label>
                            <input type="date" class="form-control" id="rel-data-inicio">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Data Fim</label>
                            <input type="date" class="form-control" id="rel-data-fim">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" id="rel-tipo">
                                <option value="">Todos</option>
                                <option value="receita">Receitas</option>
                                <option value="despesa">Despesas</option>
                            </select>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-primary w-100" onclick="gerarRelatorio()">
                                <i class="bi bi-search"></i> Gerar Relatório
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="relatorio-resultado"></div>
        </div>
    `;
}

async function loadRelatorios() {
    // Definir período padrão: mês atual
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    document.getElementById('rel-data-inicio').valueAsDate = inicio;
    document.getElementById('rel-data-fim').valueAsDate = fim;
    
    await gerarRelatorio();
}

async function gerarRelatorio() {
    const dataInicio = document.getElementById('rel-data-inicio').value;
    const dataFim = document.getElementById('rel-data-fim').value;
    const tipo = document.getElementById('rel-tipo').value;
    
    if (!dataInicio || !dataFim) {
        showAlert('Selecione o período!', 'warning');
        return;
    }
    
    try {
        let query = supabase
            .from('lancamentos')
            .select('*, categorias(nome)')
            .eq('usuario_id', currentUser.id)
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .eq('status', 'pago');
        
        if (tipo) query = query.eq('tipo', tipo);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        displayRelatorio(data, dataInicio, dataFim);
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        showAlert('Erro ao gerar relatório', 'danger');
    }
}

function displayRelatorio(lancamentos, dataInicio, dataFim) {
    const resultEl = document.getElementById('relatorio-resultado');
    
    if (lancamentos.length === 0) {
        resultEl.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Nenhum lançamento pago no período selecionado.
            </div>
        `;
        return;
    }
    
    const receitas = lancamentos.filter(l => l.tipo === 'receita');
    const despesas = lancamentos.filter(l => l.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((sum, l) => sum + parseFloat(l.valor), 0);
    const totalDespesas = despesas.reduce((sum, l) => sum + parseFloat(l.valor), 0);
    const saldo = totalReceitas - totalDespesas;
    
    // Agrupar por categoria
    const porCategoria = {};
    lancamentos.forEach(lanc => {
        const catNome = lanc.categorias ? lanc.categorias.nome : 'Sem categoria';
        if (!porCategoria[catNome]) {
            porCategoria[catNome] = { receitas: 0, despesas: 0, total: 0 };
        }
        const valor = parseFloat(lanc.valor);
        if (lanc.tipo === 'receita') {
            porCategoria[catNome].receitas += valor;
        } else {
            porCategoria[catNome].despesas += valor;
        }
        porCategoria[catNome].total += lanc.tipo === 'receita' ? valor : -valor;
    });
    
    let html = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Resumo do Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}</h5>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <div class="col-md-4">
                        <h6 class="text-success">Total Receitas</h6>
                        <h3 class="text-success">R$ ${totalReceitas.toFixed(2)}</h3>
                        <small class="text-muted">${receitas.length} lançamentos</small>
                    </div>
                    <div class="col-md-4">
                        <h6 class="text-danger">Total Despesas</h6>
                        <h3 class="text-danger">R$ ${totalDespesas.toFixed(2)}</h3>
                        <small class="text-muted">${despesas.length} lançamentos</small>
                    </div>
                    <div class="col-md-4">
                        <h6 class="${saldo >= 0 ? 'text-primary' : 'text-warning'}">Saldo</h6>
                        <h3 class="${saldo >= 0 ? 'text-primary' : 'text-warning'}">R$ ${saldo.toFixed(2)}</h3>
                        <small class="text-muted">${saldo >= 0 ? 'Positivo' : 'Negativo'}</small>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Por Categoria</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th class="text-success">Receitas</th>
                                <th class="text-danger">Despesas</th>
                                <th>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    Object.entries(porCategoria)
        .sort((a, b) => Math.abs(b[1].despesas) - Math.abs(a[1].despesas))
        .forEach(([categoria, valores]) => {
            html += `
                <tr>
                    <td><strong>${categoria}</strong></td>
                    <td class="text-success">R$ ${valores.receitas.toFixed(2)}</td>
                    <td class="text-danger">R$ ${valores.despesas.toFixed(2)}</td>
                    <td class="${valores.total >= 0 ? 'text-success' : 'text-danger'}">
                        <strong>R$ ${valores.total.toFixed(2)}</strong>
                    </td>
                </tr>
            `;
        });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Detalhamento</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    lancamentos.forEach(lanc => {
        const valor = parseFloat(lanc.valor).toFixed(2);
        const classeValor = lanc.tipo === 'receita' ? 'text-success' : 'text-danger';
        
        html += `
            <tr>
                <td>${formatDate(lanc.data)}</td>
                <td>${lanc.descricao}</td>
                <td><span class="badge bg-secondary">${lanc.categorias ? lanc.categorias.nome : '-'}</span></td>
                <td><span class="badge ${lanc.tipo === 'receita' ? 'bg-success' : 'bg-danger'}">${lanc.tipo}</span></td>
                <td class="${classeValor}"><strong>R$ ${valor}</strong></td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultEl.innerHTML = html;
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function formatDate(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function getNomeMes(mesAno = mesAtual) {
    const [year, month] = mesAno.split('-');
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[parseInt(month) - 1]} ${year}`;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Expor funções globalmente
window.showPage = showPage;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleAddLancamento = handleAddLancamento;
window.toggleStatus = toggleStatus;
window.editarLancamento = editarLancamento;
window.deleteLancamento = deleteLancamento;
window.loadLancamentos = loadLancamentos;
window.handleAddCategoria = handleAddCategoria;
window.editarCategoria = editarCategoria;
window.deleteCategoria = deleteCategoria;
window.handleAddContaFixa = handleAddContaFixa;
window.toggleContaFixaStatus = toggleContaFixaStatus;
window.deleteContaFixa = deleteContaFixa;
window.gerarContasFixasMes = gerarContasFixasMes;
window.quitarIntegral = quitarIntegral;
window.quitarParcial = quitarParcial;
window.gerarRelatorio = gerarRelatorio;
