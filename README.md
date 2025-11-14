# 💰 Finanças em Dia - PWA

Sistema completo de controle financeiro pessoal desenvolvido com Flask e Supabase (PostgreSQL).  
**Agora como Progressive Web App (PWA)!** 📱

![Python](https://img.shields.io/badge/Python-3.14-blue)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green)
![Supabase](https://img.shields.io/badge/Supabase-2.24.0-orange)
![PWA](https://img.shields.io/badge/PWA-Ready-success)

## 🚀 Funcionalidades

- ✅ **Gestão de Lançamentos**: Cadastro de receitas e despesas com suporte a parcelamento
- ✅ **Parcelamento Automático**: Cria automaticamente todas as parcelas em meses diferentes
- ✅ **Contas Fixas**: Lançamentos recorrentes gerados automaticamente
- ✅ **Quitação de Parcelas**: Quitação integral ou parcial com desconto opcional
- ✅ **Categorização**: Organize seus lançamentos por categorias personalizadas
- ✅ **Relatórios**: Visualize e exporte relatórios em PDF por período
- ✅ **Multi-usuário**: Sistema de login com senhas criptografadas (bcrypt)
- ✅ **Dashboard**: Resumo mensal com totais de receitas, despesas e saldo
- ✅ **Banco em Nuvem**: Dados armazenados no Supabase (PostgreSQL)

## 🌟 Recursos PWA

- 📱 **Instalável**: Funciona como app nativo em qualquer dispositivo
- 🔌 **Offline**: Páginas visitadas funcionam sem internet
- ⚡ **Rápido**: Cache inteligente para carregamento instantâneo
- 🎨 **Responsivo**: Interface otimizada para mobile e desktop
- 🔔 **Indicador de Status**: Mostra quando está online/offline
- 💾 **Cache Automático**: Service Worker gerencia recursos automaticamente

## 📋 Pré-requisitos

- Python 3.10 ou superior
- Conta no [Supabase](https://supabase.com) (gratuita)
- pip (gerenciador de pacotes Python)

## 🔧 Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/gui130699/Financeiro-em-dia.git
cd Financeiro-em-dia
```

### 2. Crie e ative o ambiente virtual
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure o Supabase
1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o script `criar_tabelas_supabase.sql` no SQL Editor
4. Copie a URL e anon key (Settings > API)
5. Edite `config.py` com suas credenciais

### 5. Execute o aplicativo
```bash
python app.py
```

Acesse: http://127.0.0.1:5000

## 📱 Instalando como PWA

### No Desktop (Chrome/Edge):
1. Abra o app no navegador
2. Clique no ícone de instalação (+) na barra de endereço
3. Ou use o botão "Instalar App" que aparece na tela

### No Android:
1. Abra no Chrome
2. Menu > "Instalar app" ou "Adicionar à tela inicial"

### No iOS:
1. Abra no Safari
2. Compartilhar > "Adicionar à Tela Inicial"

## 📁 Estrutura do Projeto

```
Fin/
├── app.py                    # Aplicação Flask principal
├── database.py               # Gerenciamento do banco Supabase
├── models.py                 # Lógica de negócio
├── models_supabase.py        # Modelos específicos Supabase
├── config.py                 # Configurações (URL e Key)
├── requirements.txt          # Dependências
├── iniciar.bat              # Script para iniciar (Windows)
├── Procfile                 # Deploy Heroku
├── PWA_GUIA.md             # Guia detalhado do PWA
│
├── templates/               # Templates HTML
│   ├── base.html           # Template base com PWA
│   ├── home.html           # Dashboard
│   ├── lancamentos.html    # Lançamentos
│   ├── categorias.html     # Categorias
│   ├── contas_fixas.html   # Contas fixas
│   ├── contas_parceladas.html
│   ├── relatorios.html
│   ├── offline.html        # Página offline PWA
│   └── ...
│
└── static/                  # Arquivos estáticos
    ├── manifest.json       # Configuração PWA
    ├── service-worker.js   # Service Worker
    ├── icons/              # Ícones PWA (todos os tamanhos)
    ├── css/estilo.css
    └── js/
        ├── scripts.js
        └── pwa-install.js  # Lógica de instalação
```

## 🎯 Como Usar

### 1. Primeiro Acesso
- Clique em "Criar nova conta"
- Cadastre usuário e senha
- Faça login
- Categorias padrão serão criadas automaticamente

### 2. Lançamentos
- **Simples**: Preencha data, tipo, valor e descrição
- **Parcelado**: Defina número de parcelas (geração automática)
- **Conta Fixa**: Marque como fixa e defina dia de vencimento

### 3. Contas Fixas
- Gerencie contas recorrentes (aluguel, internet, etc.)
- Use "Gerar p/ Mês" para criar lançamentos automaticamente

### 4. Quitação de Parcelados
- **Integral**: Quita todas as parcelas (com desconto opcional)
- **Parcial**: Escolha quais parcelas quitar

### 5. Relatórios
- Selecione período
- Visualize totais e análise por categoria
- Exporte para PDF

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Sessões seguras do Flask
- ✅ Validações no backend
- ✅ Proteção contra SQL Injection
- ✅ HTTPS obrigatório em produção

## 🛠️ Tecnologias

- **Backend**: Python 3.14, Flask 3.0.0
- **Banco de Dados**: PostgreSQL via Supabase 2.24.0
- **Frontend**: HTML5, CSS3, JavaScript
- **Framework CSS**: Bootstrap 5
- **PWA**: Service Worker, Manifest, Cache API
- **Relatórios**: ReportLab 4.0.7
- **Segurança**: BCrypt 4.1.1

## 🌐 Deploy

### Heroku
```bash
git push heroku main
```

### Vercel/Netlify
Configure para servir com Flask/WSGI

**Importante**: HTTPS é obrigatório para PWA funcionar em produção!

## 📊 PWA - Teste de Qualidade

Use o Lighthouse no Chrome DevTools:
1. F12 > Lighthouse
2. Selecione "Progressive Web App"
3. Execute análise

**Meta**: Score 90+ para PWA ✅

## 🔍 Solução de Problemas

### Service Worker não registra
- ✅ Use HTTPS ou localhost
- ✅ Limpe cache: DevTools > Application > Clear Storage

### App não instala
- ✅ Navegue pelo site por 30s primeiro
- ✅ Verifique manifest: DevTools > Application > Manifest

### Offline não funciona
- ✅ Navegue pelas páginas online primeiro (para cachear)
- ✅ Verifique Service Worker ativo: DevTools > Application

### Porta 5000 em uso
```python
# Em app.py, mude a porta:
app.run(debug=True, port=5001)
```

## 📈 Roadmap Futuro

- [ ] Push Notifications para alertas de vencimento
- [ ] Background Sync para dados offline
- [ ] Gráficos interativos avançados
- [ ] Exportar para Excel
- [ ] Metas e orçamentos
- [ ] Integração com Open Banking

## 📖 Documentação Adicional

- **PWA_GUIA.md** - Guia completo sobre o PWA e recursos avançados

## 👨‍💻 Desenvolvimento

Desenvolvido com ❤️ usando Python, Flask e tecnologias PWA.

**Versão**: 2.0.0 - PWA Edition  
**Data**: Novembro 2025

## 📄 Licença

Este projeto é de uso pessoal e educacional.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

💰 **Mantenha suas finanças em dia - em qualquer lugar, online ou offline!** 💰 📱
