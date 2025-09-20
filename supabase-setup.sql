-- =====================================================
-- ESTRUTURA DE TABELAS PARA SUPABASE
-- Sistema de Lista de Presença - Treinamento Corporativo
-- =====================================================

-- Tabela de Participantes
CREATE TABLE IF NOT EXISTS participants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    present BOOLEAN DEFAULT FALSE,
    arrival_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    max_participants INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pesquisas de Satisfação
CREATE TABLE IF NOT EXISTS surveys (
    id BIGSERIAL PRIMARY KEY,
    participant_name VARCHAR(255),
    event_id BIGINT REFERENCES events(id),
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Grupos (para sorteio)
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    group_name VARCHAR(100) NOT NULL,
    participants TEXT[], -- Array de nomes dos participantes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Políticas para participantes (leitura pública, escrita autenticada)
CREATE POLICY "Permitir leitura pública de participantes" ON participants
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de participantes" ON participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de participantes" ON participants
    FOR UPDATE USING (true);

-- Políticas para eventos (leitura pública, escrita autenticada)
CREATE POLICY "Permitir leitura pública de eventos" ON events
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção autenticada de eventos" ON events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para pesquisas (inserção pública, leitura autenticada)
CREATE POLICY "Permitir inserção pública de pesquisas" ON surveys
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura autenticada de pesquisas" ON surveys
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para grupos (leitura pública, escrita autenticada)
CREATE POLICY "Permitir leitura pública de grupos" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção autenticada de grupos" ON groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir configurações padrão do sistema
INSERT INTO system_config (config_key, config_value, description) VALUES
('admin_password', 'admin123', 'Senha padrão do administrador'),
('app_title', 'Sistema de Presença - Treinamento Corporativo', 'Título da aplicação'),
('max_participants_per_group', '5', 'Número máximo de participantes por grupo no sorteio')
ON CONFLICT (config_key) DO NOTHING;

-- Inserir evento padrão
INSERT INTO events (title, description, event_date, start_time, end_time, location, max_participants) VALUES
('Treinamento Corporativo', 'Evento de treinamento para colaboradores', CURRENT_DATE, '09:00:00', '17:00:00', 'Auditório Principal', 100)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(name);
CREATE INDEX IF NOT EXISTS idx_participants_department ON participants(department);
CREATE INDEX IF NOT EXISTS idx_participants_present ON participants(present);
CREATE INDEX IF NOT EXISTS idx_surveys_event_id ON surveys(event_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at);
CREATE INDEX IF NOT EXISTS idx_groups_event_id ON groups(event_id);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE participants IS 'Tabela de participantes dos eventos';
COMMENT ON TABLE events IS 'Tabela de eventos e treinamentos';
COMMENT ON TABLE surveys IS 'Tabela de pesquisas de satisfação';
COMMENT ON TABLE groups IS 'Tabela de grupos formados por sorteio';
COMMENT ON TABLE system_config IS 'Tabela de configurações do sistema';

COMMENT ON COLUMN participants.present IS 'Indica se o participante está presente no evento';
COMMENT ON COLUMN participants.arrival_time IS 'Horário de chegada do participante';
COMMENT ON COLUMN surveys.nps_score IS 'Pontuação NPS de 0 a 10';
COMMENT ON COLUMN surveys.quality_rating IS 'Avaliação da qualidade de 1 a 5';
COMMENT ON COLUMN surveys.instructor_rating IS 'Avaliação do instrutor de 1 a 5';