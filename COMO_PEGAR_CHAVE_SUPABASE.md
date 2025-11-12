# INSTRUÇÕES PARA PEGAR A CHAVE CORRETA DO SUPABASE

## 1️⃣ Acesse o painel do Supabase
https://supabase.com/dashboard/project/otyekylihpzscqwxeoiy

## 2️⃣ No menu lateral, clique em:
⚙️ Settings (Configurações) → API

## 3️⃣ Você verá duas chaves:

### 📋 Project URL (copie isso):
Deve ser: https://otyekylihpzscqwxeoiy.supabase.co

### 🔑 Project API keys - escolha UMA dessas:

**anon public** (RECOMENDADO para uso no app):
- Esta é a chave PÚBLICA que deve ser usada na variável SUPABASE_KEY
- Começa com: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- É SEGURO usar essa chave no frontend

**service_role secret** (⚠️ CUIDADO - apenas se necessário):
- Esta é a chave PRIVADA com acesso administrativo total
- Nunca exponha essa chave publicamente
- Use apenas se precisar de operações administrativas

## 4️⃣ COPIE A CHAVE "anon public" COMPLETA

Ela tem aproximadamente 200-300 caracteres e começa com:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eWVreWxpaHB6c2Nxd3hlb2l5...

## 5️⃣ Configure no Render.com

Vá em: Environment → Edite a variável SUPABASE_KEY

⚠️ IMPORTANTE:
- NÃO coloque aspas ao redor da chave
- NÃO adicione espaços antes ou depois
- COPIE E COLE exatamente como está no Supabase
- Clique em "Save Changes"
- Aguarde o redeploy automático (5-10 minutos)

---

## 📊 RESUMO DAS 3 VARIÁVEIS:

```
SUPABASE_URL
https://otyekylihpzscqwxeoiy.supabase.co

SUPABASE_KEY
[COPIE a chave "anon public" do painel do Supabase - Settings → API]

SECRET_KEY
financas_em_dia_2025_seguro_web_app
```

---

## ⚠️ SE A CHAVE CONTINUAR DANDO ERRO:

1. Verifique se o projeto Supabase está ATIVO (não pausado)
2. Confirme que você está copiando a chave do projeto correto
3. Tente usar a chave "service_role" temporariamente para testar
4. Verifique se você não tem espaços invisíveis antes/depois da chave

---

## 🧪 TESTE LOCAL:

Depois de pegar a chave nova, teste localmente primeiro:

1. Abra o arquivo config.py
2. Substitua o valor atual da SUPABASE_KEY pela nova
3. Execute: python teste_variaveis.py
4. Se der ✅ OK, use essa mesma chave no Render

