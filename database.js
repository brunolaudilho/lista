// Configuração do banco de dados Backendless
class DatabaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.isLocalStorage = false;
        this.listeners = new Map(); // Para armazenar listeners de tempo real
    }

    async init() {
        try {
            // Verifica se o Backendless foi carregado
            if (typeof window.backendlessDB === 'undefined') {
                throw new Error('Backendless não está carregado. Certifique-se de incluir backendless-config.js primeiro.');
            }

            this.db = window.backendlessDB;
            
            // Inicializar configurações padrão se necessário
            await this.initializeDefaultSettings();

            this.isInitialized = true;
            console.log('✅ Banco de dados Backendless inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar Backendless:', error);
            console.log('🔄 Voltando para localStorage como fallback...');
            this.isLocalStorage = true;
            return false;
        }
    }

    // Inicializar configurações padrão
    async initializeDefaultSettings() {
        try {
            // Verificar se já existem configurações
            const queryBuilder = this.db.DataQueryBuilder();
            const settings = await this.db.find('Settings', queryBuilder);
            
            // Se não há configurações, criar as padrão
            if (settings.length === 0) {
                const defaultSettings = [
                    { key: 'admin_password', value: 'admin123' },
                    { key: 'app_title', value: 'Lista de Convidados' },
                    { key: 'max_participants', value: '1000' }
                ];

                for (const setting of defaultSettings) {
                    await this.db.save('Settings', {
                        ...setting,
                        updated_at: new Date()
                    });
                }
                console.log('✅ Configurações padrão criadas no Backendless');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar configurações:', error);
        }
    }

    // Salvar banco de dados (não necessário com Backendless, mas mantido para compatibilidade)
    saveDatabase() {
        // Backendless salva automaticamente, mas podemos usar para localStorage fallback
        if (this.isLocalStorage) {
            console.log('💾 Usando localStorage como fallback');
        } else {
            console.log('💾 Dados salvos automaticamente no Backendless');
        }
    }

    // Verificar se está inicializado
    checkInitialized() {
        if (!this.isInitialized || !this.db) {
            throw new Error('Banco de dados não inicializado. Chame init() primeiro.');
        }
    }

    // PARTICIPANTES - Listar todos
    async getParticipants() {
        this.checkInitialized();
        
        try {
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const participants = JSON.parse(localStorage.getItem('participants') || '[]');
                return participants;
            }
            
            const queryBuilder = this.db.DataQueryBuilder()
                .setSortBy(['created_at DESC']);
            
            const participants = await this.db.find('Participants', queryBuilder);
            return participants.map(p => ({
                id: p.objectId,
                name: p.name,
                department: p.department,
                present: Boolean(p.present),
                arrival_time: p.arrival_time,
                created_at: p.created_at,
                updated_at: p.updated_at
            }));
        } catch (error) {
            console.error('❌ Erro ao buscar participantes:', error);
            throw error;
        }
    }

    // PARTICIPANTES - Adicionar
    async addParticipant(name, department) {
        this.checkInitialized();
        
        try {
            console.log(`➕ Adicionando participante: ${name} (${department})`);
            
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const participants = JSON.parse(localStorage.getItem('participants') || '[]');
                const newParticipant = {
                    id: Date.now().toString(),
                    name: name,
                    department: department,
                    present: false,
                    arrival_time: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                participants.push(newParticipant);
                localStorage.setItem('participants', JSON.stringify(participants));
                return newParticipant;
            }
            
            const participantData = {
                name: name,
                department: department,
                present: false,
                arrival_time: null,
                created_at: new Date(),
                updated_at: new Date()
            };
            
            const savedParticipant = await this.db.save('Participants', participantData);
            
            console.log(`✅ Participante adicionado com ID: ${savedParticipant.objectId}`);
            return {
                id: savedParticipant.objectId,
                name: savedParticipant.name,
                department: savedParticipant.department,
                present: savedParticipant.present,
                arrival_time: savedParticipant.arrival_time,
                created_at: savedParticipant.created_at,
                updated_at: savedParticipant.updated_at
            };
            
        } catch (error) {
            console.error('❌ Erro ao adicionar participante:', error);
            throw error;
        }
    }

    // PARTICIPANTES - Remover
    async removeParticipant(id) {
        this.checkInitialized();
        
        try {
            console.log(`🗑️ Removendo participante ID: ${id}`);
            
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const participants = JSON.parse(localStorage.getItem('participants') || '[]');
                const index = participants.findIndex(p => p.id === id);
                if (index === -1) {
                    console.log(`⚠️ Participante ID ${id} não encontrado`);
                    return false;
                }
                participants.splice(index, 1);
                localStorage.setItem('participants', JSON.stringify(participants));
                console.log(`✅ Participante removido`);
                return true;
            }
            
            // Verificar se existe
            const participant = await this.db.findById('Participants', id);
            if (!participant) {
                console.log(`⚠️ Participante ID ${id} não encontrado`);
                return false;
            }
            
            console.log(`📋 Participante encontrado: ${participant.name}`);
            
            // Remover
            await this.db.remove('Participants', id);
            
            console.log(`✅ Participante removido`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao remover participante:', error);
            throw error;
        }
    }

    // PARTICIPANTES - Marcar presença
    async markPresent(id, present = true) {
        this.checkInitialized();
        
        try {
            console.log(`✅ Marcando presença do participante ID ${id}: ${present}`);
            
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const participants = JSON.parse(localStorage.getItem('participants') || '[]');
                const participant = participants.find(p => p.id === id);
                if (!participant) {
                    console.log(`⚠️ Participante ID ${id} não encontrado`);
                    return false;
                }
                participant.present = present;
                participant.arrival_time = present ? new Date().toISOString() : null;
                participant.updated_at = new Date().toISOString();
                localStorage.setItem('participants', JSON.stringify(participants));
                console.log(`✅ Presença atualizada`);
                return true;
            }
            
            const arrivalTime = present ? new Date() : null;
            
            const updateData = {
                objectId: id,
                present: present,
                arrival_time: arrivalTime,
                updated_at: new Date()
            };
            
            await this.db.save('Participants', updateData);
            
            console.log(`✅ Presença atualizada`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao marcar presença:', error);
            throw error;
        }
    }

    // ESTATÍSTICAS
    async getStats() {
        this.checkInitialized();
        
        try {
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const participants = JSON.parse(localStorage.getItem('participants') || '[]');
                const stats = {
                    total: participants.length,
                    present: participants.filter(p => p.present).length,
                    absent: participants.filter(p => !p.present).length,
                    departments: [...new Set(participants.map(p => p.department))].length
                };
                return stats;
            }
            
            const stats = {};
            
            // Total de participantes
            const allParticipants = await this.db.find('Participants');
            stats.total = allParticipants.length;
            
            // Participantes presentes
            const presentQuery = this.db.DataQueryBuilder()
                .setWhereClause('present = true');
            const presentParticipants = await this.db.find('Participants', presentQuery);
            stats.present = presentParticipants.length;
            
            // Participantes ausentes
            stats.absent = stats.total - stats.present;
            
            // Departamentos únicos
            const departments = [...new Set(allParticipants.map(p => p.department))];
            stats.departments = departments.length;
            
            return stats;
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            throw error;
        }
    }

    // ADMINISTRAÇÃO - Limpar todos os dados
    async clearAllData() {
        this.checkInitialized();
        
        try {
            console.log('🧹 Limpando todos os dados...');
            
            if (this.isLocalStorage) {
                // Fallback para localStorage
                localStorage.removeItem('participants');
                localStorage.removeItem('events');
                console.log('✅ Todos os dados foram limpos!');
                return true;
            }
            
            // Buscar todos os participantes e eventos para deletar
            const participants = await this.db.find('Participants');
            const events = await this.db.find('Events');
            
            // Deletar participantes
            for (const participant of participants) {
                await this.db.remove('Participants', participant.objectId);
            }
            
            // Deletar eventos
            for (const event of events) {
                await this.db.remove('Events', event.objectId);
            }
            
            console.log('✅ Todos os dados foram limpos!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            throw error;
        }
    }

    // ADMINISTRAÇÃO - Exportar dados (JSON)
    async exportData() {
        this.checkInitialized();
        
        try {
            console.log('📤 Exportando dados...');
            
            let participants, events, settings;
            
            if (this.isLocalStorage) {
                // Fallback para localStorage
                participants = JSON.parse(localStorage.getItem('participants') || '[]');
                events = JSON.parse(localStorage.getItem('events') || '[]');
                settings = JSON.parse(localStorage.getItem('settings') || '{}');
            } else {
                // Buscar dados do Backendless
                participants = await this.db.find('Participants');
                events = await this.db.find('Events');
                settings = await this.db.find('Settings');
            }
            
            const exportData = {
                participants,
                events,
                settings,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lista_convidados_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Dados exportados com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao exportar dados:', error);
            throw error;
        }
    }

    // CONFIGURAÇÕES - Obter configuração
    async getSetting(key) {
        this.checkInitialized();
        
        try {
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const settings = JSON.parse(localStorage.getItem('settings') || '{}');
                return settings[key];
            }
            
            const queryBuilder = this.db.DataQueryBuilder()
                .setWhereClause(`key = '${key}'`);
            
            const settings = await this.db.find('Settings', queryBuilder);
            return settings.length > 0 ? settings[0].value : null;
        } catch (error) {
            console.error('❌ Erro ao buscar configuração:', error);
            throw error;
        }
    }

    // CONFIGURAÇÕES - Definir configuração
    async setSetting(key, value) {
        this.checkInitialized();
        
        try {
            if (this.isLocalStorage) {
                // Fallback para localStorage
                const settings = JSON.parse(localStorage.getItem('settings') || '{}');
                settings[key] = value;
                localStorage.setItem('settings', JSON.stringify(settings));
                return true;
            }
            
            // Verificar se já existe
            const queryBuilder = this.db.DataQueryBuilder()
                .setWhereClause(`key = '${key}'`);
            
            const existingSettings = await this.db.find('Settings', queryBuilder);
            
            if (existingSettings.length > 0) {
                // Atualizar
                const updateData = {
                    objectId: existingSettings[0].objectId,
                    key: key,
                    value: value,
                    updated_at: new Date()
                };
                await this.db.save('Settings', updateData);
            } else {
                // Criar novo
                const settingData = {
                    key: key,
                    value: value,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await this.db.save('Settings', settingData);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao definir configuração:', error);
            throw error;
        }
    }
}

// Instância global
window.databaseService = new DatabaseService();

// Aguardar o carregamento da página e inicializar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Inicializando sistema de banco de dados...');
        await window.databaseService.init();
        
        // Disparar evento personalizado para notificar que o banco está pronto
        window.dispatchEvent(new CustomEvent('databaseReady'));
    } catch (error) {
        console.error('💥 Erro ao inicializar sistema:', error);
        // Fallback para localStorage
        window.databaseService.isLocalStorage = true;
        window.dispatchEvent(new CustomEvent('databaseReady'));
    }
});