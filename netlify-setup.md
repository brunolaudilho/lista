# Configuração para Deploy no Netlify

## 1. Configuração do Firebase

### Passo 1: Criar projeto no Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nomeie seu projeto (ex: "lista-convidados-app")
4. Configure o Google Analytics (opcional)

### Passo 2: Configurar Realtime Database
1. No console do Firebase, vá em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (para desenvolvimento)
4. Selecione a localização (preferencialmente próxima ao Brasil)

### Passo 3: Configurar Authentication
1. Vá em "Authentication" > "Sign-in method"
2. Ative "Anônimo" (Anonymous)
3. Salve as configurações

### Passo 4: Obter credenciais
1. Vá em "Configurações do projeto" (ícone de engrenagem)
2. Na aba "Geral", role até "Seus apps"
3. Clique em "Adicionar app" > "Web"
4. Registre o app com um nome
5. Copie as credenciais do Firebase

## 2. Configuração do Código

### Editar firebase-config.js
Substitua as credenciais no arquivo `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "sua-api-key-real",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## 3. Deploy no Netlify

### Passo 1: Preparar arquivos
1. Certifique-se de que todos os arquivos estão na pasta raiz
2. Verifique se `firebase-config.js` está configurado

### Passo 2: Deploy
1. Acesse [Netlify](https://www.netlify.com/)
2. Faça login ou crie uma conta
3. Arraste a pasta do projeto para o Netlify
4. Ou conecte com seu repositório Git

### Passo 3: Configurar domínio (opcional)
1. No painel do Netlify, vá em "Domain settings"
2. Configure um domínio personalizado se desejar

## 4. Regras de Segurança do Firebase

Para produção, configure regras mais restritivas no Realtime Database:

```json
{
  "rules": {
    "lista_convidados": {
      ".read": true,
      ".write": true,
      "data": {
        ".validate": "newData.hasChildren(['timestamp', 'deviceId'])"
      }
    }
  }
}
```

## 5. Teste da Sincronização

1. Abra a aplicação em diferentes dispositivos
2. Adicione participantes em um dispositivo
3. Verifique se aparece nos outros dispositivos
4. Teste a funcionalidade offline (deve usar localStorage como fallback)

## 6. Monitoramento

- Use o console do Firebase para monitorar o uso
- Verifique os logs no console do navegador
- Monitore o tráfego no painel do Netlify

## Troubleshooting

### Problema: Não sincroniza entre dispositivos
- Verifique se as credenciais do Firebase estão corretas
- Confirme se o Realtime Database está ativo
- Verifique se a autenticação anônima está habilitada

### Problema: Erro de CORS
- Adicione seu domínio do Netlify nas configurações do Firebase
- Verifique as regras de segurança do banco

### Problema: Funciona local mas não no Netlify
- Confirme se `firebase-config.js` tem as credenciais de produção
- Verifique se todos os arquivos foram enviados
- Confirme se não há referências a localhost no código