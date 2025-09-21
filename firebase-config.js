// Configuração do Firebase para sincronização em tempo real
// IMPORTANTE: Substitua pelas suas próprias credenciais do Firebase

// Configuração de exemplo - VOCÊ DEVE SUBSTITUIR PELAS SUAS CREDENCIAIS
const firebaseConfig = {
  // ⚠️ ATENÇÃO: Esta é uma configuração de exemplo
  // Você precisa criar seu próprio projeto no Firebase Console
  // e substituir estas credenciais pelas suas
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789",
  measurementId: "G-XXXXXXXXXX"
};

// Configuração temporária para desenvolvimento (simulação)
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

// TEMPORARIAMENTE usando configuração mock para evitar erros
// Quando você tiver suas credenciais reais, mude para: firebaseConfig
const config = mockConfig;

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
console.log('⚠️ ATENÇÃO: Usando configuração mock - configure suas credenciais reais do Firebase!');