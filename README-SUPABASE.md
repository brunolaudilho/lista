# Configuração do Supabase - Sistema de Lista de Convidados

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase Dashboard

## 🚀 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `supabase-config.js` e substitua as seguintes variáveis:

```javascript
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANONIMA_DO_SUPABASE';
```

**Como obter essas informações:**
- Acesse seu projeto no Supabase Dashboard
- Vá em Settings > API
- Copie a `URL` e a `anon/public key`

### 2. Executar Script SQL

1. No Supabase Dashboard, vá para **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase-setup.sql`
3. Cole no editor e execute o script
4. Isso criará todas as tabelas, políticas de segurança e configurações necessárias

### 3. Configurar Autenticação (Opcional)

Para usar a autenticação do administrador com Supabase Auth:

1. No Supabase Dashboard, vá para **Authentication > Users**
2. Clique em **Add user**
3. Crie um usuário com:
   - Email: `admin@sistema.com`
   - Senha: `admin123` (ou a senha que preferir)
4. Confirme o email do usuário

## 📊 Estrutura das Tabelas

### `participants` (Participantes)
- `id`: UUID (chave primária)
- `name`: Nome do participante
- `department`: Departamento
- `is_present`: Status de presença
- `created_at`: Data de criação

### `surveys` (Pesquisas NPS)
- `id`: UUID (chave primária)
- `participant_name`: Nome do participante
- `nps_score`: Nota NPS (0-10)
- `quality_rating`: Avaliação de qualidade
- `instructor_rating`: Avaliação do instrutor
- `comments`: Comentários
- `created_at`: Data de criação

### `groups` (Grupos de Sorteio)
- `id`: UUID (chave primária)
- `name`: Nome do grupo
- `members`: Membros do grupo (JSON)
- `created_at`: Data de criação

### `system_config` (Configurações do Sistema)
- `id`: UUID (chave primária)
- `key`: Chave da configuração
- `value`: Valor da configuração
- `created_at`: Data de criação

## 🔒 Segurança (RLS - Row Level Security)

O sistema implementa políticas de segurança que:
- Permitem leitura pública dos dados
- Restringem inserção/atualização apenas para usuários autenticados
- Protegem dados sensíveis

## 🔄 Funcionalidades Implementadas

### ✅ Concluído
- [x] Conexão com Supabase
- [x] Estrutura de tabelas
- [x] Substituição do localStorage
- [x] Autenticação com Supabase Auth
- [x] Sincronização de dados

### 🔧 Recursos Disponíveis
- **Participantes**: Adicionar, remover, marcar presença
- **Pesquisas NPS**: Coletar e visualizar feedback
- **Sorteios**: Grupos e brindes
- **Autenticação**: Login de administrador
- **Backup**: Dados salvos automaticamente no Supabase

## 🌐 Deploy

### Netlify
O sistema está configurado para funcionar no Netlify. Certifique-se de:
1. Configurar as variáveis de ambiente no Netlify
2. Fazer deploy dos arquivos atualizados
3. Testar a conexão com o Supabase

### Variáveis de Ambiente (Opcional)
Para maior segurança, você pode usar variáveis de ambiente:
```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'SUA_URL_FALLBACK';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'SUA_CHAVE_FALLBACK';
```

## 🐛 Troubleshooting

### Erro de Conexão
- Verifique se a URL e chave estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique o console do navegador para erros

### Problemas de Autenticação
- Confirme se o usuário admin foi criado
- Verifique se o email está confirmado
- Teste com as credenciais corretas

### Dados não Sincronizam
- Verifique se as políticas RLS estão configuradas
- Confirme se as tabelas foram criadas corretamente
- Verifique a conexão com a internet

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs no console do navegador
2. Consulte a documentação do Supabase
3. Verifique se todas as configurações estão corretas

---

**Nota**: Este sistema mantém compatibilidade com localStorage como fallback, garantindo funcionamento mesmo sem conexão com o Supabase.