// Configuração do Firebase para sincronização em tempo real
// IMPORTANTE: Substitua pelas suas próprias credenciais do Firebase

// Configuração de exemplo - VOCÊ DEVE SUBSTITUIR PELAS SUAS CREDENCIAIS
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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