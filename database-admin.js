// Funções de administração do banco de dados SQLite

// Exportar dados do banco
async function exportarBancoDados() {
    try {
        let dados;
        
        if (databaseService) {
            dados = await databaseService.exportData();
        } else {
            // Fallback para localStorage
            dados = {
                participantes: participantes || [],
                pesquisas: pesquisas || [],
                configuracoes: {
                    tituloEvento: localStorage.getItem('tituloEvento') || '',
                    imagemCabecalho: localStorage.getItem('imagemCabecalho') || '',
                    corTema: localStorage.getItem('corTema') || ''
                },
                exportDate: new Date().toISOString(),
                version: '3.0',
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                }
            };
        }
        
        // Adicionar estatísticas do export
        dados.estatisticas = {
            totalParticipantes: dados.participantes?.length || 0,
            totalPesquisas: dados.pesquisas?.length || 0,
            participantesPresentes: dados.participantes?.filter(p => p.presente).length || 0
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const filename = `backup_lista_convidados_${timestamp[0]}_${timestamp[1].split('.')[0]}.json`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Mostrar informações do backup
        const info = `✅ Backup exportado com sucesso!
        
📊 Estatísticas:
• ${dados.estatisticas.totalParticipantes} participantes
• ${dados.estatisticas.participantesPresentes} presentes
• ${dados.estatisticas.totalPesquisas} pesquisas
• Arquivo: ${filename}

💡 Dica: Use este arquivo para sincronizar dados entre dispositivos!`;
        
        alert(info);
        atualizarEstatisticasBanco();
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        alert('❌ Erro ao exportar dados. Tente novamente.');
    }
}

// Importar dados para o banco
async function importarBancoDados() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const dados = JSON.parse(text);
            
            // Validar estrutura do arquivo
            if (!dados.participantes && !dados.pesquisas) {
                throw new Error('Arquivo de backup inválido: estrutura não reconhecida');
            }
            
            // Mostrar informações do backup antes de importar
            const stats = dados.estatisticas || {
                totalParticipantes: dados.participantes?.length || 0,
                totalPesquisas: dados.pesquisas?.length || 0,
                participantesPresentes: dados.participantes?.filter(p => p.presente).length || 0
            };
            
            const info = `📋 Informações do Backup:
            
📊 Dados encontrados:
• ${stats.totalParticipantes} participantes
• ${stats.participantesPresentes} presentes
• ${stats.totalPesquisas} pesquisas
• Data: ${dados.exportDate ? new Date(dados.exportDate).toLocaleString('pt-BR') : 'Não informada'}
• Versão: ${dados.version || 'Anterior'}

⚠️ ATENÇÃO: Isso irá substituir todos os dados atuais!

Deseja continuar com a importação?`;
            
            if (confirm(info)) {
                if (databaseService) {
                    await databaseService.importData(dados);
                    await carregarDados();
                } else {
                    // Fallback para localStorage
                    participantes = dados.participantes || [];
                    pesquisas = dados.pesquisas || [];
                    
                    // Importar configurações se disponíveis
                    if (dados.configuracoes) {
                        if (dados.configuracoes.tituloEvento) {
                            localStorage.setItem('tituloEvento', dados.configuracoes.tituloEvento);
                        }
                        if (dados.configuracoes.imagemCabecalho) {
                            localStorage.setItem('imagemCabecalho', dados.configuracoes.imagemCabecalho);
                        }
                        if (dados.configuracoes.corTema) {
                            localStorage.setItem('corTema', dados.configuracoes.corTema);
                        }
                    }
                    
                    salvarDados();
                    atualizarListaParticipantes();
                    atualizarResultadosPesquisa();
                    atualizarIndicadorPresenca();
                    
                    // Recarregar configurações visuais
                    if (typeof carregarConfiguracoes === 'function') {
                        carregarConfiguracoes();
                    }
                }
                
                const successInfo = `✅ Dados importados com sucesso!
                
📊 Resumo da importação:
• ${stats.totalParticipantes} participantes carregados
• ${stats.participantesPresentes} marcados como presentes
• ${stats.totalPesquisas} pesquisas importadas
${dados.configuracoes ? '• Configurações do evento restauradas' : ''}

🔄 A página será atualizada automaticamente.`;
                
                alert(successInfo);
                atualizarEstatisticasBanco();
                
                // Atualizar a página para refletir todas as mudanças
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            let errorMsg = '❌ Erro ao importar dados.';
            
            if (error.message.includes('JSON')) {
                errorMsg += '\n\n🔍 Problema: Arquivo corrompido ou formato inválido.';
            } else if (error.message.includes('estrutura')) {
                errorMsg += '\n\n🔍 Problema: ' + error.message;
            } else {
                errorMsg += '\n\n🔍 Verifique se o arquivo está correto e tente novamente.';
            }
            
            alert(errorMsg);
        }
    };
    
    input.click();
}

// Limpar todos os dados do banco
async function limparBancoDados() {
    if (confirm('Isso irá apagar TODOS os dados permanentemente. Deseja continuar?')) {
        if (confirm('Tem certeza? Esta ação não pode ser desfeita!')) {
            try {
                if (databaseService) {
                    await databaseService.clearAllData();
                    await carregarDados();
                } else {
                    // Fallback para localStorage
                    participantes = [];
                    pesquisas = [];
                    localStorage.removeItem('sistemaPresenca');
                    atualizarListaParticipantes();
                    atualizarResultadosPesquisa();
                    atualizarIndicadorPresenca();
                }
                
                alert('Banco de dados limpo com sucesso!');
                atualizarEstatisticasBanco();
            } catch (error) {
                console.error('Erro ao limpar banco:', error);
                alert('Erro ao limpar banco de dados. Tente novamente.');
            }
        }
    }
}

// Otimizar banco de dados
async function otimizarBancoDados() {
    try {
        if (databaseService) {
            await databaseService.optimize();
            alert('Banco de dados otimizado com sucesso!');
            atualizarEstatisticasBanco();
        } else {
            // Para localStorage, apenas reorganizar os dados
            salvarDados();
            alert('Dados reorganizados com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao otimizar banco:', error);
        alert('Erro ao otimizar banco de dados. Tente novamente.');
    }
}

// Atualizar estatísticas do banco na interface
async function atualizarEstatisticasBanco() {
    try {
        if (databaseService) {
            const stats = await databaseService.getStats();
            
            document.getElementById('db-participants-count').textContent = stats.participantsCount;
            document.getElementById('db-surveys-count').textContent = stats.surveysCount;
            document.getElementById('db-size').textContent = `${(stats.databaseSize / 1024).toFixed(2)} KB`;
            document.getElementById('db-last-update').textContent = new Date().toLocaleString();
            document.getElementById('db-status').textContent = 'Conectado';
            document.getElementById('db-status').className = 'status-connected';
        } else {
            // Fallback para localStorage
            const dados = localStorage.getItem('sistemaPresenca');
            const size = dados ? new Blob([dados]).size : 0;
            
            document.getElementById('db-participants-count').textContent = participantes.length;
            document.getElementById('db-surveys-count').textContent = pesquisas.length;
            document.getElementById('db-size').textContent = `${(size / 1024).toFixed(2)} KB`;
            document.getElementById('db-last-update').textContent = new Date().toLocaleString();
            document.getElementById('db-status').textContent = 'LocalStorage';
            document.getElementById('db-status').className = 'status-fallback';
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        document.getElementById('db-status').textContent = 'Erro';
        document.getElementById('db-status').className = 'status-error';
    }
}

// Inicializar estatísticas quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que o banco foi inicializado
    setTimeout(atualizarEstatisticasBanco, 1000);
});


// Visualizar dados do banco
async function visualizarDadosBanco() {
    try {
        let dados = {};
        
        if (databaseService) {
            // Buscar dados do SQLite
            dados = await databaseService.exportData();
        } else {
            // Fallback para localStorage
            dados = {
                participantes: participantes,
                pesquisas: pesquisas,
                exportDate: new Date().toISOString()
            };
        }
        
        // Criar modal para exibir os dados
        const modal = document.createElement('div');
        modal.className = 'modal database-viewer-modal';
        modal.innerHTML = `
            <div class="modal-content database-viewer">
                <div class="modal-header">
                    <h3><i class="fas fa-database"></i> Visualizador do Banco de Dados</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="database-tabs">
                        <button class="tab-btn active" onclick="showDatabaseTab('participantes')">
                            <i class="fas fa-users"></i> Participantes (${dados.participantes?.length || 0})
                        </button>
                        <button class="tab-btn" onclick="showDatabaseTab('pesquisas')">
                            <i class="fas fa-poll"></i> Pesquisas (${dados.pesquisas?.length || 0})
                        </button>
                        <button class="tab-btn" onclick="showDatabaseTab('raw')">
                            <i class="fas fa-code"></i> Dados Brutos
                        </button>
                    </div>
                    <div class="database-content">
                        <div id="tab-participantes" class="tab-content active">
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nome</th>
                                            <th>Empresa</th>
                                            <th>Grupo</th>
                                            <th>Presente</th>
                                            <th>Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${dados.participantes?.map(p => `
                                            <tr class="${p.presente || p.present ? 'present-row' : ''}">
                                                <td>${p.id}</td>
                                                <td>${p.nome}</td>
                                                <td>${p.empresa || '-'}</td>
                                                <td>${p.grupo || '-'}</td>
                                                <td>
                                                    <span class="status-badge ${p.presente || p.present ? 'present' : 'absent'}">
                                                        ${p.presente || p.present ? 'Sim' : 'Não'}
                                                    </span>
                                                </td>
                                                <td>${p.horarioCheckin || p.arrival_time || '-'}</td>
                                            </tr>
                                        `).join('') || '<tr><td colspan="6">Nenhum participante encontrado</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="tab-pesquisas" class="tab-content">
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Participante</th>
                                            <th>NPS</th>
                                            <th>Qualidade</th>
                                            <th>Instrutor</th>
                                            <th>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${dados.pesquisas?.map(p => `
                                            <tr>
                                                <td>${p.id}</td>
                                                <td>${p.participante}</td>
                                                <td>
                                                    <span class="nps-score nps-${p.nps >= 9 ? 'promoter' : p.nps >= 7 ? 'neutral' : 'detractor'}">
                                                        ${p.nps}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="stars">
                                                        ${'★'.repeat(p.qualidade)}${'☆'.repeat(5-p.qualidade)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="stars">
                                                        ${'★'.repeat(p.instrutor)}${'☆'.repeat(5-p.instrutor)}
                                                    </div>
                                                </td>
                                                <td>${new Date(p.timestamp).toLocaleString()}</td>
                                            </tr>
                                        `).join('') || '<tr><td colspan="6">Nenhuma pesquisa encontrada</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="tab-raw" class="tab-content">
                            <div class="raw-data-container">
                                <pre><code>${JSON.stringify(dados, null, 2)}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="exportarDadosVisualizados()" class="btn-primary">
                        <i class="fas fa-download"></i> Exportar Dados
                    </button>
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao visualizar dados:', error);
        alert('Erro ao carregar dados do banco. Tente novamente.');
    }
}

// Função para alternar entre abas do visualizador
function showDatabaseTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.database-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar aba selecionada
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Exportar dados visualizados
function exportarDadosVisualizados() {
    exportarBancoDados();
}