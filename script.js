// Dados globais
let participantes = [];
let pesquisas = [];
let npsChart = null;
let qualidadeChart = null;
let instrutorChart = null;
let databaseService;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar o banco de dados estar pronto
    window.addEventListener('databaseReady', () => {
        console.log('🎯 Banco de dados pronto, iniciando aplicação...');
        inicializarAplicacao();
    });
    
    // Função assíncrona para inicialização
    async function inicializarAplicacao() {
        try {
            console.log('🚀 Inicializando aplicação...');
            
            // Carregar dados
            await carregarDados();
            
            // Verificar login admin
            await verificarLoginAdmin();
            
            // Configurar módulos
            configurarNPS();
            configurarFormularioPesquisa();
            
            // Configurar eventos de teclado
            const nomeInput = document.getElementById('nome-participante');
            const deptoInput = document.getElementById('depto-participante');
            
            if (nomeInput) {
                nomeInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        adicionarParticipante();
                    }
                });
            }
            
            if (deptoInput) {
                deptoInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        adicionarParticipante();
                    }
                });
            }
            
            // Configurar upload de imagem
            configurarUploadImagem();
            
            // Carregar imagem do cabeçalho se existir
            carregarImagemCapa();
            
            // Escutar mudanças no localStorage (outras abas)
            window.addEventListener('storage', function(e) {
                if (e.key === 'sistemaPresenca' && e.newValue) {
                    console.log('🔄 Dados atualizados em outra aba');
                    const dados = JSON.parse(e.newValue);
                    if (dados.participantes) {
                        participantes = dados.participantes;
                        atualizarListaParticipantes();
                        atualizarIndicadorPresenca();
                        console.log('✅ Interface sincronizada com outra aba');
                    }
                }
            });
            
            console.log('✅ Aplicação inicializada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }
});

// Função para carregar dados do SQLite
async function carregarDados() {
    try {
        if (window.databaseService && !window.databaseService.isLocalStorage) {
            console.log('📊 Carregando dados do SQLite...');
            
            // Carregar participantes (método correto é getParticipants, não getAllParticipants)
            participantes = await window.databaseService.getParticipants();
            console.log('Participantes carregados do SQLite:', participantes.length);
            
            // Carregar pesquisas (se houver método disponível)
            if (typeof window.databaseService.getAllSurveys === 'function') {
                pesquisas = await window.databaseService.getAllSurveys();
                console.log('Pesquisas carregadas do SQLite:', pesquisas.length);
            } else {
                // Carregar pesquisas do localStorage como fallback
                const dadosLocal = localStorage.getItem('sistemaPresenca');
                if (dadosLocal) {
                    const dados = JSON.parse(dadosLocal);
                    pesquisas = dados.pesquisas || [];
                }
            }
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarResultadosPesquisa();
            atualizarIndicadorPresenca();
            
        } else {
            console.log('📂 Usando fallback localStorage');
            carregarDadosLocal();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados do SQLite:', error);
        // Fallback para localStorage
        carregarDadosLocal();
    }
}

// Função de fallback para carregar dados do localStorage
function carregarDadosLocal() {
    try {
        const dados = localStorage.getItem('sistemaPresenca');
        if (dados) {
            const dadosParseados = JSON.parse(dados);
            participantes = dadosParseados.participantes || [];
            pesquisas = dadosParseados.pesquisas || [];
            
            console.log('Dados carregados do localStorage (fallback)');
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarResultadosPesquisa();
            atualizarIndicadorPresenca();
        }
    } catch (error) {
        console.error('Erro ao carregar dados do localStorage:', error);
        participantes = [];
        pesquisas = [];
    }
}

// Navegação entre módulos
function showModule(moduleId) {
    // Esconder todos os módulos
    const modules = document.querySelectorAll('.module');
    modules.forEach(module => module.classList.remove('active'));
    
    // Remover classe active dos botões
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar módulo selecionado
    document.getElementById(moduleId).classList.add('active');
    
    // Ativar botão correspondente
    event.target.classList.add('active');
}

// === MÓDULO LISTA DE PRESENÇA ===

async function adicionarParticipante() {
    const nomeInput = document.getElementById('nome-participante');
    const deptoInput = document.getElementById('depto-participante');
    const nome = nomeInput.value.trim();
    const depto = deptoInput.value.trim();
    
    if (nome === '') {
        alert('Por favor, digite o nome do participante.');
        return;
    }
    
    // Verificar se já existe
    if (participantes.find(p => p.nome?.toLowerCase() === nome.toLowerCase() || p.name?.toLowerCase() === nome.toLowerCase())) {
        alert('Este participante já está na lista.');
        return;
    }
    
    try {
        if (window.databaseService && !window.databaseService.isLocalStorage) {
            // Usar SQLite
            const novoParticipante = await window.databaseService.addParticipant(nome, depto);
            participantes.push(novoParticipante);
        } else {
            // Fallback para localStorage
            const participante = {
                id: Date.now(),
                nome: nome,
                departamento: depto || 'Não informado',
                presente: false,
                horarioCheckIn: null
            };
            
            participantes.push(participante);
            salvarDados();
        }
        
        nomeInput.value = '';
        deptoInput.value = '';
        
        atualizarListaParticipantes();
        atualizarIndicadorPresenca();
        
    } catch (error) {
        console.error('Erro ao adicionar participante:', error);
        alert('Erro ao adicionar participante. Tente novamente.');
    }
}

async function togglePresenca(id) {
    const participante = participantes.find(p => p.id === id);
    if (participante) {
        const novoStatus = !participante.presente;
        
        try {
            // Atualizar dados locais
            participante.presente = novoStatus;
            participante.horarioCheckIn = novoStatus ? new Date().toLocaleTimeString() : null;
            
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            salvarDados();
            
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
            alert('Erro ao atualizar presença. Tente novamente.');
        }
    }
}

async function removerParticipante(id) {
    if (confirm('Tem certeza que deseja remover este participante?')) {
        try {
            console.log(`🔄 Iniciando remoção do participante ${id}...`);
            
            // Verificar se existe na lista local antes de remover
            const participanteLocal = participantes.find(p => p.id === id);
            if (participanteLocal) {
                console.log(`📋 Participante encontrado na lista local:`, participanteLocal);
                
                // Remover dos dados locais
                const tamanhoAntes = participantes.length;
                participantes = participantes.filter(p => p.id !== id);
                const tamanhoDepois = participantes.length;
                
                console.log(`📊 Lista local: ${tamanhoAntes} → ${tamanhoDepois} participantes`);
                
                if (tamanhoAntes === tamanhoDepois) {
                    console.warn(`⚠️ PROBLEMA: Participante ${id} não foi removido da lista local!`);
                } else {
                    console.log(`✅ Participante ${id} removido da lista local com sucesso`);
                }
            } else {
                console.warn(`⚠️ Participante ${id} não encontrado na lista local`);
            }
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
            salvarDados();
            
            console.log(`✅ Processo de remoção do participante ${id} concluído`);
            
        } catch (error) {
            console.error(`💥 Erro ao remover participante ${id}:`, error);
            alert('Erro ao remover participante. Tente novamente.');
        }
    }
}

function atualizarListaParticipantes() {
    const lista = document.getElementById('lista-participantes');
    const totalElement = document.getElementById('total-participantes');
    const presentesElement = document.getElementById('presentes');
    
    // Verificar se os elementos existem antes de usar
    if (!lista || !totalElement || !presentesElement) {
        console.warn('⚠️ Elementos DOM não encontrados para atualizar lista de participantes');
        return;
    }
    
    const presentes = participantes.filter(p => p.presente).length;
    
    totalElement.textContent = `Total: ${participantes.length}`;
    presentesElement.textContent = `Presentes: ${presentes}`;
    
    lista.innerHTML = '';
    
    participantes.forEach(participante => {
        const div = document.createElement('div');
        div.className = `participant-item ${participante.presente ? 'present' : ''}`;
        
        div.innerHTML = `
            <div class="participant-info">
                <span class="participant-name">${participante.nome}</span>
                <span class="participant-dept">${participante.departamento}</span>
                ${participante.horarioCheckIn ? `<span class="checkin-time">Check-in: ${participante.horarioCheckIn}</span>` : ''}
            </div>
            <div class="participant-actions">
                <button class="presence-btn ${participante.presente ? 'present' : ''}" 
                        onclick="togglePresenca(${participante.id})">
                    <i class="fas ${participante.presente ? 'fa-check-circle' : 'fa-user-plus'}"></i>
                    ${participante.presente ? 'Presente' : 'Marcar Presente'}
                </button>
                <button class="remove-btn" onclick="removerParticipante(${participante.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        lista.appendChild(div);
    });
}

// === MÓDULO SORTEIO DE GRUPOS ===

function sortearGrupos() {
    const participantesPresentes = participantes.filter(p => p.presente);
    
    if (participantesPresentes.length < 2) {
        alert('É necessário ter pelo menos 2 participantes presentes para formar grupos.');
        return;
    }
    
    const numGrupos = parseInt(document.getElementById('num-grupos').value);
    const pessoasPorGrupo = parseInt(document.getElementById('pessoas-por-grupo').value);
    
    // Calcular quantas pessoas serão sorteadas
    const totalPessoasSorteadas = numGrupos * pessoasPorGrupo;
    
    if (totalPessoasSorteadas > participantesPresentes.length) {
        alert(`Não há participantes suficientes. Você precisa de ${totalPessoasSorteadas} pessoas (${numGrupos} grupos × ${pessoasPorGrupo} pessoas), mas há apenas ${participantesPresentes.length} presentes.`);
        return;
    }
    
    // Mostrar informações do sorteio
    exibirInfoGrupos(participantesPresentes.length, totalPessoasSorteadas, numGrupos, pessoasPorGrupo);
    
    // Embaralhar participantes e selecionar apenas os necessários
    const participantesEmbaralhados = [...participantesPresentes].sort(() => Math.random() - 0.5);
    const participantesSelecionados = participantesEmbaralhados.slice(0, totalPessoasSorteadas);
    
    // Dividir em grupos com número fixo de pessoas
    const grupos = [];
    
    for (let i = 0; i < numGrupos; i++) {
        const grupo = [];
        const inicioGrupo = i * pessoasPorGrupo;
        
        for (let j = 0; j < pessoasPorGrupo; j++) {
            grupo.push(participantesSelecionados[inicioGrupo + j]);
        }
        
        grupos.push(grupo);
    }
    
    exibirResultadoGrupos(grupos);
}

function exibirInfoGrupos(totalPresentes, totalSorteados, numGrupos, pessoasPorGrupo) {
    const infoDiv = document.getElementById('info-grupos');
    const naoSorteados = totalPresentes - totalSorteados;
    
    let html = `
        <div class="group-info-card">
            <h4><i class="fas fa-info-circle"></i> Informações do Sorteio</h4>
            <div class="info-stats">
                <div class="stat-item">
                    <span class="stat-number">${totalPresentes}</span>
                    <span class="stat-label">Presentes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalSorteados}</span>
                    <span class="stat-label">Sorteados</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${numGrupos}</span>
                    <span class="stat-label">Grupos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${pessoasPorGrupo}</span>
                    <span class="stat-label">Por Grupo</span>
                </div>
            </div>`;
    
    if (naoSorteados > 0) {
        html += `
            <div class="info-alert">
                <i class="fas fa-exclamation-triangle"></i>
                ${naoSorteados} pessoa(s) não participará(ão) da dinâmica
            </div>`;
    }
    
    html += '</div>';
    
    infoDiv.innerHTML = html;
}

function exibirResultadoGrupos(grupos) {
    const resultado = document.getElementById('resultado-grupos');
    
    let html = '<div class="groups-display">';
    
    grupos.forEach((grupo, index) => {
        html += `
            <div class="group-card">
                <h3><i class="fas fa-users"></i> Grupo ${index + 1}</h3>
                <ul class="group-members">
                    ${grupo.map(p => `<li>${p.nome}</li>`).join('')}
                </ul>
                <div class="group-count">${grupo.length} participante${grupo.length > 1 ? 's' : ''}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    resultado.innerHTML = html;
}

// === MÓDULO SORTEIO DE BRINDE ===

function sortearBrinde() {
    const participantesPresentes = participantes.filter(p => p.presente);
    
    if (participantesPresentes.length === 0) {
        alert('Não há participantes presentes para o sorteio.');
        return;
    }
    
    const nomeBrinde = document.getElementById('nome-brinde').value.trim() || 'Brinde Especial';
    
    // Animação de sorteio
    const resultado = document.getElementById('resultado-brinde');
    resultado.innerHTML = '<div class="loading-animation"><i class="fas fa-spinner fa-spin"></i> Sorteando...</div>';
    
    setTimeout(() => {
        const vencedor = participantesPresentes[Math.floor(Math.random() * participantesPresentes.length)];
        
        resultado.innerHTML = `
            <div class="prize-winner">
                <div class="winner-animation">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3>🎉 Parabéns! 🎉</h3>
                <div class="winner-name">${vencedor.nome}</div>
                <div class="prize-name">ganhou: ${nomeBrinde}</div>
                <div class="winner-time">Sorteado em: ${new Date().toLocaleString()}</div>
            </div>
        `;
    }, 2000);
}

// === MÓDULO PESQUISA DE SATISFAÇÃO ===

function configurarNPS() {
    const npsButtons = document.querySelectorAll('.nps-btn');
    
    npsButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover seleção anterior
            npsButtons.forEach(b => b.classList.remove('selected'));
            
            // Selecionar botão atual
            this.classList.add('selected');
            
            // Definir valor no campo hidden
            document.getElementById('nps-score').value = this.dataset.value;
        });
    });
}

function configurarFormularioPesquisa() {
    const form = document.getElementById('form-pesquisa');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const npsScore = document.getElementById('nps-score').value;
        
        if (!npsScore) {
            alert('Por favor, selecione uma nota de 0 a 10 para a pergunta NPS.');
            return;
        }
        
        try {
            const pesquisa = {
                id: Date.now(),
                nps: parseInt(npsScore),
                qualidade: document.getElementById('qualidade').value,
                instrutor: document.getElementById('instrutor').value,
                comentarios: document.getElementById('comentarios').value,
                timestamp: new Date().toLocaleString()
            };
            
            pesquisas.push(pesquisa);
            
            // Resetar formulário
            form.reset();
            document.querySelectorAll('.nps-btn').forEach(btn => btn.classList.remove('selected'));
            
            // Atualizar resultados
            atualizarResultadosPesquisa();
            salvarDados();
            
            alert('Pesquisa enviada com sucesso! Obrigado pelo seu feedback.');
            
        } catch (error) {
            console.error('Erro ao salvar pesquisa:', error);
            alert('Erro ao salvar pesquisa. Tente novamente.');
        }
    });
}

function atualizarResultadosPesquisa() {
    const totalRespostas = document.getElementById('total-respostas');
    const mediaNPS = document.getElementById('media-nps');
    const mediaQualidade = document.getElementById('media-qualidade');
    const mediaInstrutor = document.getElementById('media-instrutor');
    
    // Verificar se os elementos existem antes de usar
    if (!totalRespostas || !mediaNPS || !mediaQualidade || !mediaInstrutor) {
        console.warn('⚠️ Elementos DOM não encontrados para atualizar resultados de pesquisa');
        return;
    }
    
    if (pesquisas.length === 0) {
        totalRespostas.textContent = '0';
        mediaNPS.textContent = '0.0';
        mediaQualidade.textContent = '0.0';
        mediaInstrutor.textContent = '0.0';
        return;
    }
    
    const totalNPS = pesquisas.reduce((sum, p) => sum + p.nps, 0);
    const totalQualidade = pesquisas.reduce((sum, p) => sum + parseInt(p.qualidade), 0);
    const totalInstrutor = pesquisas.reduce((sum, p) => sum + parseInt(p.instrutor), 0);
    
    totalRespostas.textContent = pesquisas.length;
    mediaNPS.textContent = (totalNPS / pesquisas.length).toFixed(1);
    mediaQualidade.textContent = (totalQualidade / pesquisas.length).toFixed(1);
    mediaInstrutor.textContent = (totalInstrutor / pesquisas.length).toFixed(1);
    
    // Atualizar gráficos
    atualizarGraficos();
}

function atualizarGraficos() {
    criarGraficoNPS();
    criarGraficoQualidade();
    criarGraficoInstrutor();
}

function limparGraficos() {
    if (npsChart) {
        npsChart.destroy();
        npsChart = null;
    }
    if (qualidadeChart) {
        qualidadeChart.destroy();
        qualidadeChart = null;
    }
    if (instrutorChart) {
        instrutorChart.destroy();
        instrutorChart = null;
    }
}

function criarGraficoNPS() {
    const ctx = document.getElementById('nps-chart').getContext('2d');
    
    if (npsChart) {
        npsChart.destroy();
    }
    
    // Contar respostas por categoria NPS
    let detratores = 0;
    let neutros = 0;
    let promotores = 0;
    
    pesquisas.forEach(p => {
        if (p.nps <= 6) detratores++;
        else if (p.nps <= 8) neutros++;
        else promotores++;
    });
    
    npsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Detratores (0-6)', 'Neutros (7-8)', 'Promotores (9-10)'],
            datasets: [{
                data: [detratores, neutros, promotores],
                backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribuição NPS'
                }
            }
        }
    });
}

function criarGraficoQualidade() {
    const ctx = document.getElementById('qualidade-chart').getContext('2d');
    
    if (qualidadeChart) {
        qualidadeChart.destroy();
    }
    
    // Contar avaliações de qualidade
    const contadores = [0, 0, 0, 0, 0]; // 1 a 5 estrelas
    
    pesquisas.forEach(p => {
        const qualidade = parseInt(p.qualidade);
        if (qualidade >= 1 && qualidade <= 5) {
            contadores[qualidade - 1]++;
        }
    });
    
    qualidadeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
            datasets: [{
                label: 'Avaliações',
                data: contadores,
                backgroundColor: '#4ecdc4',
                borderColor: '#45b7aa',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Qualidade do Evento'
                }
            }
        }
    });
}

function criarGraficoInstrutor() {
    const ctx = document.getElementById('instrutor-chart').getContext('2d');
    
    if (instrutorChart) {
        instrutorChart.destroy();
    }
    
    // Contar avaliações do instrutor
    const contadores = [0, 0, 0, 0, 0]; // 1 a 5 estrelas
    
    pesquisas.forEach(p => {
        const instrutor = parseInt(p.instrutor);
        if (instrutor >= 1 && instrutor <= 5) {
            contadores[instrutor - 1]++;
        }
    });
    
    instrutorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
            datasets: [{
                label: 'Avaliações',
                data: contadores,
                backgroundColor: '#a29bfe',
                borderColor: '#6c5ce7',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Avaliação do Instrutor'
                }
            }
        }
    });
}

function limparRespostasPesquisa() {
    if (confirm('Tem certeza que deseja limpar todas as respostas da pesquisa? Esta ação não pode ser desfeita.')) {
        pesquisas = [];
        atualizarResultadosPesquisa();
        limparGraficos();
        salvarDados();
        alert('Todas as respostas foram removidas.');
    }
}

// === FUNÇÕES AUXILIARES ===

function salvarDados() {
    try {
        const dados = {
            participantes: participantes,
            pesquisas: pesquisas,
            timestamp: new Date().toISOString()
        };
        
        // Salvar no localStorage (backup local)
        localStorage.setItem('sistemaPresenca', JSON.stringify(dados));
        console.log('Dados salvos no localStorage');
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

function atualizarIndicadorPresenca() {
    const presentes = participantes.filter(p => p.presente).length;
    const ausentes = participantes.length - presentes;
    
    // Verificar se os elementos existem antes de usar
    const totalElement = document.getElementById('total-participantes');
    const presentesElement = document.getElementById('presentes');
    
    if (!totalElement || !presentesElement) {
        console.warn('⚠️ Elementos DOM não encontrados para atualizar indicador de presença');
        return;
    }
    
    // Atualizar números
    totalElement.textContent = `Total: ${participantes.length}`;
    presentesElement.textContent = `Presentes: ${presentes}`;
    
    // Atualizar gráfico de presença
    atualizarGraficoPresenca(presentes, ausentes);
}

function atualizarGraficoPresenca(presentes, ausentes) {
    const canvas = document.getElementById('grafico-presenca');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const total = presentes + ausentes;
    if (total === 0) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Desenhar gráfico de pizza
    let startAngle = 0;
    
    // Presentes (verde)
    if (presentes > 0) {
        const presentesAngle = (presentes / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + presentesAngle);
        ctx.closePath();
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        startAngle += presentesAngle;
    }
    
    // Ausentes (vermelho)
    if (ausentes > 0) {
        const ausentesAngle = (ausentes / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + ausentesAngle);
        ctx.closePath();
        ctx.fillStyle = '#f44336';
        ctx.fill();
    }
    
    // Desenhar borda
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function filtrarParticipantes() {
    const filtro = document.getElementById('filtro-participantes').value.toLowerCase();
    const participantesItems = document.querySelectorAll('.participant-item');
    
    participantesItems.forEach(item => {
        const nome = item.querySelector('.participant-name').textContent.toLowerCase();
        const depto = item.querySelector('.participant-dept').textContent.toLowerCase();
        
        if (nome.includes(filtro) || depto.includes(filtro)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Atualizar contador de resultados
    const visibleItems = document.querySelectorAll('.participant-item[style="display: flex;"], .participant-item:not([style*="display: none"])');
    const resultadoFiltro = document.getElementById('resultado-filtro');
    
    // Verificar se o elemento existe antes de usar
    if (!resultadoFiltro) {
        console.warn('⚠️ Elemento resultado-filtro não encontrado');
        return;
    }
    
    if (filtro.trim() === '') {
        resultadoFiltro.textContent = '';
    } else {
        const count = Array.from(visibleItems).filter(item => 
            !item.style.display || item.style.display !== 'none'
        ).length;
        resultadoFiltro.textContent = `${count} resultado(s) encontrado(s)`;
    }
}

function limparPesquisa() {
    const filtroElement = document.getElementById('filtro-participantes');
    const resultadoElement = document.getElementById('resultado-filtro');
    
    // Verificar se os elementos existem antes de usar
    if (!filtroElement || !resultadoElement) {
        console.warn('⚠️ Elementos de filtro não encontrados');
        return;
    }
    
    filtroElement.value = '';
    
    // Mostrar todos os participantes
    const participantesItems = document.querySelectorAll('.participant-item');
    participantesItems.forEach(item => {
        item.style.display = 'flex';
    });
    
    // Limpar resultado do filtro
    resultadoElement.textContent = '';
}

// Função para processar upload de Excel
async function processarExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Pegar a primeira planilha
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Processar dados
            let adicionados = 0;
            let duplicados = 0;
            
            // Mostrar progresso
            const progressDiv = document.createElement('div');
            progressDiv.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                           background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                           z-index: 1000; text-align: center;">
                    <div style="margin-bottom: 10px;">Processando arquivo Excel...</div>
                    <div style="width: 200px; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                        <div id="progress-bar" style="height: 100%; background: #4CAF50; width: 0%; transition: width 0.3s;"></div>
                    </div>
                    <div id="progress-text" style="margin-top: 10px; font-size: 12px; color: #666;">0%</div>
                </div>
            `;
            document.body.appendChild(progressDiv);
            
            // Simular progresso
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 90) progress = 90;
                
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');
                
                if (progressBar && progressText) {
                    progressBar.style.width = progress + '%';
                    progressText.textContent = Math.round(progress) + '%';
                }
            }, 100);
            
            // Pular primeira linha se for cabeçalho
            const startRow = jsonData[0] && (
                jsonData[0].some(cell => 
                    typeof cell === 'string' && 
                    (cell.toLowerCase().includes('nome') || 
                     cell.toLowerCase().includes('name') ||
                     cell.toLowerCase().includes('participante'))
                )
            ) ? 1 : 0;
            
            for (let i = startRow; i < jsonData.length; i++) {
                const row = jsonData[i];
                
                // Verificar se a linha tem dados
                if (!row || row.length === 0 || !row[0]) continue;
                
                const nome = String(row[0]).trim();
                const departamento = row[1] ? String(row[1]).trim() : 'Não informado';
                
                if (nome === '' || nome === 'undefined') continue;
                
                // Verificar se já existe
                const jaExiste = participantes.find(p => 
                    (p.nome && p.nome.toLowerCase() === nome.toLowerCase()) ||
                    (p.name && p.name.toLowerCase() === nome.toLowerCase())
                );
                
                if (jaExiste) {
                    duplicados++;
                    continue;
                }
                
                // Adicionar participante
                const participante = {
                    id: Date.now() + Math.random(),
                    nome: nome,
                    departamento: departamento,
                    presente: false,
                    horarioCheckIn: null
                };
                
                participantes.push(participante);
                adicionados++;
            }
            
            // Finalizar progresso
            clearInterval(progressInterval);
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            
            if (progressBar && progressText) {
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
            }
            
            setTimeout(() => {
                progressDiv.remove();
                
                // Atualizar interface
                atualizarListaParticipantes();
                atualizarIndicadorPresenca();
                salvarDados();
                
                // Mostrar resultado
                let mensagem = `Importação concluída!\n\n`;
                mensagem += `✅ Adicionados: ${adicionados}\n`;
                if (duplicados > 0) mensagem += `⚠️ Duplicados ignorados: ${duplicados}\n`;
                
                alert(mensagem);
                
                // Limpar input
                event.target.value = '';
            }, 500);
            
        } catch (error) {
            console.error('Erro ao processar Excel:', error);
            alert('Erro ao processar arquivo Excel. Verifique se o formato está correto.');
            
            // Remover progresso em caso de erro
            const progressDiv = document.querySelector('[style*="position: fixed"]');
            if (progressDiv) progressDiv.remove();
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function baixarModeloExcel() {
    // Criar dados de exemplo
    const dadosExemplo = [
        ['Nome', 'Departamento'],
        ['João Silva', 'TI'],
        ['Maria Santos', 'RH'],
        ['Pedro Oliveira', 'Vendas'],
        ['Ana Costa', 'Marketing']
    ];
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dadosExemplo);
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    
    // Fazer download
    XLSX.writeFile(wb, 'modelo_participantes.xlsx');
}

function exportarDados() {
    const dados = {
        participantes: participantes,
        pesquisas: pesquisas,
        exportadoEm: new Date().toLocaleString()
    };
    
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `dados_evento_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

async function limparListaParticipantes() {
    if (confirm('Tem certeza que deseja limpar toda a lista de participantes? Esta ação não pode ser desfeita.')) {
        try {
            participantes = [];
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            salvarDados();
            
            alert('Lista de participantes limpa com sucesso.');
            
        } catch (error) {
            console.error('Erro ao limpar lista:', error);
            alert('Erro ao limpar lista. Tente novamente.');
        }
    }
}

async function limparDados() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados (participantes e pesquisas)? Esta ação não pode ser desfeita.')) {
        try {
            participantes = [];
            pesquisas = [];
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            atualizarResultadosPesquisa();
            limparGraficos();
            salvarDados();
            
            alert('Todos os dados foram limpos com sucesso.');
            
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            alert('Erro ao limpar dados. Tente novamente.');
        }
    }
}

function configurarUploadImagem() {
    const uploadInput = document.getElementById('upload-imagem');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                processarImagemCapa(file);
            }
        });
    }
}

function processarImagemCapa(file) {
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
    }
    
    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagemSrc = e.target.result;
        
        // Salvar no localStorage
        localStorage.setItem('imagemCapa', imagemSrc);
        
        // Exibir imagem
        exibirImagemCapa(imagemSrc);
        
        // Aplicar ao cabeçalho
        aplicarImagemCabecalho(imagemSrc);
    };
    
    reader.readAsDataURL(file);
}

function exibirImagemCapa(imagemSrc) {
    const preview = document.getElementById('preview-imagem');
    preview.innerHTML = `
        <img src="${imagemSrc}" alt="Imagem de capa" style="max-width: 100%; height: auto; border-radius: 8px;">
        <button onclick="removerImagemCapa()" class="btn-remover-imagem">
            <i class="fas fa-trash"></i> Remover Imagem
        </button>
    `;
}

function removerImagemCapa() {
    if (confirm('Tem certeza que deseja remover a imagem de capa?')) {
        // Remover do localStorage
        localStorage.removeItem('imagemCapa');
        
        // Limpar preview
        document.getElementById('preview-imagem').innerHTML = '';
        
        // Remover do cabeçalho
        const header = document.querySelector('.header');
        if (header) {
            header.style.backgroundImage = '';
            header.style.backgroundColor = '#2c3e50';
        }
        
        // Limpar input
        const uploadInput = document.getElementById('upload-imagem');
        if (uploadInput) {
            uploadInput.value = '';
        }
        
        alert('Imagem removida com sucesso.');
    }
}

function carregarImagemCapa() {
    const imagemSalva = localStorage.getItem('imagemCapa');
    if (imagemSalva) {
        exibirImagemCapa(imagemSalva);
        aplicarImagemCabecalho(imagemSalva);
    }
}

// === SISTEMA DE AUTENTICAÇÃO ADMIN ===
const SENHA_ADMIN = "admin123"; // Senha padrão (pode ser alterada)
let currentUser = null;

function showAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'flex';
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

async function autenticarAdmin(event) {
    event.preventDefault();
    
    const senha = document.getElementById('admin-password').value;
    
    if (senha === SENHA_ADMIN) {
        currentUser = {
            username: 'admin',
            loginTime: new Date().toISOString()
        };
        
        // Salvar sessão
        sessionStorage.setItem('adminSession', JSON.stringify(currentUser));
        
        // Fechar modal
        closeAdminLogin();
        
        // Mostrar área admin
        document.getElementById('admin-area').style.display = 'block';
        document.getElementById('admin-login-btn').style.display = 'none';
        document.getElementById('admin-logout-btn').style.display = 'inline-block';
        
        // Limpar campo de senha
        document.getElementById('admin-password').value = '';
        
        alert('Login realizado com sucesso!');
        
    } else {
        alert('Senha incorreta!');
        document.getElementById('admin-password').value = '';
    }
}

async function logoutAdmin() {
    if (confirm('Tem certeza que deseja sair da área administrativa?')) {
        currentUser = null;
        
        // Remover sessão
        sessionStorage.removeItem('adminSession');
        
        // Esconder área admin
        document.getElementById('admin-area').style.display = 'none';
        document.getElementById('admin-login-btn').style.display = 'inline-block';
        document.getElementById('admin-logout-btn').style.display = 'none';
        
        alert('Logout realizado com sucesso!');
    }
}

async function verificarLoginAdmin() {
    const sessaoSalva = sessionStorage.getItem('adminSession');
    
    if (sessaoSalva) {
        try {
            currentUser = JSON.parse(sessaoSalva);
            
            // Verificar se a sessão não expirou (24 horas)
            const loginTime = new Date(currentUser.loginTime);
            const agora = new Date();
            const diferencaHoras = (agora - loginTime) / (1000 * 60 * 60);
            
            if (diferencaHoras < 24) {
                // Sessão válida
                document.getElementById('admin-area').style.display = 'block';
                document.getElementById('admin-login-btn').style.display = 'none';
                document.getElementById('admin-logout-btn').style.display = 'inline-block';
            } else {
                // Sessão expirada
                sessionStorage.removeItem('adminSession');
                currentUser = null;
            }
        } catch (error) {
            console.error('Erro ao verificar sessão admin:', error);
            sessionStorage.removeItem('adminSession');
            currentUser = null;
        }
    }
}

function aplicarImagemCabecalho(imagemSrc) {
    const header = document.querySelector('.header');
    if (header) {
        header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${imagemSrc})`;
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
        header.style.backgroundRepeat = 'no-repeat';
    }
}