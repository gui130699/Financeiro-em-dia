"""
Configurações do Supabase
Usa variáveis de ambiente em produção ou valores padrão em desenvolvimento
"""
import os

# Credenciais do Supabase (usar variáveis de ambiente em produção)
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://xgdlagtezxpnwafdzpci.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZGxhZ3RlenhwbndhZmR6cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzk1NTksImV4cCI6MjA3ODcxNTU1OX0.EQCHnNEzuPIxNu-2bOoO6RL2gs4W6qQAk8Bx3LTb2uU')

# Senha do banco (para referência administrativa)
# 9331077093.Gui
