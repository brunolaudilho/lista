// Configurações do Supabase
const SUPABASE_URL = 'https://rpihqbxyqrwslicrbixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwaWhxYnh5cXJ3c2xpY3JiaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDExMjYsImV4cCI6MjA3Mzk3NzEyNn0.HcgHXMPtP0iWO2Jbkb0zzwS1PdR2yUli3-3LgGk6C2Y';

// Inicializar cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    checkConnection() {
        return supabaseClient.from('participants').select('count', { count: 'exact', head: true })
            .then(({ data, error }) => {
                if (error) throw error;
                console.log('✅ Conexão com Supabase estabelecida');
                return true;
            })
            .catch(error => {
                console.error('❌ Erro na conexão com Supabase:', error);
                return false;
            });
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