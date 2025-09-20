// Configurações do Supabase
const SUPABASE_URL = 'https://rpihqbxyqrwslicrbixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwaWhxYnh5cXJ3c2xpY3JiaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDExMjYsImV4cCI6MjA3Mzk3NzEyNn0.HcgHXMPtP0iWO2Jbkb0zzwS1PdR2yUli3-3LgGk6C2Y';

// Inicializar cliente Supabase com configurações adicionais
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    },
    global: {
        headers: {
            'X-Client-Info': 'lista-convidados@1.0.0'
        }
    }
});

// Configurações da aplicação
const APP_CONFIG = {
    // Nome da tabela de participantes
    PARTICIPANTS_TABLE: 'participants',
    
    // Nome da tabela de eventos
    EVENTS_TABLE: 'events',
    
    // Nome da tabela de pesquisas
    SURVEYS_TABLE: 'surveys',
    
    // Configurações de autenticação
    AUTH: {
        // Senha padrão do administrador (será substituída por auth real)
        ADMIN_PASSWORD: 'admin123'
    }
};

// Funções utilitárias para Supabase
const SupabaseUtils = {
    // Verificar se está conectado
    async checkConnection() {
        try {
            console.log('🔍 Testando conexão com Supabase...');
            
            // Usar uma query mais simples e robusta
            const { data, error, count } = await supabaseClient
                .from('participants')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.error('❌ Erro na conexão:', error);
                throw error;
            }
            
            console.log('✅ Conexão com Supabase estabelecida. Total de registros:', count);
            return true;
        } catch (error) {
            console.error('❌ Erro na conexão com Supabase:', error);
            
            // Tentar uma abordagem alternativa - verificar se a tabela existe
            try {
                console.log('🔄 Tentando abordagem alternativa...');
                const { data: tableData, error: tableError } = await supabaseClient
                    .from('participants')
                    .select('id')
                    .limit(1);
                
                if (tableError) {
                    console.error('❌ Tabela não encontrada ou sem permissão:', tableError);
                    return false;
                }
                
                console.log('✅ Conexão alternativa bem-sucedida');
                return true;
            } catch (altError) {
                console.error('❌ Todas as tentativas de conexão falharam:', altError);
                return false;
            }
        }
    },

    // Criar tabelas se não existirem (para desenvolvimento)
    async initializeTables() {
        console.log('🔧 Inicializando estrutura do banco de dados...');
        
        // Nota: Em produção, as tabelas devem ser criadas via Supabase Dashboard
        // Este é apenas um exemplo da estrutura necessária
        
        const tableStructures = {
            participants: `
                CREATE TABLE IF NOT EXISTS participants (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    department VARCHAR(255),
                    present BOOLEAN DEFAULT FALSE,
                    arrival_time TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `,
            events: `
                CREATE TABLE IF NOT EXISTS events (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    date DATE,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `,
            surveys: `
                CREATE TABLE IF NOT EXISTS surveys (
                    id SERIAL PRIMARY KEY,
                    participant_name VARCHAR(255),
                    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
                    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
                    instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
                    comments TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `
        };

        console.log('📋 Estruturas de tabelas definidas:', Object.keys(tableStructures));
        return tableStructures;
    }
};

// Exportar para uso global
window.supabaseClient = supabaseClient;
window.APP_CONFIG = APP_CONFIG;
window.SupabaseUtils = SupabaseUtils;