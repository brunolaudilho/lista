# Sistema de Lista de Presença - Treinamento Corporativo

Sistema completo para gerenciamento de presença em treinamentos corporativos, com integração ao Supabase para sincronização em tempo real e interface otimizada para tablets.

## 🚀 Funcionalidades

### 📋 Lista de Presença
- Adicionar participantes com departamento
- Check-in/check-out com horário automático
- Contador de presentes em tempo real
- Sincronização automática com Supabase
- Backup local com localStorage

### 👥 Sorteio de Grupos
- Sorteio automático dos participantes presentes
- Configuração do número de grupos
- Distribuição equilibrada
- Visualização clara dos grupos formados
- Salvamento dos grupos no banco de dados

### 🎁 Sorteio de Brinde
- Sorteio aleatório entre participantes presentes
- Animação de sorteio
- Personalização do nome do brinde
- Registro do horário do sorteio

### 📊 Pesquisa de Satisfação (NPS)
- Escala NPS de 0 a 10
- Avaliação de qualidade do conteúdo (1-5 estrelas)
- Avaliação do instrutor (1-5 estrelas)
- Campo para comentários
- Cálculo automático do NPS
- Categorização (Promotores, Neutros, Detratores)
- Armazenamento seguro no Supabase

### 🔐 Área Administrativa
- Acesso protegido por senha
- Visualização de todas as pesquisas
- Relatórios detalhados de NPS
- Gestão de participantes e eventos

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
- **Sorteio de Brinde**: Sortear brindes entre presentes
- **Pesquisa de Satisfação**: Coletar feedback com NPS

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
   - Realizar Sorteio de Brinde
   - Aplicar Pesquisa de Satisfação

## 💾 Dados e Sincronização

### Armazenamento Híbrido
- **Supabase**: Sincronização em tempo real entre dispositivos
- **localStorage**: Backup local para funcionamento offline
- **Sincronização Automática**: Dados locais são enviados quando a conexão é restaurada

### Backup e Recuperação
- Dados persistem no Supabase mesmo com limpeza do cache
- Backup automático local para casos de falha de conexão
- Recuperação automática de dados ao reconectar

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

### 🎯 Versão Atual: 2.0
- ✅ Integração completa com Supabase
- ✅ Sincronização em tempo real
- ✅ Interface responsiva otimizada
- ✅ Sistema de backup híbrido
- ✅ Área administrativa completa