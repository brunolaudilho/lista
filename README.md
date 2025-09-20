# Sistema de Lista de Presença - Treinamento Corporativo

Sistema completo para gerenciamento de presença em treinamentos corporativos, otimizado para tablets e com servidor local.

## 🚀 Funcionalidades

### 📋 Lista de Presença
- Adicionar participantes
- Check-in/check-out com horário
- Contador de presentes em tempo real
- Persistência de dados no navegador

### 👥 Sorteio de Grupos
- Sorteio automático dos participantes presentes
- Configuração do número de grupos
- Distribuição equilibrada
- Visualização clara dos grupos formados

### 🎁 Sorteio de Brinde
- Sorteio aleatório entre participantes presentes
- Animação de sorteio
- Personalização do nome do brinde
- Registro do horário do sorteio

### 📊 Pesquisa de Satisfação (NPS)
- Escala NPS de 0 a 10
- Avaliação de qualidade do conteúdo
- Avaliação do instrutor
- Campo para comentários
- Cálculo automático do NPS
- Categorização (Promotores, Neutros, Detratores)

## 🛠️ Como Usar

### Pré-requisitos
- PHP 7.4 ou superior
- Navegador moderno
- Tablet ou computador

### Instalação
1. Coloque os arquivos na pasta do seu servidor web (WAMP, XAMPP, etc.)
2. Inicie o servidor PHP:
   ```bash
   php -S localhost:8080
   ```
3. Acesse http://localhost:8080 no navegador

### Uso no Tablet
1. Conecte o tablet na mesma rede do notebook/servidor
2. Acesse o IP do servidor (ex: http://192.168.1.100:8080)
3. O sistema é totalmente responsivo para tablets

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

## 💾 Dados

Os dados são salvos automaticamente no navegador (localStorage). Para backup:
- Os dados persistem enquanto não limpar o cache do navegador
- Para exportar dados, use as funções JavaScript disponíveis no console

## 🔧 Personalização

### Cores e Estilo
Edite o arquivo `styles.css` para personalizar:
- Cores do tema
- Tamanhos de fonte
- Espaçamentos
- Animações

### Funcionalidades
Edite o arquivo `script.js` para:
- Adicionar novos campos
- Modificar lógica de sorteios
- Personalizar cálculos do NPS

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

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Tablets Android e iOS
- ✅ Dispositivos touch
- ✅ Resolução mínima: 768px

## 📞 Suporte

Sistema desenvolvido para treinamentos corporativos. Interface simples e intuitiva para facilitar o uso por instrutores e participantes.

---

**Desenvolvido com ❤️ para facilitar seus treinamentos corporativos!**