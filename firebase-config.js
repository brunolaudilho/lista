// Configuração do Firebase para sincronização em tempo real
// CREDENCIAIS REAIS DO FIREBASE - CONFIGURADAS PELO USUÁRIO

// Configuração real do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA4rEocvcYk7N8ECds4XmO5gxLG4LULY44",
  authDomain: "lista-convidados-app.firebaseapp.com",
  databaseURL: "https://lista-convidados-app-default-rtdb.firebaseio.com",
  projectId: "lista-convidados-app",
  storageBucket: "lista-convidados-app.firebasestorage.app",
  messagingSenderId: "127386529971",
  appId: "1:127386529971:web:52cc837a6adeb3139d40c6",
  measurementId: "G-NJ5JPGEMPC"
};

// Configuração temporária para desenvolvimento (simulação) - BACKUP
const mockConfig = {
    apiKey: "mock-api-key-for-development",
    authDomain: "mock-project.firebaseapp.com",
    databaseURL: "https://mock-project-default-rtdb.firebaseio.com/",
    projectId: "mock-project",
    storageBucket: "mock-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "mock-app-id"
};

// Detectar ambiente
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1' && 
                    !window.location.hostname.includes('192.168');

// USANDO CONFIGURAÇÃO REAL DO FIREBASE
const config = firebaseConfig;

const isNetlify = window.location.hostname.includes('netlify.app') || 
                  window.location.hostname.includes('netlify.com');

if (isNetlify) {
    console.log('🚀 Executando no Netlify - usando configuração de produção');
} else if (isProduction) {
    console.log('🌐 Executando em produção');
} else {
    console.log('🔧 Executando em desenvolvimento local');
}

// Exportar configuração
window.firebaseConfig = config;

console.log('🔧 Firebase config carregado para:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('✅ Usando configuração REAL do Firebase - Projeto:', config.projectId);