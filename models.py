# models.py - Funções de acesso e manipulação de dados (Supabase/PostgreSQL)

import database
import bcrypt
from datetime import datetime, timedelta
from calendar import monthrange
import uuid
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

# ==================== USUÁRIOS ====================

def criar_usuario(nome, email, senha):
    """Cria um novo usuário com senha criptografada"""
    try:
        supabase = database.conectar()
        
        # Verificar se o email já existe
        check = supabase.table('usuarios').select('id').eq('email', email).execute()
        if check.data:
            print(f"❌ Email '{email}' já está cadastrado!")
            return False
        
        # Criptografar senha
        senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Inserir usuário
        response = supabase.table('usuarios').insert({
            'nome': nome,
            'email': email,
            'senha': senha_hash
        }).execute()
        
        if response.data:
            user_id = response.data[0]['id']
            print(f"✓ Usuário '{nome}' criado com ID: {user_id}")
            # Criar categorias padrão
            criar_categorias_padrao(user_id)
            return True
        return False
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        import traceback
        traceback.print_exc()
        return False

def autenticar(email, senha):
    """Autentica um usuário e retorna seus dados"""
    try:
        supabase = database.conectar()
        
        response = supabase.table('usuarios').select('*').eq('email', email).execute()
        
        if response.data:
            user = response.data[0]
            # Verificar senha
            if bcrypt.checkpw(senha.encode('utf-8'), user['senha'].encode('utf-8')):
                return user
        
        return None
    except Exception as e:
        print(f"Erro ao autenticar: {e}")
        return None

def listar_usuarios():
    """Lista todos os usuários"""
    try:
        supabase = database.conectar()
        response = supabase.table('usuarios').select('id, nome, email, data_criacao').execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Erro ao listar usuários: {e}")
        return []

def redefinir_senha(user_id, nova_senha):
    """Redefine a senha de um usuário"""
    try:
        supabase = database.conectar()
        senha_hash = bcrypt.hashpw(nova_senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        supabase.table('usuarios').update({'senha': senha_hash}).eq('id', user_id).execute()
        return True
    except Exception as e:
        print(f"Erro ao redefinir senha: {e}")
        return False

# ==================== CONFIGURAÇÕES ====================

def get_config(user_id, chave):
    """Obtém um valor de configuração"""
    try:
        supabase = database.conectar()
        response = supabase.table('app_config').select('valor').eq('usuario_id', user_id).eq('chave', chave).execute()
        return response.data[0]['valor'] if response.data else None
    except:
        return None

def set_config(user_id, chave, valor):
    """Define um valor de configuração"""
    try:
        supabase = database.conectar()
        supabase.table('app_config').upsert({
            'usuario_id': user_id,
            'chave': chave,
            'valor': valor
        }).execute()
        return True
    except Exception as e:
        print(f"Erro ao salvar config: {e}")
        return False

# ==================== CATEGORIAS ====================

def criar_categorias_padrao(user_id):
    """Cria categorias padrão para um novo usuário"""
    categorias_padrao = [
        {'nome': 'Salário', 'tipo': 'receita'},
        {'nome': 'Freelance', 'tipo': 'receita'},
        {'nome': 'Investimentos', 'tipo': 'receita'},
        {'nome': 'Outros', 'tipo': 'receita'},
        {'nome': 'Alimentação', 'tipo': 'despesa'},
        {'nome': 'Transporte', 'tipo': 'despesa'},
        {'nome': 'Moradia', 'tipo': 'despesa'},
        {'nome': 'Saúde', 'tipo': 'despesa'},
        {'nome': 'Educação', 'tipo': 'despesa'},
        {'nome': 'Lazer', 'tipo': 'despesa'},
        {'nome': 'Vestuário', 'tipo': 'despesa'},
        {'nome': 'Outros', 'tipo': 'despesa'}
    ]
    
    try:
        supabase = database.conectar()
        categorias = [{'usuario_id': user_id, **cat} for cat in categorias_padrao]
        response = supabase.table('categorias').insert(categorias).execute()
        print(f"✓ {len(categorias_padrao)} categorias padrão criadas para usuário {user_id}")
        return True
    except Exception as e:
        print(f"❌ Erro ao criar categorias padrão: {e}")
        import traceback
        traceback.print_exc()
        return False

def criar_categoria(user_id, nome, tipo):
    """Cria uma nova categoria"""
    try:
        supabase = database.conectar()
        response = supabase.table('categorias').insert({
            'usuario_id': user_id,
            'nome': nome,
            'tipo': tipo
        }).execute()
        return response.data[0]['id'] if response.data else None
    except Exception as e:
        print(f"Erro ao criar categoria: {e}")
        return None

def listar_categorias(user_id, tipo=None):
    """Lista categorias de um usuário"""
    try:
        supabase = database.conectar()
        query = supabase.table('categorias').select('*').eq('usuario_id', user_id)
        
        if tipo:
            query = query.eq('tipo', tipo)
        
        response = query.order('nome').execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"Erro ao listar categorias: {e}")
        return []

def obter_categoria(categoria_id):
    """Obtém uma categoria pelo ID"""
    try:
        supabase = database.conectar()
        response = supabase.table('categorias').select('*').eq('id', categoria_id).execute()
        return response.data[0] if response.data else None
    except:
        return None

def atualizar_categoria(categoria_id, nome, tipo):
    """Atualiza uma categoria"""
    try:
        supabase = database.conectar()
        supabase.table('categorias').update({
            'nome': nome,
            'tipo': tipo
        }).eq('id', categoria_id).execute()
        return True
    except Exception as e:
        print(f"Erro ao atualizar categoria: {e}")
        return False

def excluir_categoria(categoria_id):
    """Exclui uma categoria (apenas se não houver lançamentos)"""
    try:
        supabase = database.conectar()
        supabase.table('categorias').delete().eq('id', categoria_id).execute()
        return True
    except Exception as e:
        print(f"Erro ao excluir categoria: {e}")
        return False

# ==================== LANÇAMENTOS ====================

def inserir_lancamento(user_id, tipo, categoria_id, descricao, valor, data, status='pendente', 
                      observacoes='', eh_parcelado=False, parcela_atual=None, total_parcelas=None, 
                      numero_contrato=None, conta_fixa_id=None):
    """Insere um novo lançamento (ou múltiplas parcelas se for parcelado)"""
    try:
        supabase = database.conectar()
        
        # Se for parcelado, criar todas as parcelas
        if eh_parcelado and total_parcelas and total_parcelas > 1:
            from datetime import datetime
            from dateutil.relativedelta import relativedelta
            
            data_obj = datetime.strptime(data, '%Y-%m-%d')
            ids_criados = []
            
            for i in range(1, total_parcelas + 1):
                # Calcular data da parcela (adicionar meses)
                data_parcela = data_obj + relativedelta(months=i-1)
                
                lancamento = {
                    'usuario_id': user_id,
                    'tipo': tipo,
                    'categoria_id': categoria_id,
                    'descricao': f"{descricao} ({i}/{total_parcelas})",
                    'valor': float(valor),
                    'data': data_parcela.strftime('%Y-%m-%d'),
                    'status': status,
                    'observacoes': observacoes or None,
                    'eh_parcelado': True,
                    'parcela_atual': i,
                    'total_parcelas': total_parcelas,
                    'numero_contrato': numero_contrato,
                    'conta_fixa_id': conta_fixa_id
                }
                
                response = supabase.table('lancamentos').insert(lancamento).execute()
                if response.data:
                    ids_criados.append(response.data[0]['id'])
            
            return ids_criados[0] if ids_criados else None
        else:
            # Lançamento único
            lancamento = {
                'usuario_id': user_id,
                'tipo': tipo,
                'categoria_id': categoria_id,
                'descricao': descricao,
                'valor': float(valor),
                'data': data,
                'status': status,
                'observacoes': observacoes or None,
                'eh_parcelado': eh_parcelado,
                'parcela_atual': parcela_atual,
                'total_parcelas': total_parcelas,
                'numero_contrato': numero_contrato,
                'conta_fixa_id': conta_fixa_id
            }
            
            response = supabase.table('lancamentos').insert(lancamento).execute()
            return response.data[0]['id'] if response.data else None
        
    except Exception as e:
        print(f"Erro ao inserir lançamento: {e}")
        import traceback
        traceback.print_exc()
        return None

def listar_lancamentos_mes(user_id, ano, mes):
    """Lista lançamentos de um usuário em um mês específico"""
    try:
        supabase = database.conectar()
        
        data_inicio = f"{ano}-{mes:02d}-01"
        ultimo_dia = monthrange(ano, mes)[1]
        data_fim = f"{ano}-{mes:02d}-{ultimo_dia}"
        
        response = supabase.table('lancamentos')\
            .select('*, categorias(nome)')\
            .eq('usuario_id', user_id)\
            .gte('data', data_inicio)\
            .lte('data', data_fim)\
            .order('data')\
            .execute()
        
        return response.data if response.data else []
        
    except Exception as e:
        print(f"Erro ao listar lançamentos: {e}")
        return []

def obter_lancamento(lancamento_id):
    """Obtém um lançamento pelo ID"""
    try:
        supabase = database.conectar()
        response = supabase.table('lancamentos').select('*').eq('id', lancamento_id).execute()
        return response.data[0] if response.data else None
    except:
        return None

def atualizar_lancamento(lancamento_id, tipo, categoria_id, descricao, valor, data, status, observacoes=''):
    """Atualiza um lançamento"""
    try:
        supabase = database.conectar()
        
        supabase.table('lancamentos').update({
            'tipo': tipo,
            'categoria_id': categoria_id,
            'descricao': descricao,
            'valor': float(valor),
            'data': data,
            'status': status,
            'observacoes': observacoes or None
        }).eq('id', lancamento_id).execute()
        
        return True
    except Exception as e:
        print(f"Erro ao atualizar lançamento: {e}")
        return False

def excluir_lancamentos(lancamento_id=None, numero_contrato=None):
    """Exclui lançamento(s)"""
    try:
        supabase = database.conectar()
        
        if lancamento_id:
            supabase.table('lancamentos').delete().eq('id', lancamento_id).execute()
        elif numero_contrato:
            supabase.table('lancamentos').delete().eq('numero_contrato', numero_contrato).execute()
        
        return True
    except Exception as e:
        print(f"Erro ao excluir lançamentos: {e}")
        return False

def alternar_status(lancamento_id):
    """Alterna o status de um lançamento entre pendente e pago"""
    try:
        lancamento = obter_lancamento(lancamento_id)
        if not lancamento:
            return False
        
        novo_status = 'pago' if lancamento['status'] == 'pendente' else 'pendente'
        
        supabase = database.conectar()
        supabase.table('lancamentos').update({'status': novo_status}).eq('id', lancamento_id).execute()
        
        return True
    except Exception as e:
        print(f"Erro ao alternar status: {e}")
        return False

def calcular_resumo_mes(user_id, ano, mes):
    """Calcula resumo financeiro do mês"""
    lancamentos = listar_lancamentos_mes(user_id, ano, mes)
    
    receitas_total = sum(l['valor'] for l in lancamentos if l['tipo'] == 'receita')
    receitas_pagas = sum(l['valor'] for l in lancamentos if l['tipo'] == 'receita' and l['status'] == 'pago')
    receitas_pendentes = len([l for l in lancamentos if l['tipo'] == 'receita' and l['status'] == 'pendente'])
    
    despesas_total = sum(l['valor'] for l in lancamentos if l['tipo'] == 'despesa')
    despesas_pagas = sum(l['valor'] for l in lancamentos if l['tipo'] == 'despesa' and l['status'] == 'pago')
    despesas_pendentes = len([l for l in lancamentos if l['tipo'] == 'despesa' and l['status'] == 'pendente'])
    
    saldo = receitas_total - despesas_total
    
    return {
        # Estrutura aninhada para dashboard
        'receitas': {
            'total': receitas_total,
            'pagas': len([l for l in lancamentos if l['tipo'] == 'receita' and l['status'] == 'pago']),
            'pendentes': receitas_pendentes
        },
        'despesas': {
            'total': despesas_total,
            'pagas': len([l for l in lancamentos if l['tipo'] == 'despesa' and l['status'] == 'pago']),
            'pendentes': despesas_pendentes
        },
        'saldo': saldo,
        # Aliases para compatibilidade com templates antigos
        'receitas_total': receitas_total,
        'receitas_pagas': receitas_pagas,
        'total_receitas': receitas_total,
        'despesas_total': despesas_total,
        'despesas_pagas': despesas_pagas,
        'total_despesas': despesas_total,
        'saldo_previsto': saldo,
        'saldo_realizado': receitas_pagas - despesas_pagas
    }

# Alias para compatibilidade com app.py
obter_totais_mes = calcular_resumo_mes

# ==================== CONTAS FIXAS ====================

def criar_conta_fixa(user_id, tipo, categoria_id, descricao, valor, dia_vencimento, observacoes=''):
    """Cria uma conta fixa recorrente"""
    try:
        supabase = database.conectar()
        
        response = supabase.table('contas_fixas').insert({
            'usuario_id': user_id,
            'tipo': tipo,
            'categoria_id': categoria_id,
            'descricao': descricao,
            'valor': float(valor),
            'dia_vencimento': dia_vencimento,
            'ativa': True,
            'observacoes': observacoes or None
        }).execute()
        
        return response.data[0]['id'] if response.data else None
        
    except Exception as e:
        print(f"Erro ao criar conta fixa: {e}")
        return None

def listar_contas_fixas(user_id, apenas_ativas=True):
    """Lista contas fixas de um usuário"""
    try:
        supabase = database.conectar()
        
        query = supabase.table('contas_fixas')\
            .select('*, categorias(nome)')\
            .eq('usuario_id', user_id)
        
        if apenas_ativas:
            query = query.eq('ativa', True)
        
        response = query.order('dia_vencimento').execute()
        return response.data if response.data else []
        
    except Exception as e:
        print(f"Erro ao listar contas fixas: {e}")
        return []

def obter_conta_fixa(conta_id):
    """Obtém uma conta fixa pelo ID"""
    try:
        supabase = database.conectar()
        response = supabase.table('contas_fixas').select('*').eq('id', conta_id).execute()
        return response.data[0] if response.data else None
    except:
        return None

def atualizar_conta_fixa(conta_id, tipo, categoria_id, descricao, valor, dia_vencimento, ativa, observacoes=''):
    """Atualiza uma conta fixa"""
    try:
        supabase = database.conectar()
        
        supabase.table('contas_fixas').update({
            'tipo': tipo,
            'categoria_id': categoria_id,
            'descricao': descricao,
            'valor': float(valor),
            'dia_vencimento': dia_vencimento,
            'ativa': ativa,
            'observacoes': observacoes or None
        }).eq('id', conta_id).execute()
        
        return True
    except Exception as e:
        print(f"Erro ao atualizar conta fixa: {e}")
        return False

def excluir_conta_fixa(conta_id):
    """Exclui uma conta fixa"""
    try:
        supabase = database.conectar()
        supabase.table('contas_fixas').delete().eq('id', conta_id).execute()
        return True
    except Exception as e:
        print(f"Erro ao excluir conta fixa: {e}")
        return False

def gerar_lancamentos_contas_fixas_mes(user_id, ano, mes):
    """Gera lançamentos automáticos das contas fixas para um mês"""
    try:
        contas = listar_contas_fixas(user_id, apenas_ativas=True)
        lancamentos_criados = 0
        
        for conta in contas:
            # Verificar se já existe lançamento desta conta neste mês
            data_venc = f"{ano}-{mes:02d}-{conta['dia_vencimento']:02d}"
            
            supabase = database.conectar()
            existe = supabase.table('lancamentos')\
                .select('id')\
                .eq('usuario_id', user_id)\
                .eq('conta_fixa_id', conta['id'])\
                .eq('data', data_venc)\
                .execute()
            
            if not existe.data:
                # Criar lançamento
                inserir_lancamento(
                    user_id=user_id,
                    tipo=conta['tipo'],
                    categoria_id=conta['categoria_id'],
                    descricao=conta['descricao'],
                    valor=conta['valor'],
                    data=data_venc,
                    status='pendente',
                    observacoes=conta.get('observacoes', ''),
                    conta_fixa_id=conta['id']
                )
                lancamentos_criados += 1
        
        return lancamentos_criados
        
    except Exception as e:
        print(f"Erro ao gerar lançamentos de contas fixas: {e}")
        return 0

# ==================== PARCELADOS ====================

def listar_parcelados_pendentes(user_id):
    """Lista contratos parcelados com parcelas pendentes"""
    try:
        supabase = database.conectar()
        
        # Buscar lançamentos parcelados com join de categorias
        response = supabase.table('lancamentos')\
            .select('numero_contrato, descricao, total_parcelas, valor, tipo, categoria_id, data, status')\
            .eq('usuario_id', user_id)\
            .eq('eh_parcelado', True)\
            .not_.is_('numero_contrato', 'null')\
            .execute()
        
        if not response.data:
            return []
        
        # Agrupar por contrato
        contratos = {}
        for lanc in response.data:
            contrato = lanc['numero_contrato']
            if contrato not in contratos:
                # Buscar nome da categoria
                cat_response = supabase.table('categorias').select('nome').eq('id', lanc['categoria_id']).execute()
                categoria_nome = cat_response.data[0]['nome'] if cat_response.data else '-'
                
                contratos[contrato] = {
                    'numero_contrato': contrato,
                    'descricao': lanc['descricao'],
                    'tipo': lanc['tipo'],
                    'categoria_nome': categoria_nome,
                    'total_parcelas': lanc['total_parcelas'],
                    'valor_parcela': lanc['valor'],
                    'parcelas_pagas': 0,
                    'parcelas_pendentes': 0,
                    'proxima_data': None
                }
            
            # Contar status e pegar próxima data
            if lanc['status'] == 'pago':
                contratos[contrato]['parcelas_pagas'] += 1
            else:
                contratos[contrato]['parcelas_pendentes'] += 1
                # Pegar a primeira data pendente (se ainda não tiver)
                if not contratos[contrato]['proxima_data']:
                    contratos[contrato]['proxima_data'] = lanc['data']
        
        # Filtrar apenas com pendentes
        resultado = [c for c in contratos.values() if c['parcelas_pendentes'] > 0]
        
        # Formatar datas
        from datetime import datetime
        for c in resultado:
            if c['proxima_data']:
                try:
                    data_obj = datetime.strptime(c['proxima_data'], '%Y-%m-%d')
                    c['proxima_data_formatada'] = data_obj.strftime('%d/%m/%Y')
                except:
                    c['proxima_data_formatada'] = c['proxima_data']
            else:
                c['proxima_data_formatada'] = '-'
        
        return resultado
        
    except Exception as e:
        print(f"Erro ao listar parcelados: {e}")
        import traceback
        traceback.print_exc()
        return []

def quitar_parcelado_integral(user_id, numero_contrato, desconto=0):
    """Quita todas as parcelas pendentes de um contrato, criando um único lançamento"""
    try:
        supabase = database.conectar()
        
        # Buscar todas as parcelas pendentes
        response = supabase.table('lancamentos')\
            .select('*')\
            .eq('numero_contrato', numero_contrato)\
            .eq('status', 'pendente')\
            .order('parcela_atual')\
            .execute()
        
        if not response.data:
            return False
        
        parcelas = response.data
        
        # Calcular valor total
        valor_total = sum(p['valor'] for p in parcelas)
        valor_com_desconto = valor_total - desconto
        
        # Pegar dados da primeira parcela como referência
        primeira = parcelas[0]
        total_parcelas = len(parcelas)
        
        # Criar lançamento único de quitação
        from datetime import datetime
        data_hoje = datetime.now().strftime('%Y-%m-%d')
        
        descricao_base = primeira['descricao']
        # Remover o sufixo (X/Y) se existir
        if '(' in descricao_base and ')' in descricao_base:
            descricao_base = descricao_base[:descricao_base.rfind('(')].strip()
        
        lancamento_quitacao = {
            'usuario_id': user_id,
            'tipo': primeira['tipo'],
            'categoria_id': primeira['categoria_id'],
            'descricao': f"Quitação {descricao_base}",
            'valor': valor_com_desconto,
            'data': data_hoje,
            'status': 'pago',
            'observacoes': f"Quitação integral de {total_parcelas} parcelas. " +
                          (f"Desconto: R$ {desconto:.2f}. " if desconto > 0 else "") +
                          f"Valor original: R$ {valor_total:.2f}",
            'eh_parcelado': False,
            'parcela_atual': None,
            'total_parcelas': None,
            'numero_contrato': None,
            'conta_fixa_id': primeira.get('conta_fixa_id')
        }
        
        supabase.table('lancamentos').insert(lancamento_quitacao).execute()
        
        # Excluir todas as parcelas pendentes
        ids_para_excluir = [p['id'] for p in parcelas]
        supabase.table('lancamentos').delete().in_('id', ids_para_excluir).execute()
        
        return True
        
    except Exception as e:
        print(f"Erro ao quitar parcelado integral: {e}")
        import traceback
        traceback.print_exc()
        return False

def quitar_parcelado_parcial(numero_contrato, numero_parcelas):
    """Quita um número específico de parcelas pendentes"""
    try:
        supabase = database.conectar()
        
        # Buscar parcelas pendentes ordenadas
        response = supabase.table('lancamentos')\
            .select('id')\
            .eq('numero_contrato', numero_contrato)\
            .eq('status', 'pendente')\
            .order('parcela_atual')\
            .limit(numero_parcelas)\
            .execute()
        
        # Atualizar cada parcela
        for lanc in response.data:
            supabase.table('lancamentos')\
                .update({'status': 'pago'})\
                .eq('id', lanc['id'])\
                .execute()
        
        return True
    except Exception as e:
        print(f"Erro ao quitar parcelado parcial: {e}")
        return False

def quitar_parcelas_selecionadas(user_id, contrato_id, parcelas_ids, desconto=0):
    """Quita parcelas específicas selecionadas, opcionalmente com desconto"""
    try:
        supabase = database.conectar()
        
        if not parcelas_ids:
            return False
        
        # Se houver desconto, criar um lançamento único com o valor total - desconto
        if desconto > 0:
            # Buscar informações das parcelas selecionadas
            response = supabase.table('lancamentos')\
                .select('*')\
                .in_('id', parcelas_ids)\
                .execute()
            
            if response.data:
                # Calcular valor total
                valor_total = sum(p['valor'] for p in response.data)
                valor_com_desconto = valor_total - desconto
                
                # Pegar dados da primeira parcela como referência
                primeira = response.data[0]
                
                # Criar lançamento de quitação
                from datetime import datetime
                data_hoje = datetime.now().strftime('%Y-%m-%d')
                
                lancamento_quitacao = {
                    'usuario_id': user_id,
                    'tipo': primeira['tipo'],
                    'categoria_id': primeira['categoria_id'],
                    'descricao': f"Quitação {primeira['descricao']} - {len(parcelas_ids)} parcelas",
                    'valor': valor_com_desconto,
                    'data': data_hoje,
                    'status': 'pago',
                    'observacoes': f"Quitação com desconto de R$ {desconto:.2f}. Valor original: R$ {valor_total:.2f}",
                    'eh_parcelado': False,
                    'parcela_atual': None,
                    'total_parcelas': None,
                    'numero_contrato': None,
                    'conta_fixa_id': None
                }
                
                supabase.table('lancamentos').insert(lancamento_quitacao).execute()
                
                # Excluir as parcelas quitadas
                supabase.table('lancamentos').delete().in_('id', parcelas_ids).execute()
        else:
            # Sem desconto, apenas marcar como pago
            for parcela_id in parcelas_ids:
                supabase.table('lancamentos')\
                    .update({'status': 'pago'})\
                    .eq('id', parcela_id)\
                    .execute()
        
        return True
        
    except Exception as e:
        print(f"Erro ao quitar parcelas selecionadas: {e}")
        import traceback
        traceback.print_exc()
        return False

# ==================== RELATÓRIOS ====================

def gerar_relatorio_pdf(user_id, data_inicio, data_fim, nome_arquivo):
    """Gera relatório em PDF"""
    try:
        supabase = database.conectar()
        
        # Buscar lançamentos do período
        response = supabase.table('lancamentos')\
            .select('*, categorias(nome)')\
            .eq('usuario_id', user_id)\
            .gte('data', data_inicio)\
            .lte('data', data_fim)\
            .order('data')\
            .execute()
        
        lancamentos = response.data if response.data else []
        
        # Criar PDF
        doc = SimpleDocTemplate(nome_arquivo, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()
        
        # Título
        titulo = Paragraph(f"<b>Relatório Financeiro</b><br/>Período: {data_inicio} a {data_fim}", styles['Title'])
        story.append(titulo)
        story.append(Spacer(1, 0.5*cm))
        
        # Calcular totais
        receitas = sum(l['valor'] for l in lancamentos if l['tipo'] == 'receita')
        despesas = sum(l['valor'] for l in lancamentos if l['tipo'] == 'despesa')
        saldo = receitas - despesas
        
        # Resumo
        resumo_data = [
            ['Receitas', f'R$ {receitas:,.2f}'],
            ['Despesas', f'R$ {despesas:,.2f}'],
            ['Saldo', f'R$ {saldo:,.2f}']
        ]
        
        resumo_table = Table(resumo_data, colWidths=[8*cm, 8*cm])
        resumo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(resumo_table)
        story.append(Spacer(1, 1*cm))
        
        # Tabela de lançamentos
        if lancamentos:
            dados = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']]
            
            for l in lancamentos:
                categoria_nome = l['categorias']['nome'] if l.get('categorias') else 'N/A'
                dados.append([
                    l['data'],
                    l['descricao'][:30],
                    categoria_nome,
                    l['tipo'].capitalize(),
                    f"R$ {l['valor']:,.2f}",
                    l['status'].capitalize()
                ])
            
            table = Table(dados, colWidths=[2.5*cm, 5*cm, 3*cm, 2*cm, 3*cm, 2.5*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
        
        doc.build(story)
        return True
        
    except Exception as e:
        print(f"Erro ao gerar PDF: {e}")
        return False

# ==================== FUNÇÕES DE COMPATIBILIDADE ====================

# Aliases para compatibilidade com app.py antigo
obter_lancamento_por_id = obter_lancamento
obter_conta_fixa_por_id = obter_conta_fixa

def listar_lancamentos_periodo(user_id, data_inicio, data_fim):
    """Lista lançamentos de um período"""
    try:
        supabase = database.conectar()
        
        response = supabase.table('lancamentos')\
            .select('*, categorias(nome)')\
            .eq('usuario_id', user_id)\
            .gte('data', data_inicio)\
            .lte('data', data_fim)\
            .order('data')\
            .execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"Erro ao listar lançamentos do período: {e}")
        return []

def listar_parcelas_contrato(numero_contrato):
    """Lista todas as parcelas de um contrato com formatação"""
    try:
        supabase = database.conectar()
        
        response = supabase.table('lancamentos')\
            .select('*')\
            .eq('numero_contrato', numero_contrato)\
            .order('parcela_atual')\
            .execute()
        
        if not response.data:
            return []
        
        # Formatar dados para exibição
        from datetime import datetime
        parcelas = response.data
        
        for p in parcelas:
            # Formatar data
            try:
                data_obj = datetime.strptime(p['data'], '%Y-%m-%d')
                p['data_formatada'] = data_obj.strftime('%d/%m/%Y')
            except:
                p['data_formatada'] = p['data']
            
            # Formatar valor
            p['valor_formatado'] = f"R$ {p['valor']:.2f}"
            
            # Adicionar total de parcelas (para exibição)
            p['parcela_total'] = p['total_parcelas']
        
        return parcelas
        
    except Exception as e:
        print(f"Erro ao listar parcelas: {e}")
        import traceback
        traceback.print_exc()
        return []

# ==================== TRAZER DADOS DO MÊS ANTERIOR ====================

def trazer_despesas_pendentes_mes_anterior(user_id, ano_destino, mes_destino):
    """
    Move todas as despesas e receitas pendentes do mês anterior para o mês especificado
    Remove os registros do mês anterior após copiar
    Retorna a quantidade de lançamentos movidos
    """
    try:
        supabase = database.conectar()
        
        # Calcular mês anterior
        if mes_destino == 1:
            mes_origem = 12
            ano_origem = ano_destino - 1
        else:
            mes_origem = mes_destino - 1
            ano_origem = ano_destino
        
        # Calcular período do mês anterior
        data_inicio = f"{ano_origem}-{mes_origem:02d}-01"
        ultimo_dia = monthrange(ano_origem, mes_origem)[1]
        data_fim = f"{ano_origem}-{mes_origem:02d}-{ultimo_dia}"
        
        # Buscar TODOS os lançamentos pendentes do mês anterior (despesas E receitas)
        response = supabase.table('lancamentos').select('*').eq(
            'usuario_id', user_id
        ).eq('status', 'pendente').gte(
            'data', data_inicio
        ).lte('data', data_fim).execute()
        
        if not response.data:
            return 0
        
        # Copiar cada lançamento para o mês destino e excluir o original
        contador = 0
        primeiro_dia_destino = f"{ano_destino}-{mes_destino:02d}-01"
        ids_para_excluir = []
        
        for lanc in response.data:
            # Criar novo lançamento no mês destino
            novo_lanc = {
                'usuario_id': user_id,
                'tipo': lanc['tipo'],  # Mantém o tipo original (despesa ou receita)
                'categoria_id': lanc['categoria_id'],
                'descricao': f"{lanc['descricao']} (Pend. {mes_origem:02d}/{ano_origem})",
                'valor': lanc['valor'],
                'data': primeiro_dia_destino,
                'status': 'pendente',
                'observacoes': (lanc.get('observacoes', '') or '') + f" | Movido do mês {mes_origem:02d}/{ano_origem}",
                'eh_parcelado': lanc.get('eh_parcelado', False),
                'parcela_atual': lanc.get('parcela_atual'),
                'total_parcelas': lanc.get('total_parcelas'),
                'numero_contrato': lanc.get('numero_contrato'),
                'conta_fixa_id': lanc.get('conta_fixa_id')
            }
            
            supabase.table('lancamentos').insert(novo_lanc).execute()
            ids_para_excluir.append(lanc['id'])
            contador += 1
        
        # Excluir os lançamentos originais do mês anterior
        if ids_para_excluir:
            supabase.table('lancamentos').delete().in_('id', ids_para_excluir).execute()
        
        return contador
        
    except Exception as e:
        print(f"Erro ao trazer despesas pendentes: {e}")
        import traceback
        traceback.print_exc()
        return 0

def criar_lancamento_saldo_anterior(user_id, ano_destino, mes_destino):
    """
    Calcula o saldo do mês anterior e cria um lançamento de receita
    ou despesa no primeiro dia do mês destino para ajustar o saldo
    Retorna True se criou lançamento, False caso contrário
    """
    try:
        supabase = database.conectar()
        
        # Calcular mês anterior
        if mes_destino == 1:
            mes_anterior = 12
            ano_anterior = ano_destino - 1
        else:
            mes_anterior = mes_destino - 1
            ano_anterior = ano_destino
        
        # Obter totais do mês anterior
        totais = obter_totais_mes(user_id, ano_anterior, mes_anterior)
        saldo = totais['saldo']
        
        if saldo == 0:
            return False
        
        # Buscar categoria "Saldo Anterior" ou criar se não existir
        response = supabase.table('categorias').select('id').eq(
            'usuario_id', user_id
        ).eq('nome', 'Saldo Anterior').execute()
        
        if response.data:
            categoria_id = response.data[0]['id']
        else:
            # Criar categoria
            nova_cat = supabase.table('categorias').insert({
                'usuario_id': user_id,
                'nome': 'Saldo Anterior',
                'tipo': 'receita' if saldo > 0 else 'despesa'
            }).execute()
            categoria_id = nova_cat.data[0]['id']
        
        # Criar lançamento
        primeiro_dia = f"{ano_destino}-{mes_destino:02d}-01"
        
        if saldo > 0:
            # Saldo positivo = criar receita
            novo_lanc = {
                'usuario_id': user_id,
                'tipo': 'receita',
                'categoria_id': categoria_id,
                'descricao': f'Saldo do mês {mes_anterior:02d}/{ano_anterior}',
                'valor': abs(saldo),
                'data': primeiro_dia,
                'status': 'pago',
                'observacoes': f'Saldo positivo trazido automaticamente: R$ {saldo:.2f}'
            }
        else:
            # Saldo negativo = criar despesa
            novo_lanc = {
                'usuario_id': user_id,
                'tipo': 'despesa',
                'categoria_id': categoria_id,
                'descricao': f'Déficit do mês {mes_anterior:02d}/{ano_anterior}',
                'valor': abs(saldo),
                'data': primeiro_dia,
                'status': 'pago',
                'observacoes': f'Saldo negativo trazido automaticamente: R$ {saldo:.2f}'
            }
        
        supabase.table('lancamentos').insert(novo_lanc).execute()
        return True
        
    except Exception as e:
        print(f"Erro ao criar lançamento de saldo anterior: {e}")
        import traceback
        traceback.print_exc()
        return False
