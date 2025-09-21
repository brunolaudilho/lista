# Sistema de Lista de Presença

Sistema completo para gerenciamento de presença em treinamentos corporativos, com interface otimizada para tablets e funcionalidades avançadas.

## 🚀 Funcionalidades

### Gestão de Participantes
- Adição manual de participantes
- Importação via planilha Excel (.xlsx)
- Controle de presença em tempo real
- Pesquisa e filtros avançados

### Organização por Grupos
- Criação de grupos personalizados
- Atribuição automática ou manual
- Visualização por categorias

### Recursos Administrativos
- **Painel Administrador Completo**: Interface dedicada para gestão
- **Sorteio de Brindes**: Sistema automatizado entre participantes presentes
- **Imagem de Capa**: Upload e gerenciamento de imagem personalizada do evento
- **Indicador de Presença**: Visualização em tempo real do status dos participantes
- **Pesquisa de Satisfação Integrada**: 
  - Sistema NPS (Net Promoter Score)
  - Avaliação da Qualidade do Evento
  - Avaliação do Instrutor
  - Gráficos interativos com Chart.js
- **Banco de Dados**: Gerenciamento completo de dados com backup/restore
- **Sistema de Autenticação**: Acesso seguro para administradores
- **Armazenamento Híbrido**: Local (localStorage) + Nuvem (Supabase)

### 🔄 Sincronização de Dados (NOVO v3.0)
- **Compartilhamento via URL**: Gere links com dados codificados para acesso instantâneo
- **Exportação Avançada**: Backup completo com estatísticas e configurações
- **Importação Inteligente**: Validação e preview antes de restaurar dados
- **Sincronização Multi-dispositivo**: Acesse seus dados de qualquer lugar

### Interface Otimizada
- Design responsivo para tablets
- Navegação intuitiva por abas
- Indicadores visuais de presença
- Gráficos interativos com Chart.js

## 🛠️ Como Usar

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conta no Supabase (para sincronização)
- Servidor web local (Python, WAMP, XAMPP, etc.)

### Configuração do Supabase
1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL disponível em `supabase-setup.sql`
3. Configure suas credenciais em `supabase-config.js`:
   ```javascript
   const SUPABASE_URL = 'sua-url-do-supabase'
   const SUPABASE_ANON_KEY = 'sua-chave-anonima'
   ```

### Instalação Local
1. Clone ou baixe este repositório
2. Inicie um servidor local:
   ```bash
   # Python
   python -m http.server 8000
   
   # PHP
   php -S localhost:8080
   
   # Node.js (com http-server)
   npx http-server
   ```
3. Acesse http://localhost:8000 no navegador

### Uso no Tablet
1. Conecte o tablet na mesma rede do servidor
2. Acesse o IP do servidor (ex: http://192.168.1.100:8000)
3. O sistema é totalmente responsivo para tablets

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **participants**: Participantes e status de presença
- **events**: Eventos e treinamentos
- **surveys**: Pesquisas de satisfação com NPS
- **groups**: Grupos formados por sorteio
- **system_config**: Configurações do sistema

### Recursos de Segurança
- Row Level Security (RLS) habilitado
- Políticas de acesso configuradas
- Validação de dados no frontend e backend

## 📱 Interface

### Navegação
- **Lista de Presença**: Gerenciar participantes e presenças
- **Sorteio de Grupos**: Formar grupos aleatórios
- **Painel Administrador**: Acesso completo às funcionalidades administrativas
  - **1ª Seção - Sorteio de Brinde**: Sortear brindes entre participantes presentes
  - **2ª Seção - Imagem de Capa**: Upload e gerenciamento da imagem do evento
  - **3ª Seção - Indicador de Presença**: Visualização em tempo real dos participantes
  - **4ª Seção - Resultados da Pesquisa**: Análise completa de satisfação
    - Distribuição NPS com gráfico interativo
    - Avaliação da Qualidade do Evento
    - Avaliação do Instrutor
    - Respostas detalhadas dos participantes
  - **5ª Seção - Banco de Dados**: Backup, restore e gerenciamento de dados
    - **Compartilhar Dados**: Gera link com QR Code para acesso instantâneo
    - **Exportar Dados**: Backup completo com estatísticas detalhadas
    - **Importar Dados**: Restauração com validação e preview
    - **Visualizar Dados**: Interface para explorar o banco
    - **Limpar Dados**: Limpeza seletiva ou completa
    - **Otimizar Dados**: Manutenção e performance

### Recursos Especiais
- Design responsivo otimizado para tablets
- Persistência de dados local (localStorage)
- Animações e feedback visual
- Interface intuitiva e moderna

## 🎯 Fluxo de Uso Recomendado

1. **Antes do Treinamento**:
   - Adicionar todos os participantes na Lista de Presença

2. **Durante o Treinamento**:
   - Fazer check-in dos participantes conforme chegam
   - Usar Sorteio de Grupos para atividades em equipe

3. **Final do Treinamento**:
   - Acessar o Painel Administrador
   - Realizar Sorteio de Brinde
   - Aplicar Pesquisa de Satisfação (NPS + Qualidade + Instrutor)
   - Fazer backup dos dados

4. **Sincronização Multi-dispositivo (NOVO v3.0)**:
   - **Opção 1 - Compartilhamento Rápido**: Use "Compartilhar Dados" para gerar link com QR Code
   - **Opção 2 - Backup Completo**: Exporte dados e importe em outro dispositivo
   - **Acesso Remoto**: Acesse dados de qualquer dispositivo via link compartilhado

## 💾 Dados e Sincronização

### Armazenamento Híbrido
- **Supabase**: Sincronização em tempo real entre dispositivos
- **localStorage**: Backup local para funcionamento offline
- **Sincronização Automática**: Dados locais são enviados quando a conexão é restaurada

### 🔄 Novas Funcionalidades de Sincronização (v3.0)

#### Compartilhamento via URL
- **Link Instantâneo**: Gera URL com dados codificados em Base64
- **QR Code Automático**: Escaneie para acesso rápido no celular/tablet
- **Acesso Imediato**: Dados carregam automaticamente ao acessar o link
- **Segurança**: Dados ficam apenas na URL, sem armazenamento externo

#### Exportação Avançada
- **Backup Completo**: Inclui participantes, pesquisas e configurações
- **Estatísticas Detalhadas**: Resumo dos dados exportados
- **Metadados**: Data, versão e informações do dispositivo
- **Formato JSON**: Arquivo legível e compatível

#### Importação Inteligente
- **Validação Prévia**: Verifica integridade antes de importar
- **Preview Detalhado**: Mostra estatísticas do backup
- **Configurações Incluídas**: Restaura tema, título e imagens
- **Atualização Automática**: Recarrega interface após importação

### Backup e Recuperação
- Dados persistem no Supabase mesmo com limpeza do cache
- Backup automático local para casos de falha de conexão
- Recuperação automática de dados ao reconectar
- **NOVO**: Múltiplas opções de sincronização entre dispositivos

## 🔧 Arquivos do Projeto

### Arquivos Principais
- `index.html` - Interface principal da aplicação
- `script.js` - Lógica JavaScript e interações
- `styles.css` - Estilos CSS responsivos
- `supabase-config.js` - Configuração do Supabase
- `supabase-service.js` - Serviços de banco de dados
- `supabase-setup.sql` - Script de criação das tabelas

### Documentação
- `README.md` - Este arquivo
- `README-SUPABASE.md` - Guia detalhado do Supabase

## 🚀 Deploy e Produção

### Opções de Deploy
1. **GitHub Pages** (apenas frontend)
2. **Vercel/Netlify** (recomendado)
3. **Servidor próprio** (Apache/Nginx)

### Configuração para Produção
1. Configure as variáveis de ambiente do Supabase
2. Ative HTTPS para segurança
3. Configure domínio personalizado
4. Monitore logs e performance

## 📊 Relatório NPS

O sistema calcula automaticamente:
- **NPS Score**: Fórmula (% Promotores - % Detratores)
- **Promotores**: Notas 9-10
- **Neutros**: Notas 7-8  
- **Detratores**: Notas 0-6

### Interpretação do NPS:
- **70 a 100**: Excelente
- **50 a 69**: Bom
- **0 a 49**: Regular
- **Abaixo de 0**: Precisa melhorar

## 🌐 Compatibilidade

- ✅ Chrome, Firefox, Safari, Edge (versões recentes)
- ✅ Tablets Android e iOS
- ✅ Dispositivos touch e desktop
- ✅ Resolução mínima: 768px
- ✅ Funciona offline com localStorage
- ✅ Sincronização automática quando online

## 🔧 Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos responsivos e animações
- **JavaScript ES6+** - Lógica da aplicação
- **LocalStorage** - Armazenamento local

### Backend
- **Supabase** - Banco de dados PostgreSQL
- **Row Level Security** - Segurança de dados
- **Real-time subscriptions** - Sincronização em tempo real

### Ferramentas
- **Git** - Controle de versão
- **GitHub** - Repositório e colaboração
- **Python HTTP Server** - Servidor de desenvolvimento

## 📈 Métricas e Analytics

### Dados Coletados
- Número de participantes por evento
- Taxa de presença
- Scores de NPS e satisfação
- Tempo de permanência
- Feedback qualitativo

### Relatórios Disponíveis
- Dashboard de presença em tempo real
- Análise de NPS com categorização
- Histórico de eventos
- Estatísticas de participação

## 🤝 Contribuição

### Como Contribuir
1. Fork este repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código
- Use JavaScript ES6+
- Mantenha o código comentado
- Siga as convenções de nomenclatura
- Teste em diferentes dispositivos

## 📞 Suporte e Contato

### Documentação
- Consulte `README-SUPABASE.md` para configuração detalhada
- Verifique os comentários no código para entender a lógica
- Use o console do navegador para debug

### Problemas Conhecidos
- Primeira conexão com Supabase pode ser lenta
- Cache do navegador pode causar problemas após atualizações
- Alguns tablets antigos podem ter performance reduzida

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar seus treinamentos corporativos!**

### 🎯 Versão Atual: 3.0
- ✅ **Painel Administrador Reorganizado**: Nova estrutura com 5 seções organizadas
- ✅ **Pesquisa de Satisfação Completa**: NPS + Qualidade + Avaliação do Instrutor
- ✅ **Interface Aprimorada**: Seções numeradas e organizadas logicamente
- ✅ **Gráficos Interativos**: Chart.js para visualização de dados
- ✅ **Correções de Bugs**: Problemas de compatibilidade de IDs resolvidos
- ✅ Integração completa com Supabase
- ✅ Sincronização em tempo real
- ✅ Interface responsiva otimizada
- ✅ Sistema de backup híbrido