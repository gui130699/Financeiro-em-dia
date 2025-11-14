// Script para adicionar botão de instalação personalizado
// Adicione este código ao arquivo scripts.js se desejar

// Variável para armazenar o evento de instalação
let deferredPrompt;
let installButton;

// Criar botão de instalação
function criarBotaoInstalacao() {
    // Verificar se já existe
    if (document.getElementById('btn-instalar-pwa')) return;
    
    // Criar o botão
    installButton = document.createElement('button');
    installButton.id = 'btn-instalar-pwa';
    installButton.className = 'btn btn-success btn-sm position-fixed bottom-0 end-0 m-3';
    installButton.innerHTML = '<i class="bi bi-download"></i> Instalar App';
    installButton.style.cssText = 'z-index: 9999; display: none;';
    
    // Adicionar ao body
    document.body.appendChild(installButton);
    
    // Adicionar evento de clique
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // Mostrar prompt de instalação
        deferredPrompt.prompt();
        
        // Aguardar resposta do usuário
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
        
        // Limpar prompt
        deferredPrompt = null;
        installButton.style.display = 'none';
    });
}

// Detectar quando o app pode ser instalado
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir o mini-infobar do Chrome em mobile
    e.preventDefault();
    
    // Armazenar o evento
    deferredPrompt = e;
    
    // Criar e mostrar botão de instalação
    criarBotaoInstalacao();
    installButton.style.display = 'block';
    
    console.log('App pode ser instalado');
});

// Detectar quando o app foi instalado
window.addEventListener('appinstalled', () => {
    console.log('PWA foi instalado com sucesso!');
    
    // Esconder o botão
    if (installButton) {
        installButton.style.display = 'none';
    }
    
    // Limpar o prompt
    deferredPrompt = null;
    
    // Opcional: Mostrar mensagem de sucesso
    if (typeof bootstrap !== 'undefined') {
        const toast = new bootstrap.Toast(document.createElement('div'));
        // Implementar toast de sucesso aqui
    }
});

// Verificar se já está instalado
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    console.log('App já está instalado e rodando em modo standalone');
}

// Status da conexão
function atualizarStatusConexao() {
    const statusElement = document.getElementById('status-conexao');
    if (!statusElement) return;
    
    if (navigator.onLine) {
        statusElement.innerHTML = '<i class="bi bi-wifi"></i> Online';
        statusElement.className = 'badge bg-success';
    } else {
        statusElement.innerHTML = '<i class="bi bi-wifi-off"></i> Offline';
        statusElement.className = 'badge bg-warning';
    }
}

// Listeners de conexão
window.addEventListener('online', () => {
    console.log('Conexão restaurada');
    atualizarStatusConexao();
    
    // Opcional: Sincronizar dados pendentes
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('sync-lancamentos');
        });
    }
});

window.addEventListener('offline', () => {
    console.log('Conexão perdida');
    atualizarStatusConexao();
});

// Atualização do Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker atualizado');
        
        // Opcional: Mostrar mensagem para recarregar
        if (confirm('Nova versão disponível! Recarregar agora?')) {
            window.location.reload();
        }
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    atualizarStatusConexao();
    criarBotaoInstalacao();
});

// Exportar funções (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        criarBotaoInstalacao,
        atualizarStatusConexao
    };
}
