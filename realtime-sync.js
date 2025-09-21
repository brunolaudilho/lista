// Sistema de Sincronização em Tempo Real para Netlify
// Suporta Firebase Realtime Database para sincronização entre dispositivos

class RealtimeSync {
    constructor() {
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.syncMethod = 'firebase'; // 'firebase', 'localStorage'
        this.lastSyncTime = Date.now();
        this.syncInterval = null;
        this.listeners = new Map();
        this.deviceId = this.generateDeviceId();
        this.isInitialized = false;
        this.firebase = null;
        this.database = null;
        this.sessionId = this.generateSessionId();
        
        // Configurações
        this.config = {
            syncIntervalMs: 2000,
            heartbeatMs: 30000,
            maxRetries: 3,
            storageKey: 'realtime_sync_data',
            lastUpdateKey: 'last_sync_update',
            // Firebase config (público - pode ser exposto)
            firebase: {
                apiKey: "AIzaSyBqJJQqJQqJQqJQqJQqJQqJQqJQqJQqJQq", // Placeholder - você precisa configurar
                authDomain: "lista-convidados.firebaseapp.com",
                databaseURL: "https://lista-convidados-default-rtdb.firebaseio.com",
                projectId: "lista-convidados",
                storageBucket: "lista-convidados.appspot.com",
                messagingSenderId: "123456789012",
                appId: "1:123456789012:web:abcdef123456789012345678"
            }
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
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async init() {
        console.log('🔄 Inicializando sincronização em tempo real para Netlify...');
        
        // Verificar conectividade
        if (!navigator.onLine) {
            console.log('📱 Sem conexão - usando localStorage apenas');
            this.initLocalStoragePolling();
            return;
        }
        
        // Tentar Firebase primeiro
        try {
            await this.initFirebase();
            
            // Configurar detecção de offline/online
            this.setupOfflineDetection();
            return;
        } catch (error) {
            console.warn('Firebase não disponível, usando localStorage como fallback:', error);
            this.initLocalStoragePolling();
        }
    }
    
    setupOfflineDetection() {
        // Escutar mudanças de conectividade
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada - reconectando Firebase...');
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            console.log('📱 Conexão perdida - usando localStorage como fallback');
            this.handleOffline();
        });
        
        // Verificar conectividade periodicamente
        setInterval(() => {
            this.checkConnectivity();
        }, 30000); // A cada 30 segundos
    }
    
    async handleOnline() {
        if (this.syncMethod !== 'firebase') {
            try {
                await this.initFirebase();
                // Sincronizar dados locais com Firebase
                this.syncLocalDataToFirebase();
            } catch (error) {
                console.error('Erro ao reconectar Firebase:', error);
            }
        }
    }
    
    handleOffline() {
        this.isConnected = false;
        this.updateConnectionIndicator(false);
        
        // Mudar para localStorage se não estava usando
        if (this.syncMethod !== 'localStorage') {
            this.syncMethod = 'localStorage';
            this.initLocalStoragePolling();
        }
    }
    
    async checkConnectivity() {
        if (!navigator.onLine) {
            this.handleOffline();
            return;
        }
        
        // Testar conectividade real com Firebase
        if (this.syncMethod === 'firebase' && this.database) {
            try {
                await this.database.ref('.info/connected').once('value');
            } catch (error) {
                console.warn('Firebase desconectado, usando fallback');
                this.handleOffline();
            }
        }
    }
    
    syncLocalDataToFirebase() {
        if (this.syncMethod !== 'firebase' || !this.database) return;
        
        console.log('🔄 Sincronizando dados locais com Firebase...');
        
        const participantes = JSON.parse(localStorage.getItem('participantes') || '[]');
        const presencas = JSON.parse(localStorage.getItem('presencas') || '{}');
        const grupos = JSON.parse(localStorage.getItem('grupos') || '[]');
        
        const syncData = {
            participantes,
            presencas,
            grupos,
            timestamp: Date.now(),
            deviceId: this.deviceId,
            lastUpdatedBy: this.deviceId,
            syncedFromOffline: true
        };
        
        this.database.ref('lista_convidados/data').set(syncData)
            .then(() => {
                console.log('✅ Dados locais sincronizados com Firebase');
                this.showSyncNotification('Dados sincronizados com a nuvem');
            })
            .catch((error) => {
                console.error('❌ Erro ao sincronizar dados locais:', error);
            });
    }
    
    async initFirebase() {
        try {
            console.log('🔥 Inicializando Firebase...');
            console.log('📋 Configuração:', window.firebaseConfig ? 'Carregada' : 'undefined');
            
            // Verificar se temos configuração válida
            if (!window.firebaseConfig) {
                throw new Error('Configuração do Firebase não encontrada');
            }
            
            // Verificar se é configuração mock - se for, pular Firebase e usar localStorage
            if (window.firebaseConfig.apiKey === 'mock-api-key-for-development' || 
                window.firebaseConfig.projectId === 'mock-project') {
                console.log('⚠️ Detectada configuração mock - usando localStorage como fallback');
                console.log('💡 Para usar Firebase real, configure suas credenciais no firebase-config.js');
                throw new Error('Configuração mock detectada - usando fallback para localStorage');
            }
            
            // Carregar Firebase SDK apenas se não for mock
            if (!window.firebase) {
                await this.loadFirebaseSDK();
            }
            
            // Inicializar Firebase com configuração real
            if (!firebase.apps.length) {
                // Usar initializeApp com apenas a configuração, sem opções extras
                const app = firebase.initializeApp(window.firebaseConfig);
                console.log('🔥 Firebase inicializado com config:', window.firebaseConfig);
                this.database = firebase.database(app);
            } else {
                // Se já existe uma instância, usar a existente
                this.database = firebase.database();
            }
            
            console.log('🔐 Realizando autenticação anônima...');
            
            // Autenticação anônima
            await firebase.auth().signInAnonymously();
            console.log('✅ Autenticação anônima realizada com sucesso');
            
            this.isConnected = true;
            this.syncMethod = 'firebase';
            this.isInitialized = true;
            this.updateConnectionIndicator(true);
            
            // Configurar listeners
            this.setupFirebaseListeners();
            
            console.log('✅ Firebase inicializado com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
            console.log('📱 Fallback para localStorage');
            
            this.isConnected = false;
            this.syncMethod = 'localStorage';
            this.updateConnectionIndicator(false);
            
            return false;
        }
    }
    
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            console.log('📦 Carregando Firebase SDK...');
            
            // Firebase App (versão compat para evitar problemas de inicialização)
            const appScript = document.createElement('script');
            appScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
            appScript.onload = () => {
                console.log('✅ Firebase App carregado');
                
                // Firebase Database
                const dbScript = document.createElement('script');
                dbScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
                dbScript.onload = () => {
                    console.log('✅ Firebase Database carregado');
                    
                    // Firebase Auth
                    const authScript = document.createElement('script');
                    authScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js';
                    authScript.onload = () => {
                        console.log('✅ Firebase Auth carregado');
                        console.log('🎉 Todos os módulos Firebase carregados com sucesso');
                        resolve();
                    };
                    authScript.onerror = (error) => {
                        console.error('❌ Erro ao carregar Firebase Auth:', error);
                        reject(error);
                    };
                    document.head.appendChild(authScript);
                };
                dbScript.onerror = (error) => {
                    console.error('❌ Erro ao carregar Firebase Database:', error);
                    reject(error);
                };
                document.head.appendChild(dbScript);
            };
            appScript.onerror = (error) => {
                console.error('❌ Erro ao carregar Firebase App:', error);
                reject(error);
            };
            document.head.appendChild(appScript);
        });
    }
    
    setupFirebaseListeners() {
        console.log('🔧 Configurando listeners do Firebase...');
        
        const dataRef = this.database.ref('lista_convidados/data');
        const devicesRef = this.database.ref('lista_convidados/devices');
        
        console.log('📡 Referências criadas:', {
            dataRef: dataRef.toString(),
            devicesRef: devicesRef.toString()
        });
        
        // Registrar este dispositivo como ativo
        const deviceInfo = {
            deviceId: this.deviceId,
            sessionId: this.sessionId,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            userAgent: navigator.userAgent,
            online: true
        };
        
        const deviceRef = devicesRef.child(this.deviceId);
        console.log('📱 Registrando dispositivo:', this.deviceId);
        
        deviceRef.set(deviceInfo)
            .then(() => {
                console.log('✅ Dispositivo registrado com sucesso');
            })
            .catch((error) => {
                console.error('❌ Erro ao registrar dispositivo:', error);
            });
        
        // Manter presença online
        deviceRef.onDisconnect().update({ online: false });
        
        // Atualizar timestamp periodicamente
        setInterval(() => {
            if (this.isConnected) {
                deviceRef.update({ lastSeen: firebase.database.ServerValue.TIMESTAMP });
            }
        }, 30000); // A cada 30 segundos
        
        // Escutar mudanças nos dados
        console.log('👂 Configurando listener para dados...');
        dataRef.on('value', (snapshot) => {
            console.log('📊 Dados recebidos do Firebase:', snapshot.val());
            const data = snapshot.val();
            if (data && data.lastUpdatedBy !== this.deviceId) {
                console.log('🔄 Dados atualizados por outro dispositivo:', data.lastUpdatedBy);
                this.handleFirebaseUpdate(data);
            } else if (data) {
                console.log('📝 Dados são do próprio dispositivo, ignorando');
            } else {
                console.log('📭 Nenhum dado encontrado no Firebase');
            }
        }, (error) => {
            console.error('❌ Erro no listener de dados:', error);
            this.isConnected = false;
            this.updateConnectionIndicator(false);
            // Fallback para localStorage
            this.initLocalStoragePolling();
        });
        
        // Escutar dispositivos conectados
        console.log('👂 Configurando listener para dispositivos...');
        devicesRef.on('value', (snapshot) => {
            const devices = snapshot.val() || {};
            console.log('📱 Dispositivos conectados:', devices);
            
            const activeDevices = Object.values(devices).filter(device => 
                device.online && (Date.now() - device.lastSeen < 60000) // Ativo nos últimos 60s
            );
            
            this.updateDeviceCounter(activeDevices.length);
            console.log(`📱 ${activeDevices.length} dispositivo(s) conectado(s)`);
        }, (error) => {
            console.error('❌ Erro no listener de dispositivos:', error);
            this.isConnected = false;
            this.updateConnectionIndicator(false);
            // Fallback para localStorage
            this.initLocalStoragePolling();
        });
        
        console.log('✅ Listeners do Firebase configurados');
    }
    
    handleFirebaseUpdate(data) {
        console.log('🔄 Processando atualização do Firebase:', data);
        
        if (!data) {
            console.log('⚠️ Dados vazios recebidos do Firebase');
            return;
        }
        
        // Verificar se os dados são diferentes dos locais
        const currentParticipantes = JSON.parse(localStorage.getItem('participantes') || '[]');
        const currentPresencas = JSON.parse(localStorage.getItem('presencas') || '{}');
        const currentGrupos = JSON.parse(localStorage.getItem('grupos') || '[]');
        
        let hasChanges = false;
        
        // Comparar participantes
        if (JSON.stringify(currentParticipantes) !== JSON.stringify(data.participantes || [])) {
            console.log('👥 Atualizando participantes:', data.participantes);
            localStorage.setItem('participantes', JSON.stringify(data.participantes || []));
            hasChanges = true;
        }
        
        // Comparar presenças
        if (JSON.stringify(currentPresencas) !== JSON.stringify(data.presencas || {})) {
            console.log('✅ Atualizando presenças:', data.presencas);
            localStorage.setItem('presencas', JSON.stringify(data.presencas || {}));
            hasChanges = true;
        }
        
        // Comparar grupos
        if (JSON.stringify(currentGrupos) !== JSON.stringify(data.grupos || [])) {
            console.log('👨‍👩‍👧‍👦 Atualizando grupos:', data.grupos);
            localStorage.setItem('grupos', JSON.stringify(data.grupos || []));
            hasChanges = true;
        }
        
        if (hasChanges) {
            console.log('🔄 Dados atualizados localmente, notificando listeners');
            this.showSyncNotification('Dados sincronizados de outro dispositivo');
            this.notifyListeners('dataUpdated', data);
            
            // Atualizar interface se necessário
            if (typeof window.atualizarInterface === 'function') {
                console.log('🖥️ Atualizando interface');
                window.atualizarInterface();
            }
            
            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('firebaseDataUpdated', { 
                detail: { 
                    data: data,
                    timestamp: Date.now(),
                    source: 'firebase'
                } 
            }));
        } else {
            console.log('📝 Nenhuma mudança detectada nos dados');
        }
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
        console.log('📤 Enviando atualização:', type, data);
        
        if (this.syncMethod === 'firebase' && this.database) {
            // Enviar para Firebase
            const updateData = {
                type: type,
                timestamp: Date.now(),
                deviceId: this.deviceId,
                sessionId: this.sessionId,
                lastUpdatedBy: this.deviceId,
                participantes: JSON.parse(localStorage.getItem('participantes') || '[]'),
                presencas: JSON.parse(localStorage.getItem('presencas') || '{}'),
                grupos: JSON.parse(localStorage.getItem('grupos') || '[]'),
                ...data
            };
            
            console.log('🔥 Enviando dados para Firebase:', updateData);
            
            this.database.ref('lista_convidados/data').set(updateData)
                .then(() => {
                    console.log('✅ Dados enviados para Firebase com sucesso');
                    this.showSyncIndicator();
                    this.notifyListeners('updateSent', updateData);
                })
                .catch((error) => {
                    console.error('❌ Erro ao enviar dados para Firebase:', error);
                    // Fallback para localStorage
                    this.sendLocalStorageUpdate(type, data);
                });
        } else {
            console.log('📱 Firebase não disponível, usando localStorage');
            // Fallback para localStorage
            this.sendLocalStorageUpdate(type, data);
        }
    }
    
    sendLocalStorageUpdate(type, data = {}) {
        const updateInfo = {
            type: type,
            timestamp: Date.now(),
            deviceId: this.deviceId,
            sessionId: this.sessionId,
            data: data
        };
        
        localStorage.setItem(this.config.lastUpdateKey, JSON.stringify(updateInfo));
        console.log('📱 Atualização enviada via localStorage:', type);
        this.showSyncIndicator();
    }
    
    updateDeviceCounter(count) {
        const deviceCounter = document.querySelector('.device-counter');
        if (deviceCounter) {
            deviceCounter.textContent = `${count} dispositivo(s)`;
        }
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