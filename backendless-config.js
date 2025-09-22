// Configuração do Backendless
// Para usar este arquivo, você precisa:
// 1. Criar uma conta gratuita no Backendless (https://backendless.com)
// 2. Criar uma nova aplicação
// 3. Substituir as configurações abaixo pelas suas credenciais

// Configuração do Backendless - SUBSTITUA PELAS SUAS CREDENCIAIS
const BACKENDLESS_CONFIG = {
    APP_ID: 'A1ADBAFD-16C4-49C4-88D4-0EC208A36A67',
    API_KEY: 'FBF62AAD-4BA0-49F9-9B8E-C0C53F04B48E'
};

// Inicializar Backendless
if (typeof Backendless !== 'undefined') {
    Backendless.initApp(BACKENDLESS_CONFIG.APP_ID, BACKENDLESS_CONFIG.API_KEY);
    
    // Configurar para usar HTTPS
    Backendless.serverURL = 'https://api.backendless.com';
    
    console.log('✅ Backendless inicializado com sucesso!');
    
    // Exportar para uso global
    window.backendlessDB = {
        // Métodos de dados
        save: (tableName, object) => Backendless.Data.of(tableName).save(object),
        find: (tableName, queryBuilder) => Backendless.Data.of(tableName).find(queryBuilder),
        findById: (tableName, id) => Backendless.Data.of(tableName).findById(id),
        update: (tableName, object) => Backendless.Data.of(tableName).save(object),
        remove: (tableName, object) => Backendless.Data.of(tableName).remove(object),
        
        // Métodos de query
        DataQueryBuilder: () => Backendless.DataQueryBuilder.create(),
        
        // Real-time listeners
        addCreateListener: (tableName, callback) => {
            const eventHandler = Backendless.Data.of(tableName).rt();
            eventHandler.addCreateListener(callback);
            return eventHandler;
        },
        addUpdateListener: (tableName, callback) => {
            const eventHandler = Backendless.Data.of(tableName).rt();
            eventHandler.addUpdateListener(callback);
            return eventHandler;
        },
        addDeleteListener: (tableName, callback) => {
            const eventHandler = Backendless.Data.of(tableName).rt();
            eventHandler.addDeleteListener(callback);
            return eventHandler;
        }
    };
    
} else {
    console.error('❌ Backendless SDK não foi carregado. Certifique-se de incluir o script do Backendless.');
}

// Instruções para configuração
console.log(`
🔧 INSTRUÇÕES DE CONFIGURAÇÃO:

1. Acesse https://backendless.com e crie uma conta gratuita
2. Crie uma nova aplicação
3. Vá para "Manage" > "App Settings"
4. Copie o APP ID e API KEY
5. Substitua as credenciais neste arquivo:
   - APP_ID: '${BACKENDLESS_CONFIG.APP_ID}'
   - API_KEY: '${BACKENDLESS_CONFIG.API_KEY}'

📊 PLANO GRATUITO BACKENDLESS:
- 25.000 API calls por mês
- 1GB de armazenamento
- Real-time database
- Sem limite de usuários
- Hospedagem incluída
`);