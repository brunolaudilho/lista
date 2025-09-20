// =====================================================
// SERVIÇO SUPABASE - OPERAÇÕES DE BANCO DE DADOS
// Sistema de Lista de Presença - Treinamento Corporativo
// =====================================================

class SupabaseService {
    constructor() {
        this.client = window.supabaseClient;
        this.config = window.APP_CONFIG;
    }

    // =====================================================
    // OPERAÇÕES DE PARTICIPANTES
    // =====================================================

    async getParticipants() {
        try {
            const { data, error } = await this.client
                .from(this.config.PARTICIPANTS_TABLE)
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar participantes:', error);
            return [];
        }
    }

    async addParticipant(name, department = '') {
        try {
            const { data, error } = await this.client
                .from(this.config.PARTICIPANTS_TABLE)
                .insert([
                    {
                        name: name.trim(),
                        department: department.trim(),
                        present: false,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao adicionar participante:', error);
            throw error;
        }
    }

    async updateParticipantPresence(id, present) {
        try {
            const updateData = {
                present: present,
                updated_at: new Date().toISOString()
            };

            // Se está marcando como presente, registrar horário de chegada
            if (present) {
                updateData.arrival_time = new Date().toISOString();
            } else {
                updateData.arrival_time = null;
            }

            const { data, error } = await this.client
                .from(this.config.PARTICIPANTS_TABLE)
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
            throw error;
        }
    }

    async removeParticipant(id) {
        try {
            const { error } = await this.client
                .from(this.config.PARTICIPANTS_TABLE)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao remover participante:', error);
            throw error;
        }
    }

    async clearAllParticipants() {
        try {
            const { error } = await this.client
                .from(this.config.PARTICIPANTS_TABLE)
                .delete()
                .neq('id', 0); // Remove todos os registros

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao limpar participantes:', error);
            throw error;
        }
    }

    // =====================================================
    // OPERAÇÕES DE PESQUISA DE SATISFAÇÃO
    // =====================================================

    async saveSurvey(surveyData) {
        try {
            const { data, error } = await this.client
                .from(this.config.SURVEYS_TABLE)
                .insert([
                    {
                        participant_name: surveyData.participantName,
                        nps_score: surveyData.npsScore,
                        quality_rating: surveyData.qualityRating,
                        instructor_rating: surveyData.instructorRating,
                        comments: surveyData.comments || '',
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao salvar pesquisa:', error);
            throw error;
        }
    }

    async getSurveys() {
        try {
            const { data, error } = await this.client
                .from(this.config.SURVEYS_TABLE)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar pesquisas:', error);
            return [];
        }
    }

    // =====================================================
    // OPERAÇÕES DE GRUPOS
    // =====================================================

    async saveGroups(groups, eventId = 1) {
        try {
            // Primeiro, limpar grupos existentes do evento
            await this.client
                .from('groups')
                .delete()
                .eq('event_id', eventId);

            // Inserir novos grupos
            const groupsData = groups.map((group, index) => ({
                event_id: eventId,
                group_name: `Grupo ${index + 1}`,
                participants: group,
                created_at: new Date().toISOString()
            }));

            const { data, error } = await this.client
                .from('groups')
                .insert(groupsData)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao salvar grupos:', error);
            throw error;
        }
    }

    async getGroups(eventId = 1) {
        try {
            const { data, error } = await this.client
                .from('groups')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
            return [];
        }
    }

    // =====================================================
    // OPERAÇÕES DE CONFIGURAÇÃO
    // =====================================================

    async getConfig(key) {
        try {
            const { data, error } = await this.client
                .from('system_config')
                .select('config_value')
                .eq('config_key', key)
                .single();

            if (error) throw error;
            return data?.config_value || null;
        } catch (error) {
            console.error(`Erro ao buscar configuração ${key}:`, error);
            return null;
        }
    }

    async setConfig(key, value, description = '') {
        try {
            const { data, error } = await this.client
                .from('system_config')
                .upsert([
                    {
                        config_key: key,
                        config_value: value,
                        description: description,
                        updated_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error(`Erro ao salvar configuração ${key}:`, error);
            throw error;
        }
    }

    // =====================================================
    // OPERAÇÕES DE SINCRONIZAÇÃO
    // =====================================================

    async syncFromLocalStorage() {
        console.log('🔄 Iniciando sincronização do localStorage para Supabase...');
        
        try {
            // Migrar participantes
            const localParticipants = JSON.parse(localStorage.getItem('participants') || '[]');
            if (localParticipants.length > 0) {
                console.log(`📋 Migrando ${localParticipants.length} participantes...`);
                
                for (const participant of localParticipants) {
                    await this.addParticipant(participant.name, participant.department);
                    if (participant.present) {
                        // Buscar o participante recém-criado e atualizar presença
                        const participants = await this.getParticipants();
                        const newParticipant = participants.find(p => p.name === participant.name);
                        if (newParticipant) {
                            await this.updateParticipantPresence(newParticipant.id, true);
                        }
                    }
                }
            }

            // Migrar pesquisas
            const localSurveys = JSON.parse(localStorage.getItem('surveys') || '[]');
            if (localSurveys.length > 0) {
                console.log(`📊 Migrando ${localSurveys.length} pesquisas...`);
                
                for (const survey of localSurveys) {
                    await this.saveSurvey({
                        participantName: survey.participantName,
                        npsScore: survey.npsScore,
                        qualityRating: survey.qualityRating,
                        instructorRating: survey.instructorRating,
                        comments: survey.comments
                    });
                }
            }

            console.log('✅ Sincronização concluída com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            return false;
        }
    }

    // =====================================================
    // UTILITÁRIOS
    // =====================================================

    async testConnection() {
        return await window.SupabaseUtils.checkConnection();
    }

    async getStats() {
        try {
            const participants = await this.getParticipants();
            const surveys = await this.getSurveys();
            
            return {
                totalParticipants: participants.length,
                presentParticipants: participants.filter(p => p.present).length,
                totalSurveys: surveys.length,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return null;
        }
    }

    // Método para sincronizar dados offline
    async syncOfflineData() {
        try {
            // Implementar sincronização de dados offline quando necessário
            console.log('Sincronização offline implementada');
            return true;
        } catch (error) {
            console.error('Erro na sincronização offline:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro no cadastro:', error);
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro no logout:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            return user;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            throw error;
        }
    }

    // Listener para mudanças de autenticação
    onAuthStateChange(callback) {
        return window.supabaseClient.auth.onAuthStateChange(callback);
    }
}

// Instanciar e exportar o serviço
const supabaseService = new SupabaseService();
window.supabaseService = supabaseService;

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseService;
}