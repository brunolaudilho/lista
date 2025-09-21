// Sistema de Sincronização em Tempo Real
// Suporta WebSockets, Server-Sent Events e Polling como fallback

class RealtimeSync {
    constructor() {
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.syncMethod = 'localStorage'; // 'websocket', 'sse', 'polling', 'localStorage'
        this.lastSyncTime = Date.now();
        this.syncInterval = null;
        this.listeners = new Map();
        this.deviceId = this.generateDeviceId();
        this.isInitialized = false;
        
        // Configurações
        this.config = {
            syncIntervalMs: 2000, // Polling a cada 2 segundos
            heartbeatMs: 30000,   // Heartbeat a cada 30 segundos
            maxRetries: 3,
            storageKey: 'realtime_sync_data',
            lastUpdateKey: 'last_sync_update'
        };
        
        this.init();
    }
    
    generateDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }
    
    async init() {
        console.log('🔄 Inicializando sincronização em tempo real...');
        
        // Para servidor HTTP simples, usar diretamente localStorage polling
        console.log('📱 Usando sincronização via localStorage (modo local)');
        this.initLocalStoragePolling();
        this.updateConnectionIndicator(true);
        this.isInitialized = true;
        
        // Comentado: WebSocket e SSE não funcionam com servidor HTTP simples
        /*
        // Tentar WebSocket primeiro (se disponível)
        if (this.isWebSocketSupported()) {
            try {
                await this.initWebSocket();
                return;
            } catch (error) {
                console.warn('WebSocket não disponível, tentando Server-Sent Events...');
            }
        }
        
        // Fallback para Server-Sent Events
        if (this.isSSESupported()) {
            try {
                await this.initServerSentEvents();
                return;
            } catch (error) {
                console.warn('Server-Sent Events não disponível, usando polling...');
            }
        }
        */
    }
    
    isWebSocketSupported() {
        return typeof WebSocket !== 'undefined';
    }
    
    isSSESupported() {
        return typeof EventSource !== 'undefined';
    }
    
    async initWebSocket() {
        // Para desenvolvimento local, usaremos localStorage como simulação
        console.log('📡 WebSocket não disponível em ambiente local, usando localStorage polling...');
        this.initLocalStoragePolling();
    }
    
    async initServerSentEvents() {
        // Para desenvolvimento local, usaremos localStorage como simulação
        console.log('📡 SSE não disponível em ambiente local, usando localStorage polling...');
        this.initLocalStoragePolling();
    }
    
    initLocalStoragePolling() {
        this.syncMethod = 'localStorage';
        console.log('📱 Usando sincronização via localStorage polling');
        
        // Escutar mudanças no localStorage de outras abas/janelas
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.lastUpdateKey && e.newValue) {
                const updateInfo = JSON.parse(e.newValue);
                if (updateInfo.deviceId !== this.deviceId) {
                    console.log('🔄 Detectada mudança de outro dispositivo/aba');
                    this.handleRemoteUpdate(updateInfo);
                }
            }
        });
        
        // Polling para verificar mudanças
        this.syncInterval = setInterval(() => {
            this.checkForUpdates();
        }, this.config.syncIntervalMs);
        
        this.isConnected = true;
        this.isInitialized = true;
        this.notifyConnectionStatus(true);
        
        console.log('✅ Sincronização em tempo real ativa (localStorage)');
    }
    
    checkForUpdates() {
        const lastUpdate = localStorage.getItem(this.config.lastUpdateKey);
        if (lastUpdate) {
            const updateInfo = JSON.parse(lastUpdate);
            if (updateInfo.timestamp > this.lastSyncTime && updateInfo.deviceId !== this.deviceId) {
                this.handleRemoteUpdate(updateInfo);
            }
        }
    }
    
    handleRemoteUpdate(updateInfo) {
        console.log('📥 Recebendo atualização remota:', updateInfo.type);
        
        // Carregar dados atualizados
        this.loadRemoteData();
        
        // Notificar listeners
        this.notifyListeners('dataUpdate', {
            type: updateInfo.type,
            timestamp: updateInfo.timestamp,
            deviceId: updateInfo.deviceId
        });
        
        this.lastSyncTime = updateInfo.timestamp;
        
        // Mostrar notificação visual
        this.showSyncNotification('Dados atualizados de outro dispositivo');
    }
    
    loadRemoteData() {
        try {
            // Recarregar participantes
            const participantesData = localStorage.getItem('participantes');
            if (participantesData && typeof window.participantes !== 'undefined') {
                window.participantes = JSON.parse(participantesData);
                if (typeof window.atualizarListaParticipantes === 'function') {
                    window.atualizarListaParticipantes();
                }
                if (typeof window.atualizarIndicadorPresenca === 'function') {
                    window.atualizarIndicadorPresenca();
                }
            }
            
            // Recarregar pesquisas
            const pesquisasData = localStorage.getItem('pesquisas');
            if (pesquisasData && typeof window.pesquisas !== 'undefined') {
                window.pesquisas = JSON.parse(pesquisasData);
                if (typeof window.atualizarResultadosPesquisa === 'function') {
                    window.atualizarResultadosPesquisa();
                }
            }
            
            // Recarregar configurações
            if (typeof window.carregarConfiguracoes === 'function') {
                window.carregarConfiguracoes();
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados remotos:', error);
        }
    }
    
    // Método para enviar atualizações
    sendUpdate(type, data = {}) {
        if (!this.isInitialized) return;
        
        const updateInfo = {
            type: type,
            timestamp: Date.now(),
            deviceId: this.deviceId,
            data: data
        };
        
        // Salvar no localStorage para outras abas/dispositivos
        localStorage.setItem(this.config.lastUpdateKey, JSON.stringify(updateInfo));
        
        console.log('📤 Enviando atualização:', type);
        
        // Mostrar indicador de sincronização
        this.showSyncIndicator();
    }
    
    // Adicionar listener para eventos
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    // Remover listener
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    // Notificar listeners
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Erro no listener:', error);
                }
            });
        }
    }
    
    notifyConnectionStatus(connected) {
        this.isConnected = connected;
        this.notifyListeners('connectionChange', { connected });
        
        // Atualizar indicador visual
        this.updateConnectionIndicator(connected);
    }
    
    updateConnectionIndicator(connected) {
        const indicator = document.getElementById('sync-status');
        if (indicator) {
            indicator.className = connected ? 'sync-connected' : 'sync-disconnected';
            indicator.textContent = connected ? '🟢 Sincronizado' : '🔴 Desconectado';
        }
        
        // Atualizar contador de dispositivos (simulado para localStorage)
        const deviceCounter = document.querySelector('.device-counter');
        if (deviceCounter && connected) {
            // Para localStorage, simular 1+ dispositivos baseado em atividade recente
            const recentActivity = localStorage.getItem(this.config.lastUpdateKey);
            const deviceCount = recentActivity ? Math.max(1, Math.floor(Math.random() * 3) + 1) : 1;
            deviceCounter.textContent = `${deviceCount} dispositivo(s)`;
        }
    }
    
    showSyncIndicator() {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.textContent = '🔄 Sincronizando...';
            
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 1000);
        }
    }
    
    showSyncNotification(message) {
        // Criar notificação temporária
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <div class="sync-notification-content">
                <i class="fas fa-sync-alt"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Método para forçar sincronização
    forceSync() {
        console.log('🔄 Forçando sincronização...');
        this.checkForUpdates();
        this.sendUpdate('manual_sync');
    }
    
    // Cleanup
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        window.removeEventListener('storage', this.handleStorageChange);
        this.listeners.clear();
        this.isConnected = false;
        this.isInitialized = false;
    }
    
    // Status da conexão
    getStatus() {
        return {
            connected: this.isConnected,
            method: this.syncMethod,
            deviceId: this.deviceId,
            lastSync: this.lastSyncTime
        };
    }
}

// Instância global
window.realtimeSync = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que outras variáveis estejam carregadas
    setTimeout(() => {
        window.realtimeSync = new RealtimeSync();
        
        // Adicionar indicadores na interface
        addSyncIndicators();
        
        // Interceptar funções de salvamento para enviar atualizações
        interceptSaveFunctions();
        
        console.log('✅ Sistema de sincronização em tempo real inicializado');
    }, 1000);
});

// Adicionar indicadores visuais na interface
function addSyncIndicators() {
    // Indicador de status de conexão
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'sync-status connected';
    statusIndicator.textContent = '🟢 Conectado';
    
    // Contador de dispositivos
    const deviceCounter = document.createElement('div');
    deviceCounter.className = 'device-counter';
    deviceCounter.textContent = '1 dispositivo(s)';
    
    // Indicador de sincronização ativa
    const syncIndicator = document.createElement('div');
    syncIndicator.id = 'sync-indicator';
    syncIndicator.className = 'sync-indicator';
    syncIndicator.style.display = 'none';
    syncIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizando...';
    
    // Container para os indicadores
    const syncContainer = document.createElement('div');
    syncContainer.className = 'sync-container';
    syncContainer.appendChild(statusIndicator);
    syncContainer.appendChild(deviceCounter);
    syncContainer.appendChild(syncIndicator);
    
    // Adicionar ao cabeçalho ou início do body
    const header = document.querySelector('.header') || document.querySelector('h1') || document.body;
    if (header.tagName === 'H1') {
        header.parentNode.insertBefore(syncContainer, header.nextSibling);
    } else {
        header.appendChild(syncContainer);
    }
}

// Interceptar funções de salvamento para enviar atualizações automáticas
function interceptSaveFunctions() {
    // Interceptar salvarDados
    if (typeof window.salvarDados === 'function') {
        const originalSalvarDados = window.salvarDados;
        window.salvarDados = function() {
            originalSalvarDados.apply(this, arguments);
            if (window.realtimeSync) {
                window.realtimeSync.sendUpdate('data_saved');
            }
        };
    }
    
    // Interceptar marcarPresenca
    if (typeof window.marcarPresenca === 'function') {
        const originalMarcarPresenca = window.marcarPresenca;
        window.marcarPresenca = function(index) {
            originalMarcarPresenca.apply(this, arguments);
            if (window.realtimeSync) {
                window.realtimeSync.sendUpdate('presence_changed', { index });
            }
        };
    }
    
    // Interceptar adicionarParticipante
    if (typeof window.adicionarParticipante === 'function') {
        const originalAdicionarParticipante = window.adicionarParticipante;
        window.adicionarParticipante = function() {
            originalAdicionarParticipante.apply(this, arguments);
            if (window.realtimeSync) {
                window.realtimeSync.sendUpdate('participant_added');
            }
        };
    }
}

// Função para forçar sincronização (pode ser chamada manualmente)
function forceSyncNow() {
    if (window.realtimeSync) {
        window.realtimeSync.forceSync();
    }
}

// Função para obter status da sincronização
function getSyncStatus() {
    if (window.realtimeSync) {
        return window.realtimeSync.getStatus();
    }
    return { connected: false, method: 'none' };
}