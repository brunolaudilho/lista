# 📋 Sistema de Presença - Treinamento Corporativo

Um sistema completo para gerenciar listas de presença em treinamentos corporativos, com funcionalidades de sorteio de grupos e pesquisa de satisfação.

## 🚀 Funcionalidades

- **Lista de Presença**: Controle de participantes com check-in/check-out
- **Sorteio de Grupos**: Divisão automática de participantes em grupos
- **Pesquisa de Satisfação**: Coleta de feedback dos participantes
- **Painel Administrativo**: Gerenciamento completo do sistema
- **Sincronização em Tempo Real**: Dados compartilhados entre dispositivos
- **Exportação de Dados**: Backup em formato JSON e Excel

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Backendless (BaaS - Backend as a Service)
- **Hospedagem**: Netlify
- **Controle de Versão**: Git/GitHub

## 🌐 Deploy

### GitHub
1. Faça fork ou clone este repositório
2. Configure suas credenciais do Backendless no arquivo `backendless-config.js`
3. Commit e push para seu repositório

### Netlify
1. Conecte sua conta do Netlify ao GitHub
2. Selecione este repositório
3. Configure as seguintes opções:
   - **Build command**: `echo 'Site estático'`
   - **Publish directory**: `.` (raiz do projeto)
4. Deploy automático será feito a cada push

### Configuração do Backendless
1. Crie uma conta gratuita em [Backendless.com](https://backendless.com)
2. Crie um novo app
3. Copie o `Application ID` e `JS API Key`
4. Substitua as credenciais no arquivo `backendless-config.js`:
   ```javascript
   const BACKENDLESS_CONFIG = {
       APP_ID: 'SEU_APP_ID_AQUI',
       API_KEY: 'SUA_API_KEY_AQUI'
   };
   ```

## 📱 Como Usar

### Para Participantes
1. Acesse o sistema pelo link fornecido
2. Clique em "Marcar Presença" e informe seus dados
3. Participe dos sorteios de grupos quando solicitado
4. Responda à pesquisa de satisfação ao final

### Para Administradores
1. Clique no botão "Administrador"
2. Digite a senha (padrão: `admin123`)
3. Gerencie participantes, grupos e configurações
4. Exporte relatórios e dados

## 🔧 Configurações

### Senha do Administrador
A senha padrão é `admin123`. Para alterá-la:
1. Acesse o painel administrativo
2. Vá em "Configurações"
3. Altere a senha na seção "Segurança"

### Personalização
- **Logo/Imagem**: Substitua a URL da imagem no painel administrativo
- **Cores**: Edite o arquivo `styles.css`
- **Textos**: Modifique diretamente no `index.html`

## 📊 Limites do Plano Gratuito

### Backendless (Gratuito)
- 25.000 chamadas de API por mês
- 1 GB de armazenamento
- Sincronização em tempo real
- Backup automático

### Netlify (Gratuito)
- 100 GB de largura de banda por mês
- Deploy automático via Git
- HTTPS gratuito
- Domínio personalizado

## 🔒 Segurança

- Dados criptografados em trânsito (HTTPS)
- Autenticação de administrador
- Validação de dados no frontend
- Headers de segurança configurados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação do [Backendless](https://backendless.com/docs/)
2. Consulte a documentação do [Netlify](https://docs.netlify.com/)
3. Abra uma issue neste repositório

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de treinamentos corporativos**