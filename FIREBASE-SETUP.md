# 🔥 Como Configurar o Firebase para Sincronização

## ⚠️ IMPORTANTE: Configuração Necessária

Atualmente, a aplicação está usando uma configuração **mock** (simulada) do Firebase. Para ter sincronização real entre dispositivos, você precisa configurar suas próprias credenciais do Firebase.

## 📋 Passos para Configurar o Firebase:

### 1. **Criar Projeto no Firebase**
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Escolha um nome (ex: "lista-convidados-seu-nome")
4. Siga os passos de criação

### 2. **Configurar Realtime Database**
1. No painel do projeto, vá em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (por enquanto)
4. Selecione uma localização próxima

### 3. **Obter Configurações Web**
1. No painel do projeto, clique no ícone de engrenagem ⚙️
2. Vá em "Configurações do projeto"
3. Role até "Seus aplicativos"
4. Clique em "Adicionar app" → Web (ícone `</>`)
5. Dê um nome ao app (ex: "lista-convidados-web")
6. **Copie as configurações que aparecem**

### 4. **Substituir Configurações no Código**
Abra o arquivo `firebase-config.js` e substitua:

```javascript
const firebaseConfig = {
  apiKey: "SUA-API-KEY-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};
```

E mude esta linha:
```javascript
// DE:
const config = mockConfig;

// PARA:
const config = firebaseConfig;
```

### 5. **Configurar Regras de Segurança**
No Realtime Database, vá em "Regras" e use:

```json
{
  "rules": {
    "lista_convidados": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 🚀 Após a Configuração

1. **Recarregue a página**
2. **Abra o Console do navegador** (F12)
3. **Verifique os logs** - deve aparecer "Firebase inicializado com sucesso"
4. **Teste em outro dispositivo** - os dados devem sincronizar automaticamente

## 📱 Funcionamento Atual (Modo Mock)

Enquanto não configurar o Firebase real:
- ✅ A aplicação funciona normalmente
- ✅ Dados são salvos no localStorage
- ❌ **NÃO há sincronização entre dispositivos**
- ❌ Dados ficam apenas no dispositivo local

## 🔧 Solução de Problemas

Se após configurar ainda não funcionar:
1. Verifique se as credenciais estão corretas
2. Confirme que o Realtime Database está ativo
3. Verifique as regras de segurança
4. Abra o Console para ver mensagens de erro

## 💡 Dica

Para testar rapidamente, você pode:
1. Abrir a aplicação em duas abas diferentes
2. Fazer alterações em uma aba
3. Ver se aparece na outra aba automaticamente