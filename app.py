# Finanças em Dia - Versão Web
# Aplicação Flask para controle financeiro pessoal

from flask import Flask, render_template, request, redirect, url_for, session, flash, send_file
from functools import wraps
import database
import models
from datetime import datetime
import os
import uuid

app = Flask(__name__)
# Usar variável de ambiente em produção ou chave padrão em desenvolvimento
app.secret_key = os.environ.get('SECRET_KEY', 'financas_em_dia_2025_seguro_web_app')

# Testar conexão com Supabase
try:
    if not database.inicializar_banco():
        print("\n⚠️  AVISO: Não foi possível conectar ao Supabase.")
        print("Execute o SQL em 'criar_tabelas_supabase.sql' no painel do Supabase primeiro!\n")
except Exception as e:
    print(f"\n⚠️  ERRO ao conectar com Supabase: {e}")
    print("Verifique se o arquivo 'config.py' está correto e se as tabelas foram criadas.\n")

# Decorator para verificar login
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor, faça login para acessar esta página.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Função auxiliar para formatar lançamentos
def formatar_lancamentos(lancamentos):
    """Adiciona campos formatados aos lançamentos para exibição"""
    for lanc in lancamentos:
        # Formatar data
        if lanc.get('data'):
            try:
                data_obj = datetime.strptime(lanc['data'], '%Y-%m-%d')
                lanc['data_formatada'] = data_obj.strftime('%d/%m/%Y')
            except:
                lanc['data_formatada'] = lanc['data']
        
        # Formatar valor
        lanc['valor_formatado'] = f"R$ {lanc['valor']:.2f}"
        
        # Nome da categoria
        if 'categorias' in lanc and lanc['categorias']:
            lanc['categoria_nome'] = lanc['categorias']['nome']
        else:
            lanc['categoria_nome'] = '-'
        
        # Texto da parcela
        if lanc.get('eh_parcelado') and lanc.get('parcela_atual') and lanc.get('total_parcelas'):
            lanc['parcela_texto'] = f"{lanc['parcela_atual']}/{lanc['total_parcelas']}"
        else:
            lanc['parcela_texto'] = '-'
        
        # Classe CSS para estilo
        if lanc['tipo'] == 'despesa':
            lanc['classe_css'] = 'despesa-paga' if lanc['status'] == 'pago' else 'despesa-pendente'
        else:  # Receita
            lanc['classe_css'] = 'receita-paga' if lanc['status'] == 'pago' else 'receita-pendente'
    
    return lancamentos

# ==================== ROTAS DE AUTENTICAÇÃO ====================

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('username')  # Mantém 'username' no form por compatibilidade
        password = request.form.get('password')
        guardar = request.form.get('guardar_credenciais')
        
        user = models.autenticar(email, password)
        
        if user:
            session['user_id'] = user['id']
            session['username'] = user['nome']
            
            if guardar:
                models.set_config(user['id'], 'ultimo_usuario', email)
            
            flash(f'Bem-vindo(a), {user["nome"]}!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Email ou senha incorretos.', 'danger')
    
    # Buscar último usuário logado (se tiver user_id na sessão)
    ultimo_usuario = None
    if 'user_id' in session:
        ultimo_usuario = models.get_config(session['user_id'], 'ultimo_usuario')
    return render_template('login.html', ultimo_usuario=ultimo_usuario)

@app.route('/logout')
def logout():
    username = session.get('username', 'Usuário')
    session.clear()
    flash(f'Até logo, {username}!', 'info')
    return redirect(url_for('login'))

@app.route('/registrar', methods=['GET', 'POST'])
def registrar():
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not nome or not email or not password:
            flash('Preencha todos os campos.', 'danger')
        elif password != confirm_password:
            flash('As senhas não conferem.', 'danger')
        elif models.criar_usuario(nome, email, password):
            flash('Usuário criado com sucesso! Faça login.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Erro ao criar usuário. Email já cadastrado.', 'danger')
    
    return render_template('registrar.html')

# ==================== HOME ====================

@app.route('/home')
@login_required
def home():
    user_id = session['user_id']
    
    # Obter mês e ano (padrão: atual)
    mes = request.args.get('mes', datetime.now().month, type=int)
    ano = request.args.get('ano', datetime.now().year, type=int)
    
    # Obter totais do mês
    totais = models.obter_totais_mes(user_id, ano, mes)
    
    # Obter lançamentos do mês
    lancamentos = models.listar_lancamentos_mes(user_id, ano, mes)
    lancamentos = formatar_lancamentos(lancamentos)
    
    return render_template('home.html', 
                         mes=mes, 
                         ano=ano, 
                         totais=totais, 
                         lancamentos=lancamentos)

# ==================== LANÇAMENTOS ====================

@app.route('/lancamentos', methods=['GET', 'POST'])
@login_required
def lancamentos():
    user_id = session['user_id']
    
    if request.method == 'POST':
        # Processar novo lançamento
        data = request.form.get('data')
        valor = float(request.form.get('valor'))
        descricao = request.form.get('descricao')
        categoria_id = int(request.form.get('categoria_id'))
        parcelas = int(request.form.get('parcelas', 1))
        conta_fixa = request.form.get('conta_fixa') == 'on'
        dia_vencimento = request.form.get('dia_vencimento', type=int)
        observacao = request.form.get('observacao', '')
        
        # Buscar o tipo da categoria selecionada
        categoria = models.obter_categoria(categoria_id)
        if not categoria:
            flash('Categoria não encontrada!', 'danger')
            return redirect(url_for('lancamentos'))
        
        tipo = categoria['tipo']  # Pega o tipo da categoria (receita ou despesa)
        
        if conta_fixa and dia_vencimento:
            # Criar conta fixa
            models.criar_conta_fixa(user_id, tipo, categoria_id, descricao, valor, 
                                   dia_vencimento, observacao)
            flash('Conta fixa criada com sucesso!', 'success')
        else:
            # Criar lançamento(s)
            # inserir_lancamento(user_id, tipo, categoria_id, descricao, valor, data, status, observacoes, eh_parcelado, parcela_atual, total_parcelas, numero_contrato)
            models.inserir_lancamento(user_id, tipo, categoria_id, descricao, valor, 
                                     data, 'pendente', observacao, parcelas > 1, 
                                     1 if parcelas > 1 else None, parcelas if parcelas > 1 else None, 
                                     str(uuid.uuid4()) if parcelas > 1 else None)
            flash('Lançamento criado com sucesso!', 'success')
        
        return redirect(url_for('lancamentos'))
    
    # GET - Exibir página
    mes = request.args.get('mes', datetime.now().month, type=int)
    ano = request.args.get('ano', datetime.now().year, type=int)
    
    # Filtros
    categoria_filtro = request.args.get('categoria_id', type=int)
    status_filtro = request.args.get('status')
    busca = request.args.get('busca', '')
    
    # Listar lançamentos
    lancamentos_list = models.listar_lancamentos_mes(user_id, ano, mes)
    
    # Aplicar filtros
    if categoria_filtro:
        lancamentos_list = [l for l in lancamentos_list if l['categoria_id'] == categoria_filtro]
    
    if status_filtro and status_filtro != 'Todos':
        lancamentos_list = [l for l in lancamentos_list if l['status'] == status_filtro]
    
    if busca:
        lancamentos_list = [l for l in lancamentos_list 
                           if busca.lower() in l['descricao'].lower()]
    
    # Formatar lançamentos para exibição
    lancamentos_list = formatar_lancamentos(lancamentos_list)
    
    # Listar categorias
    categorias = models.listar_categorias(user_id)
    
    return render_template('lancamentos.html', 
                         mes=mes, 
                         ano=ano,
                         lancamentos=lancamentos_list,
                         categorias=categorias,
                         categoria_filtro=categoria_filtro,
                         status_filtro=status_filtro,
                         busca=busca)

@app.route('/lancamentos/gerar-contas-fixas', methods=['POST'])
@login_required
def gerar_contas_fixas():
    user_id = session['user_id']
    mes = int(request.form.get('mes'))
    ano = int(request.form.get('ano'))
    
    qtd = models.gerar_lancamentos_contas_fixas_mes(user_id, ano, mes)
    flash(f'{qtd} lançamento(s) gerado(s) das contas fixas.', 'success')
    
    return redirect(url_for('lancamentos', mes=mes, ano=ano))

@app.route('/lancamentos/trazer-saldo-anterior', methods=['POST'])
@login_required
def trazer_saldo_anterior():
    user_id = session['user_id']
    mes = int(request.form.get('mes'))
    ano = int(request.form.get('ano'))
    
    sucesso = models.criar_lancamento_saldo_anterior(user_id, ano, mes)
    
    if sucesso:
        flash('Saldo do mês anterior trazido com sucesso!', 'success')
    else:
        flash('Não há saldo no mês anterior para trazer.', 'info')
    
    return redirect(url_for('lancamentos', mes=mes, ano=ano))

@app.route('/lancamentos/trazer-despesas-pendentes', methods=['POST'])
@login_required
def trazer_despesas_pendentes():
    user_id = session['user_id']
    mes = int(request.form.get('mes'))
    ano = int(request.form.get('ano'))
    
    qtd = models.trazer_despesas_pendentes_mes_anterior(user_id, ano, mes)
    
    if qtd > 0:
        flash(f'{qtd} lançamento(s) pendente(s) movido(s) do mês anterior! Os registros originais foram removidos.', 'success')
    else:
        flash('Não há lançamentos pendentes no mês anterior.', 'info')
    
    return redirect(url_for('lancamentos', mes=mes, ano=ano))

@app.route('/lancamentos/<int:lanc_id>/alternar-status', methods=['POST'])
@login_required
def alternar_status(lanc_id):
    models.alternar_status(lanc_id)
    flash('Status alterado com sucesso!', 'success')
    return redirect(request.referrer or url_for('lancamentos'))

@app.route('/lancamentos/<int:lanc_id>/excluir', methods=['POST'])
@login_required
def excluir_lancamento(lanc_id):
    models.excluir_lancamentos(lancamento_id=lanc_id)
    flash('Lançamento excluído com sucesso!', 'success')
    return redirect(request.referrer or url_for('lancamentos'))

@app.route('/lancamentos/<int:lanc_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_lancamento(lanc_id):
    user_id = session['user_id']
    
    if request.method == 'POST':
        data = request.form.get('data')
        valor = float(request.form.get('valor'))
        descricao = request.form.get('descricao')
        categoria_id = int(request.form.get('categoria_id'))
        status = request.form.get('status', 'pendente')
        observacao = request.form.get('observacao', '')
        
        # Buscar o tipo da categoria selecionada
        categoria = models.obter_categoria(categoria_id)
        if not categoria:
            flash('Categoria não encontrada!', 'danger')
            return redirect(url_for('lancamentos'))
        
        tipo = categoria['tipo']  # Pega o tipo da categoria (receita ou despesa)
        
        # atualizar_lancamento(lancamento_id, tipo, categoria_id, descricao, valor, data, status, observacoes)
        models.atualizar_lancamento(lanc_id, tipo, categoria_id, descricao, valor, 
                                   data, status, observacao)
        flash('Lançamento atualizado com sucesso!', 'success')
        return redirect(url_for('lancamentos'))
    
    # GET - exibir formulário
    lancamento = models.obter_lancamento_por_id(lanc_id)
    categorias = models.listar_categorias(user_id)
    
    return render_template('editar_lancamento.html', 
                         lancamento=lancamento, 
                         categorias=categorias)

# ==================== CATEGORIAS ====================

@app.route('/categorias', methods=['GET', 'POST'])
@login_required
def categorias():
    user_id = session['user_id']
    
    if request.method == 'POST':
        nome = request.form.get('nome')
        tipo = request.form.get('tipo')
        
        models.criar_categoria(user_id, nome, tipo)
        flash('Categoria criada com sucesso!', 'success')
        return redirect(url_for('categorias'))
    
    categorias_list = models.listar_categorias(user_id)
    return render_template('categorias.html', categorias=categorias_list)

@app.route('/categorias/<int:categoria_id>/editar', methods=['POST'])
@login_required
def editar_categoria(categoria_id):
    nome = request.form.get('nome')
    tipo = request.form.get('tipo')
    
    models.atualizar_categoria(categoria_id, nome, tipo)
    flash('Categoria atualizada com sucesso!', 'success')
    return redirect(url_for('categorias'))

@app.route('/categorias/<int:categoria_id>/excluir', methods=['POST'])
@login_required
def excluir_categoria_route(categoria_id):
    try:
        models.excluir_categoria(categoria_id)
        flash('Categoria excluída com sucesso!', 'success')
    except Exception as e:
        flash('Erro ao excluir categoria. Ela pode estar sendo usada por lançamentos.', 'danger')
    return redirect(url_for('categorias'))

# ==================== CONTAS FIXAS ====================

@app.route('/contas-fixas', methods=['GET'])
@login_required
def contas_fixas():
    user_id = session['user_id']
    contas = models.listar_contas_fixas(user_id)
    return render_template('contas_fixas.html', contas=contas)

@app.route('/contas-fixas/<int:conta_id>/excluir', methods=['POST'])
@login_required
def excluir_conta_fixa(conta_id):
    models.excluir_conta_fixa(conta_id)
    flash('Conta fixa excluída com sucesso!', 'success')
    return redirect(url_for('contas_fixas'))

@app.route('/contas-fixas/<int:conta_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_conta_fixa(conta_id):
    user_id = session['user_id']
    
    if request.method == 'POST':
        descricao = request.form.get('descricao')
        categoria_id = int(request.form.get('categoria_id'))
        tipo = request.form.get('tipo')
        valor = float(request.form.get('valor'))
        dia_vencimento = int(request.form.get('dia_vencimento'))
        ativa = request.form.get('ativa') == 'on'
        observacao = request.form.get('observacao', '')
        
        # atualizar_conta_fixa(conta_id, tipo, categoria_id, descricao, valor, dia_vencimento, ativa, observacoes)
        models.atualizar_conta_fixa(conta_id, tipo, categoria_id, descricao, 
                                   valor, dia_vencimento, ativa, observacao)
        flash('Conta fixa atualizada com sucesso!', 'success')
        return redirect(url_for('contas_fixas'))
    
    conta = models.obter_conta_fixa_por_id(conta_id)
    categorias = models.listar_categorias(user_id)
    
    return render_template('editar_conta_fixa.html', conta=conta, categorias=categorias)

# ==================== CONTAS PARCELADAS ====================

@app.route('/contas-parceladas')
@login_required
def contas_parceladas():
    user_id = session['user_id']
    contratos = models.listar_parcelados_pendentes(user_id)
    return render_template('contas_parceladas.html', contratos=contratos)

@app.route('/contas-parceladas/quitar/<contrato_id>', methods=['GET', 'POST'])
@login_required
def quitar_parcelado(contrato_id):
    user_id = session['user_id']
    
    if request.method == 'POST':
        tipo_quitacao = request.form.get('tipo_quitacao')
        
        if tipo_quitacao == 'integral':
            desconto = float(request.form.get('desconto', 0))
            if models.quitar_parcelado_integral(user_id, contrato_id, desconto):
                if desconto > 0:
                    flash(f'Contrato quitado integralmente com desconto de R$ {desconto:.2f}!', 'success')
                else:
                    flash('Contrato quitado integralmente!', 'success')
            else:
                flash('Erro ao quitar contrato.', 'danger')
            return redirect(url_for('contas_parceladas'))
        else:
            # Quitação parcial - mostrar parcelas
            numero_parcelas = int(request.form.get('numero_parcelas', 1))
            models.quitar_parcelado_parcial(contrato_id, numero_parcelas)
            flash(f'{numero_parcelas} parcela(s) quitada(s)!', 'success')
            return redirect(url_for('contas_parceladas'))
    
    # GET - exibir opções de quitação
    parcelas = models.listar_parcelas_contrato(contrato_id)
    return render_template('quitar_parcelado.html', 
                         contrato_id=contrato_id, 
                         parcelas=parcelas)

@app.route('/contas-parceladas/quitar-parcial', methods=['POST'])
@login_required
def quitar_parcial():
    user_id = session['user_id']
    contrato_id = request.form.get('contrato_id')
    desconto = float(request.form.get('desconto', 0))
    parcelas_ids = request.form.getlist('parcelas_ids')
    
    if parcelas_ids:
        parcelas_ids = [int(p) for p in parcelas_ids]
        if models.quitar_parcelas_selecionadas(user_id, contrato_id, parcelas_ids, desconto):
            if desconto > 0:
                flash(f'{len(parcelas_ids)} parcela(s) quitada(s) com desconto de R$ {desconto:.2f}!', 'success')
            else:
                flash(f'{len(parcelas_ids)} parcela(s) quitada(s)!', 'success')
        else:
            flash('Erro ao quitar parcelas.', 'danger')
    else:
        flash('Nenhuma parcela selecionada.', 'warning')
    
    return redirect(url_for('contas_parceladas'))

# ==================== RELATÓRIOS ====================

@app.route('/relatorios', methods=['GET', 'POST'])
@login_required
def relatorios():
    user_id = session['user_id']
    lancamentos_list = []
    data_inicial = None
    data_final = None
    
    if request.method == 'POST' or request.args.get('data_inicial'):
        if request.method == 'POST':
            data_inicial = request.form.get('data_inicial')
            data_final = request.form.get('data_final')
        else:
            data_inicial = request.args.get('data_inicial')
            data_final = request.args.get('data_final')
        
        lancamentos_list = models.listar_lancamentos_periodo(user_id, data_inicial, data_final)
        
        # Formatar lançamentos para exibição
        lancamentos_list = formatar_lancamentos(lancamentos_list)
    
    return render_template('relatorios.html', 
                         lancamentos=lancamentos_list,
                         data_inicial=data_inicial,
                         data_final=data_final)

@app.route('/relatorios/exportar-pdf', methods=['POST'])
@login_required
def exportar_pdf():
    user_id = session['user_id']
    data_inicial = request.form.get('data_inicial')
    data_final = request.form.get('data_final')
    
    # Gerar nome do arquivo temporário
    nome_arquivo = f'relatorio_{user_id}_{data_inicial}_{data_final}.pdf'
    pdf_path = os.path.join(os.path.dirname(__file__), nome_arquivo)
    
    if models.gerar_relatorio_pdf(user_id, data_inicial, data_final, pdf_path):
        return send_file(pdf_path, as_attachment=True, download_name='relatorio_financeiro.pdf')
    else:
        flash('Erro ao gerar relatório PDF.', 'danger')
        return redirect(url_for('relatorios'))

# ==================== EXECUTAR APLICAÇÃO ====================

if __name__ == '__main__':
    # Usar porta e host apropriados para produção (Render) e desenvolvimento
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True') == 'True'
    app.run(debug=debug, host='0.0.0.0', port=port)
