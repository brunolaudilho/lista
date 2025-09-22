# 🚀 Guia de Deploy - GitHub e Netlify

Este guia detalha como fazer o deploy do Sistema de Presença no GitHub e Netlify.

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://netlify.com)
- Conta no [Backendless](https://backendless.com) (gratuita)
- Git instalado localmente

## 🔧 Configuração do Backendless

### 1. Criar Conta e App
1. Acesse [Backendless.com](https://backendless.com)
2. Crie uma conta gratuita
3. Clique em "Create New App"
4. Escolha um nome para seu app
5. Selecione o plano "Cloud 99" (gratuito)

### 2. Obter Credenciais
1. No dashboard do seu app, vá para "Manage" → "App Settings"
2. Copie o **Application ID**
3. Vá para "Manage" → "API Keys"
4. Copie a **JS API Key**

### 3. Configurar no Projeto
Edite o arquivo `backendless-config.js`:
```javascript
const BACKENDLESS_CONFIG = {
    APP_ID: 'SEU_APPLICATION_ID_AQUI',
    API_KEY: 'SUA_JS_API_KEY_AQUI'
};
```

## 📂 Deploy no GitHub

### 1. Preparar Repositório Local
```bash
# Navegar para a pasta do projeto
cd C:\wamp64\www\Lista_convidados

# Inicializar Git (se não foi feito)
git init

# Adicionar arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit - Sistema de Presença"
```

### 2. Criar Repositório no GitHub
1. Acesse [GitHub.com](https://github.com)
2. Clique em "New repository"
3. Nome sugerido: `sistema-presenca-treinamento`
4. Deixe como público
5. NÃO inicialize com README (já temos um)
6. Clique em "Create repository"

### 3. Conectar e Enviar
```bash
# Adicionar origem remota
git remote add origin https://github.com/SEU_USUARIO/sistema-presenca-treinamento.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

## 🌐 Deploy no Netlify

### Método 1: Deploy via GitHub (Recomendado)

#### 1. Conectar GitHub ao Netlify
1. Acesse [Netlify.com](https://netlify.com)
2. Faça login ou crie uma conta
3. Clique em "New site from Git"
4. Escolha "GitHub"
5. Autorize o Netlify a acessar seus repositórios

#### 2. Configurar Deploy
1. Selecione o repositório `sistema-presenca-treinamento`
2. Configure as opções:
   - **Branch to deploy**: `main`
   - **Build command**: `echo 'Site estático'`
   - **Publish directory**: `.` (ponto - raiz do projeto)
3. Clique em "Deploy site"

#### 3. Configurar Domínio (Opcional)
1. Após o deploy, clique em "Domain settings"
2. Clique em "Change site name"
3. Escolha um nome personalizado (ex: `meu-sistema-presenca`)
4. Seu site ficará em: `https://meu-sistema-presenca.netlify.app`

### Método 2: Deploy Manual

#### 1. Preparar Arquivos
1. Compacte todos os arquivos do projeto em um ZIP
2. Certifique-se de incluir todos os arquivos necessários

#### 2. Upload Manual
1. No Netlify, clique em "Sites"
2. Arraste o arquivo ZIP para a área "Want to deploy a new site without connecting to Git?"
3. Aguarde o upload e deploy

## ⚙️ Configurações Avançadas

### Headers de Segurança
O arquivo `netlify.toml` já está configurado com:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### Redirecionamentos
O arquivo `_redirects` está configurado para SPA:
```
/*    /index.html   200
```

### Variáveis de Ambiente (Opcional)
Para maior segurança, você pode usar variáveis de ambiente:

1. No Netlify, vá em "Site settings" → "Environment variables"
2. Adicione:
   - `BACKENDLESS_APP_ID`: Seu Application ID
   - `BACKENDLESS_API_KEY`: Sua JS API Key

3. Modifique `backendless-config.js`:
```javascript
const BACKENDLESS_CONFIG = {
    APP_ID: process.env.BACKENDLESS_APP_ID || 'fallback-app-id',
    API_KEY: process.env.BACKENDLESS_API_KEY || 'fallback-api-key'
};
```

## 🔄 Deploy Automático

### Configurar Webhook (GitHub → Netlify)
1. No Netlify, vá em "Site settings" → "Build & deploy"
2. Em "Build hooks", clique em "Add build hook"
3. Nome: "Deploy automático"
4. Branch: `main`
5. Copie a URL gerada

6. No GitHub, vá em "Settings" → "Webhooks"
7. Clique em "Add webhook"
8. Cole a URL do Netlify
9. Selecione "Just the push event"
10. Clique em "Add webhook"

### Fluxo de Trabalho
Agora, sempre que você fizer push para o GitHub:
```bash
git add .
git commit -m "Atualização do sistema"
git push origin main
```
O Netlify fará deploy automaticamente!

## 🧪 Teste do Deploy

### 1. Verificar Funcionalidades
- [ ] Sistema carrega corretamente
- [ ] Backendless conecta (verificar console do navegador)
- [ ] Adicionar participante funciona
- [ ] Marcar presença funciona
- [ ] Painel administrativo abre
- [ ] Exportação de dados funciona

### 2. Teste em Dispositivos
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Tablet (Android, iOS)
- [ ] Mobile (responsividade)

### 3. Performance
- [ ] Carregamento rápido (< 3 segundos)
- [ ] Sem erros no console
- [ ] Funciona offline (localStorage)

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro de CORS
**Problema**: Erro de CORS ao conectar com Backendless
**Solução**: Verificar se o domínio está configurado no Backendless:
1. Backendless Console → "Manage" → "App Settings"
2. Em "Domain", adicionar seu domínio Netlify

#### 2. Arquivos não encontrados
**Problema**: 404 em arquivos CSS/JS
**Solução**: Verificar caminhos relativos nos arquivos HTML

#### 3. Deploy falha
**Problema**: Build falha no Netlify
**Solução**: Verificar logs de build e corrigir erros

#### 4. Dados não salvam
**Problema**: Dados não persistem no Backendless
**Solução**: 
1. Verificar credenciais no `backendless-config.js`
2. Verificar console do navegador para erros de API
3. Verificar se as tabelas foram criadas no Backendless

## 📊 Monitoramento

### Netlify Analytics
1. Ative o Netlify Analytics (pago)
2. Monitore:
   - Visitantes únicos
   - Page views
   - Bandwidth usage

### Backendless Analytics
1. No console do Backendless, vá em "Analytics"
2. Monitore:
   - API calls
   - Data storage
   - Real-time connections

## 🔒 Segurança

### Checklist de Segurança
- [ ] HTTPS habilitado (automático no Netlify)
- [ ] Headers de segurança configurados
- [ ] Credenciais não expostas no código
- [ ] Validação de dados no frontend
- [ ] Senha de administrador alterada

### Backup
- [ ] Dados importantes exportados regularmente
- [ ] Código versionado no GitHub
- [ ] Configurações documentadas

## 📞 Suporte

### Links Úteis
- [Documentação Netlify](https://docs.netlify.com/)
- [Documentação Backendless](https://backendless.com/docs/)
- [GitHub Docs](https://docs.github.com/)

### Contato
Para problemas específicos deste projeto, abra uma issue no GitHub.

---

**✅ Deploy concluído com sucesso!**

Seu sistema estará disponível em: `https://seu-site.netlify.app`