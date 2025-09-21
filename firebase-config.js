// Configuração do Firebase para sincronização em tempo real
// Para usar no Netlify, você precisará configurar suas próprias credenciais

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

// Configuração para desenvolvimento local (opcional)
const localConfig = {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    databaseURL: "https://demo-project-default-rtdb.firebaseio.com/",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Detectar se está em produção (Netlify) ou desenvolvimento
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1' && 
                    !window.location.hostname.includes('192.168') &&
                    !window.location.hostname.includes('netlify.app') === false;

// Usar configuração apropriada
const config = isProduction ? firebaseConfig : localConfig;

// Verificar se está no Netlify especificamente
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