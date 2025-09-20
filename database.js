// Configuração do banco de dados SQLite
class DatabaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.isLocalStorage = false;
    }

    async init() {
        try {
            // Aguarda o SQL.js carregar
            if (typeof initSqlJs === 'undefined') {
                throw new Error('SQL.js não está carregado. Certifique-se de incluir a biblioteca.');
            }

            const SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });

            // Tenta carregar dados existentes do localStorage
            const savedData = localStorage.getItem('sqlite_database');
            
            if (savedData) {
                const data = new Uint8Array(JSON.parse(savedData));
                this.db = new SQL.Database(data);
                // Garantir que todas as tabelas existam, mesmo com dados salvos
                this.createTables();
            } else {
                this.db = new SQL.Database();
                this.createTables();
            }

            this.isInitialized = true;
            console.log('✅ Banco de dados SQLite inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar banco de dados:', error);
            this.isLocalStorage = true;
            return false;
        }
    }

    // Criar tabelas
    async createTables() {
        try {
            console.log('🏗️ Criando tabelas...');
            
            // Tabela de participantes
            const createParticipantsTable = `
                CREATE TABLE IF NOT EXISTS participants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    department TEXT NOT NULL,
                    present BOOLEAN DEFAULT FALSE,
                    arrival_time TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Tabela de pesquisas de satisfação
            const createSurveysTable = `
                CREATE TABLE IF NOT EXISTS surveys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nps INTEGER NOT NULL,
                    qualidade TEXT NOT NULL,
                    instrutor TEXT NOT NULL,
                    comentarios TEXT,
                    timestamp TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Tabela de eventos (para futuras funcionalidades)
            const createEventsTable = `
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    date TEXT NOT NULL,
                    location TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Tabela de configurações
            const createSettingsTable = `
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(createParticipantsTable);
            this.db.run(createSurveysTable);
            this.db.run(createEventsTable);
            this.db.run(createSettingsTable);

            // Inserir configurações padrão
            const defaultSettings = [
                ['admin_password', 'admin123'],
                ['app_title', 'Lista de Convidados'],
                ['max_participants', '1000']
            ];

            const insertSetting = this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
            defaultSettings.forEach(([key, value]) => {
                insertSetting.run([key, value]);
            });
            insertSetting.free();

            await this.saveDatabase();
            console.log('✅ Tabelas criadas com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao criar tabelas:', error);
            throw error;
        }
    }

    // Salvar banco de dados no localStorage
    saveDatabase() {
        if (this.db && this.isInitialized && !this.isLocalStorage) {
            try {
                const data = this.db.export();
                const buffer = Array.from(data);
                localStorage.setItem('sqlite_database', JSON.stringify(buffer));
                console.log('💾 Banco de dados salvo no localStorage');
            } catch (error) {
                console.error('❌ Erro ao salvar banco de dados:', error);
            }
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
            const stmt = this.db.prepare('SELECT * FROM participants ORDER BY created_at DESC');
            const participants = [];
            
            while (stmt.step()) {
                const row = stmt.getAsObject();
                participants.push({
                    id: row.id,
                    name: row.name,
                    department: row.department,
                    present: Boolean(row.present),
                    arrival_time: row.arrival_time,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                });
            }
            
            stmt.free();
            return participants;
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
            
            const stmt = this.db.prepare(`
                INSERT INTO participants (name, department, present, created_at, updated_at) 
                VALUES (?, ?, FALSE, datetime('now'), datetime('now'))
            `);
            
            stmt.run([name, department]);
            const insertId = this.db.exec("SELECT last_insert_rowid()")[0].values[0][0];
            stmt.free();
            
            await this.saveDatabase();
            
            const newParticipant = {
                id: insertId,
                name: name,
                department: department,
                present: false,
                arrival_time: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log(`✅ Participante adicionado com ID: ${insertId}`);
            return newParticipant;
            
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
            
            // Verificar se existe
            const checkStmt = this.db.prepare('SELECT * FROM participants WHERE id = ?');
            checkStmt.bind([id]);
            
            if (!checkStmt.step()) {
                checkStmt.free();
                console.log(`⚠️ Participante ID ${id} não encontrado`);
                return false;
            }
            
            const participant = checkStmt.getAsObject();
            checkStmt.free();
            
            console.log(`📋 Participante encontrado: ${participant.name}`);
            
            // Remover
            const deleteStmt = this.db.prepare('DELETE FROM participants WHERE id = ?');
            deleteStmt.run([id]);
            const changes = this.db.getRowsModified();
            deleteStmt.free();
            
            await this.saveDatabase();
            
            console.log(`✅ Participante removido. Linhas afetadas: ${changes}`);
            return changes > 0;
            
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
            
            const arrivalTime = present ? new Date().toISOString() : null;
            
            const stmt = this.db.prepare(`
                UPDATE participants 
                SET present = ?, arrival_time = ?, updated_at = datetime('now')
                WHERE id = ?
            `);
            
            stmt.run([present ? 1 : 0, arrivalTime, id]);
            const changes = this.db.getRowsModified();
            stmt.free();
            
            await this.saveDatabase();
            
            console.log(`✅ Presença atualizada. Linhas afetadas: ${changes}`);
            return changes > 0;
            
        } catch (error) {
            console.error('❌ Erro ao marcar presença:', error);
            throw error;
        }
    }

    // ESTATÍSTICAS
    async getStats() {
        this.checkInitialized();
        
        try {
            const stats = {};
            
            // Total de participantes
            let stmt = this.db.prepare('SELECT COUNT(*) as total FROM participants');
            stmt.step();
            stats.total = stmt.getAsObject().total;
            stmt.free();
            
            // Participantes presentes
            stmt = this.db.prepare('SELECT COUNT(*) as present FROM participants WHERE present = 1');
            stmt.step();
            stats.present = stmt.getAsObject().present;
            stmt.free();
            
            // Participantes ausentes
            stats.absent = stats.total - stats.present;
            
            // Departamentos únicos
            stmt = this.db.prepare('SELECT COUNT(DISTINCT department) as departments FROM participants');
            stmt.step();
            stats.departments = stmt.getAsObject().departments;
            stmt.free();
            
            // Total de pesquisas de satisfação
            stmt = this.db.prepare('SELECT COUNT(*) as surveys FROM surveys');
            stmt.step();
            stats.surveysCount = stmt.getAsObject().surveys;
            stmt.free();
            
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
            
            this.db.run('DELETE FROM participants');
            this.db.run('DELETE FROM surveys');
            this.db.run('DELETE FROM events');
            // Manter configurações
            
            await this.saveDatabase();
            
            console.log('✅ Todos os dados foram limpos!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            throw error;
        }
    }

    // ADMINISTRAÇÃO - Backup do banco
    async exportDatabase() {
        this.checkInitialized();
        
        try {
            const data = this.db.export();
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lista_convidados_backup_${new Date().toISOString().split('T')[0]}.db`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Backup do banco de dados exportado!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao exportar banco:', error);
            throw error;
        }
    }

    // ADMINISTRAÇÃO - Importar banco
    async importDatabase(file) {
        try {
            console.log('📥 Importando banco de dados...');
            
            const arrayBuffer = await file.arrayBuffer();
            const uInt8Array = new Uint8Array(arrayBuffer);
            
            // Criar nova instância do banco
            this.db = new SQL.Database(uInt8Array);
            this.isInitialized = true;
            
            await this.saveDatabase();
            
            console.log('✅ Banco de dados importado com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao importar banco:', error);
            throw error;
        }
    }

    // === ADMINISTRAÇÃO - Executar SQL customizado ===

    // === MÉTODOS DE PESQUISAS DE SATISFAÇÃO ===

    async addSurveyResponse(surveyData) {
        this.checkInitialized();
        
        try {
            console.log('💾 Salvando resposta da pesquisa:', surveyData);
            
            const stmt = this.db.prepare(`
                INSERT INTO surveys (nps, qualidade, instrutor, comentarios, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                surveyData.nps,
                surveyData.qualidade,
                surveyData.instrutor,
                surveyData.comentarios || '',
                surveyData.timestamp
            ]);
            
            stmt.free();
            await this.saveDatabase();
            
            console.log('✅ Resposta da pesquisa salva com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar resposta da pesquisa:', error);
            return false;
        }
    }

    async getSurveyResponses() {
        this.checkInitialized();
        
        try {
            console.log('📊 Buscando respostas das pesquisas...');
            
            const stmt = this.db.prepare('SELECT * FROM surveys ORDER BY created_at DESC');
            const surveys = [];
            
            while (stmt.step()) {
                surveys.push(stmt.getAsObject());
            }
            
            stmt.free();
            
            console.log(`✅ ${surveys.length} respostas encontradas`);
            return surveys;
        } catch (error) {
            console.error('❌ Erro ao buscar respostas das pesquisas:', error);
            return [];
        }
    }

    async clearSurveyResponses() {
        this.checkInitialized();
        
        try {
            console.log('🗑️ Limpando todas as respostas das pesquisas...');
            
            this.db.run('DELETE FROM surveys');
            await this.saveDatabase();
            
            console.log('✅ Respostas das pesquisas limpas com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar respostas das pesquisas:', error);
            return false;
        }
    }

    async executeSQL(sql) {
        this.checkInitialized();
        
        try {
            console.log(`🔧 Executando SQL: ${sql}`);
            
            const results = this.db.exec(sql);
            await this.saveDatabase();
            
            console.log('✅ SQL executado com sucesso!');
            return results;
        } catch (error) {
            console.error('❌ Erro ao executar SQL:', error);
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