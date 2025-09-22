// Funções de administração do banco de dados Backendless

// Exportar dados do banco
async function exportarBancoDados() {
    try {
        if (databaseService) {
            await databaseService.exportData();
            alert('Backup exportado com sucesso!');
            atualizarEstatisticasBanco();
        } else {
            // Fallback para localStorage
            const dados = {
                participantes: participantes,
                pesquisas: pesquisas,
                exportDate: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_sistema_presenca_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Backup exportado com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        alert('Erro ao exportar dados. Tente novamente.');
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
            
            if (confirm('Isso irá substituir todos os dados atuais. Deseja continuar?')) {
                if (databaseService) {
                    await databaseService.importData(dados);
                    await carregarDados();
                } else {
                    // Fallback para localStorage
                    participantes = dados.participantes || [];
                    pesquisas = dados.pesquisas || [];
                    salvarDados();
                    atualizarListaParticipantes();
                    atualizarResultadosPesquisa();
                    atualizarIndicadorPresenca();
                }
                
                alert('Dados importados com sucesso!');
                atualizarEstatisticasBanco();
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            alert('Erro ao importar dados. Verifique se o arquivo está correto.');
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