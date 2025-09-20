// Dados globais
let participantes = [];
let pesquisas = [];
let npsChart = null;
let qualidadeChart = null;
let instrutorChart = null;
let isSupabaseReady = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Função assíncrona para inicialização
    async function inicializar() {
        try {
            // Inicializar Supabase primeiro
            await initializeSupabase();
            
            // Configurar listener de autenticação
            await setupAuthListener();
            
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
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }
    
    // Executar inicialização
    inicializar();
});

// Função para inicializar Supabase
async function initializeSupabase() {
    try {
        if (window.supabaseService) {
            const connected = await window.supabaseService.testConnection();
            if (connected) {
                console.log('✅ Supabase conectado com sucesso!');
                isSupabaseReady = true;
                
                // Verificar se há dados no localStorage para migrar
                const localData = localStorage.getItem('sistemaPresenca');
                if (localData && JSON.parse(localData).participantes?.length > 0) {
                    const migrate = confirm('Foram encontrados dados locais. Deseja migrar para o Supabase?');
                    if (migrate) {
                        await window.supabaseService.syncFromLocalStorage();
                        // Limpar localStorage após migração
                        localStorage.removeItem('sistemaPresenca');
                        alert('Dados migrados com sucesso para o Supabase!');
                    }
                }
            } else {
                console.warn('⚠️ Supabase não conectado, usando localStorage como fallback');
                isSupabaseReady = false;
            }
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        isSupabaseReady = false;
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
        if (isSupabaseReady) {
            // Usar Supabase
            const novoParticipante = await window.supabaseService.addParticipant(nome, depto);
            
            // Converter formato Supabase para formato local
            const participanteLocal = {
                id: novoParticipante.id,
                nome: novoParticipante.name,
                departamento: novoParticipante.department || 'Não informado',
                presente: novoParticipante.present,
                horarioCheckIn: novoParticipante.arrival_time ? new Date(novoParticipante.arrival_time).toLocaleTimeString() : null
            };
            
            participantes.push(participanteLocal);
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
        }
        
        nomeInput.value = '';
        deptoInput.value = '';
        
        atualizarListaParticipantes();
        atualizarIndicadorPresenca();
        
        if (!isSupabaseReady) {
            salvarDados();
        }
        
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
            if (isSupabaseReady) {
                // Atualizar no Supabase
                const participanteAtualizado = await window.supabaseService.updateParticipantPresence(id, novoStatus);
                
                // Atualizar dados locais
                participante.presente = participanteAtualizado.present;
                participante.horarioCheckIn = participanteAtualizado.arrival_time ? 
                    new Date(participanteAtualizado.arrival_time).toLocaleTimeString() : null;
            } else {
                // Fallback para localStorage
                participante.presente = novoStatus;
                participante.horarioCheckIn = novoStatus ? new Date().toLocaleTimeString() : null;
            }
            
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
            if (!isSupabaseReady) {
                salvarDados();
            }
            
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
            alert('Erro ao atualizar presença. Tente novamente.');
        }
    }
}

async function removerParticipante(id) {
    if (confirm('Tem certeza que deseja remover este participante?')) {
        try {
            if (isSupabaseReady) {
                // Remover do Supabase
                await window.supabaseService.removeParticipant(id);
            }
            
            // Remover dos dados locais
            participantes = participantes.filter(p => p.id !== id);
            
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
            if (!isSupabaseReady) {
                salvarDados();
            }
            
        } catch (error) {
            console.error('Erro ao remover participante:', error);
            alert('Erro ao remover participante. Tente novamente.');
        }
    }
}

function atualizarListaParticipantes() {
    const lista = document.getElementById('lista-participantes');
    const totalElement = document.getElementById('total-participantes');
    const presentesElement = document.getElementById('presentes');
    
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
            
            if (isSupabaseReady) {
                // Salvar no Supabase
                const novaPesquisa = await window.supabaseService.addSurvey(
                    'Participante Anônimo', // Nome do participante
                    parseInt(npsScore),
                    document.getElementById('qualidade').value,
                    document.getElementById('instrutor').value,
                    document.getElementById('comentarios').value
                );
                
                // Converter formato Supabase para formato local
                const pesquisaLocal = {
                    participantName: novaPesquisa.participant_name,
                    npsScore: novaPesquisa.nps_score,
                    qualityRating: novaPesquisa.quality_rating,
                    instructorRating: novaPesquisa.instructor_rating,
                    comments: novaPesquisa.comments,
                    timestamp: novaPesquisa.created_at
                };
                
                pesquisas.push(pesquisaLocal);
            } else {
                // Fallback para localStorage
                pesquisas.push(pesquisa);
            }
            
            // Resetar formulário
            form.reset();
            document.querySelectorAll('.nps-btn').forEach(btn => btn.classList.remove('selected'));
            
            // Atualizar resultados
            atualizarResultadosPesquisa();
            
            if (!isSupabaseReady) {
                salvarDados();
            }
            
            alert('Pesquisa enviada com sucesso! Obrigado pelo seu feedback.');
            
        } catch (error) {
            console.error('Erro ao salvar pesquisa:', error);
            alert('Erro ao salvar pesquisa. Tente novamente.');
        }
    });
}

function atualizarResultadosPesquisa() {
    if (pesquisas.length === 0) {
        // Limpar gráficos se não houver dados
        limparGraficos();
        return;
    }
    
    const promotores = pesquisas.filter(p => p.nps >= 9).length;
    const neutros = pesquisas.filter(p => p.nps >= 7 && p.nps <= 8).length;
    const detratores = pesquisas.filter(p => p.nps <= 6).length;
    const total = pesquisas.length;
    
    const nps = Math.round(((promotores - detratores) / total) * 100);
    
    document.getElementById('nps-final').textContent = nps;
    document.getElementById('promotores').textContent = promotores;
    document.getElementById('neutros').textContent = neutros;
    document.getElementById('detratores').textContent = detratores;
    document.getElementById('total-respostas').textContent = total;
    
    // Colorir o NPS baseado no valor
    const npsElement = document.getElementById('nps-final');
    npsElement.className = '';
    if (nps >= 70) {
        npsElement.classList.add('nps-excellent');
    } else if (nps >= 50) {
        npsElement.classList.add('nps-good');
    } else if (nps >= 0) {
        npsElement.classList.add('nps-average');
    } else {
        npsElement.classList.add('nps-poor');
    }
    
    // Atualizar gráficos
    atualizarGraficos();
}

// Funções para gráficos
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
    const ctx = document.getElementById('npsChart');
    if (!ctx) return;
    
    if (npsChart) {
        npsChart.destroy();
    }
    
    const promotores = pesquisas.filter(p => p.nps >= 9).length;
    const neutros = pesquisas.filter(p => p.nps >= 7 && p.nps <= 8).length;
    const detratores = pesquisas.filter(p => p.nps <= 6).length;
    
    npsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Detratores (0-6)', 'Neutros (7-8)', 'Promotores (9-10)'],
            datasets: [{
                label: 'Número de Respostas',
                data: [detratores, neutros, promotores],
                backgroundColor: [
            '#F37021',  // Laranja para detratores
            '#ffa500',  // Laranja claro para neutros  
            '#00578E'   // Azul para promotores
        ],
        borderColor: [
            '#e55a00',
            '#ff8c00',
            '#003d66'
        ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Distribuição NPS',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function criarGraficoQualidade() {
    const ctx = document.getElementById('qualidadeChart');
    if (!ctx) return;
    
    if (qualidadeChart) {
        qualidadeChart.destroy();
    }
    
    const qualidadeCount = {};
    pesquisas.forEach(p => {
        qualidadeCount[p.qualidade] = (qualidadeCount[p.qualidade] || 0) + 1;
    });
    
    const labels = Object.keys(qualidadeCount);
    const data = Object.values(qualidadeCount);
    const colors = ['#00578E', '#F37021', '#0066a3', '#e55a00', '#003d66'];
    
    qualidadeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Avaliação da Qualidade',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function criarGraficoInstrutor() {
    const ctx = document.getElementById('instrutorChart');
    if (!ctx) return;
    
    if (instrutorChart) {
        instrutorChart.destroy();
    }
    
    const instrutorCount = {};
    pesquisas.forEach(p => {
        instrutorCount[p.instrutor] = (instrutorCount[p.instrutor] || 0) + 1;
    });
    
    const labels = Object.keys(instrutorCount);
    const data = Object.values(instrutorCount);
    const colors = ['#F37021', '#00578E', '#0066a3', '#e55a00', '#003d66'];
    
    instrutorChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Avaliação do Instrutor',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function limparRespostasPesquisa() {
    if (confirm('Tem certeza que deseja limpar todas as respostas da pesquisa? Esta ação não pode ser desfeita.')) {
        pesquisas = [];
        salvarDados();
        
        // Resetar exibição dos resultados
        document.getElementById('nps-final').textContent = '-';
        document.getElementById('promotores').textContent = '0';
        document.getElementById('neutros').textContent = '0';
        document.getElementById('detratores').textContent = '0';
        document.getElementById('total-respostas').textContent = '0';
        
        // Remover classes de cor do NPS
        const npsElement = document.getElementById('nps-final');
        npsElement.className = '';
        
        alert('Todas as respostas da pesquisa foram removidas com sucesso!');
    }
}

// === PERSISTÊNCIA DE DADOS ===

function salvarDados() {
    if (isSupabaseReady) {
        // Dados já são salvos automaticamente no Supabase
        return;
    }
    
    // Fallback para localStorage
    const dados = {
        participantes: participantes,
        pesquisas: pesquisas
    };
    
    localStorage.setItem('sistemaPresenca', JSON.stringify(dados));
}

// Função para atualizar o indicador de presença
function atualizarIndicadorPresenca() {
    const presentes = participantes.filter(p => p.presente).length;
    const ausentes = participantes.length - presentes;
    const percentual = participantes.length > 0 ? Math.round((presentes / participantes.length) * 100) : 0;
    
    // Atualizar contadores
    document.getElementById('presentes-count').textContent = presentes;
    document.getElementById('ausentes-count').textContent = ausentes;
    document.getElementById('percentual-presenca').textContent = percentual + '%';
    
    // Atualizar gráfico
    atualizarGraficoPresenca(presentes, ausentes);
}

// Função para criar/atualizar gráfico de presença
function atualizarGraficoPresenca(presentes, ausentes) {
    const canvas = document.getElementById('presenceChart');
    const ctx = canvas.getContext('2d');
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (presentes === 0 && ausentes === 0) {
        // Mostrar mensagem quando não há dados
        ctx.fillStyle = '#00578E';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum participante cadastrado', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const total = presentes + ausentes;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    // Desenhar gráfico de pizza
    let startAngle = -Math.PI / 2;
    
    // Fatia dos presentes
    if (presentes > 0) {
        const presentesAngle = (presentes / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + presentesAngle);
        ctx.closePath();
        ctx.fillStyle = '#00578E';
        ctx.fill();
        startAngle += presentesAngle;
    }
    
    // Fatia dos ausentes
    if (ausentes > 0) {
        const ausentesAngle = (ausentes / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + ausentesAngle);
        ctx.closePath();
        ctx.fillStyle = '#F37021';
        ctx.fill();
    }
    
    // Desenhar borda
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Função para filtrar participantes por nome
function filtrarParticipantes() {
    const pesquisa = document.getElementById('pesquisa-participante').value.toLowerCase();
    const clearBtn = document.getElementById('clear-search');
    const participantItems = document.querySelectorAll('.participant-item');
    let resultadosEncontrados = 0;
    
    // Mostrar/ocultar botão de limpar pesquisa
    if (pesquisa.length > 0) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    // Filtrar participantes
    participantItems.forEach(item => {
        const nome = item.querySelector('.participant-name').textContent.toLowerCase();
        if (nome.includes(pesquisa)) {
            item.classList.remove('hidden');
            resultadosEncontrados++;
        } else {
            item.classList.add('hidden');
        }
    });
    
    // Mostrar mensagem quando não há resultados
    let noResultsMsg = document.querySelector('.no-results');
    if (resultadosEncontrados === 0 && pesquisa.length > 0 && participantItems.length > 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results';
            noResultsMsg.innerHTML = `
                <i class="fas fa-search"></i>
                <p>Nenhum participante encontrado para "${pesquisa}"</p>
            `;
            document.getElementById('lista-participantes').appendChild(noResultsMsg);
        } else {
            noResultsMsg.innerHTML = `
                <i class="fas fa-search"></i>
                <p>Nenhum participante encontrado para "${pesquisa}"</p>
            `;
            noResultsMsg.style.display = 'block';
        }
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Função para limpar pesquisa
function limparPesquisa() {
    document.getElementById('pesquisa-participante').value = '';
    document.getElementById('clear-search').style.display = 'none';
    
    // Mostrar todos os participantes
    const participantItems = document.querySelectorAll('.participant-item');
    participantItems.forEach(item => {
        item.classList.remove('hidden');
    });
    
    // Ocultar mensagem de "não encontrado"
    const noResultsMsg = document.querySelector('.no-results');
    if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

async function carregarDados() {
    try {
        if (isSupabaseReady) {
            // Carregar do Supabase
            const participantesSupabase = await window.supabaseService.getParticipants();
            const pesquisasSupabase = await window.supabaseService.getSurveys();
            
            // Converter formato Supabase para formato local
            participantes = participantesSupabase.map(p => ({
                id: p.id,
                nome: p.name,
                departamento: p.department || 'Não informado',
                presente: p.present,
                horarioCheckIn: p.arrival_time ? new Date(p.arrival_time).toLocaleTimeString() : null
            }));
            
            pesquisas = pesquisasSupabase.map(s => ({
                participantName: s.participant_name,
                nps: s.nps_score,
                qualidade: s.quality_rating,
                instrutor: s.instructor_rating,
                comentarios: s.comments || ''
            }));
            
            console.log('✅ Dados carregados do Supabase');
        } else {
            // Carregar do localStorage
            const dadosParticipantes = localStorage.getItem('participantes');
            const dadosPesquisas = localStorage.getItem('pesquisas');
            
            if (dadosParticipantes) {
                participantes = JSON.parse(dadosParticipantes);
            }
            
            if (dadosPesquisas) {
                pesquisas = JSON.parse(dadosPesquisas);
            }
            
            console.log('📦 Dados carregados do localStorage');
        }
        
        // Atualizar interface
        atualizarListaParticipantes();
        atualizarIndicadorPresenca();
        atualizarResultadosPesquisa();
        carregarImagemCapa();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        
        // Fallback para localStorage em caso de erro
        const dadosParticipantes = localStorage.getItem('participantes');
        const dadosPesquisas = localStorage.getItem('pesquisas');
        
        if (dadosParticipantes) {
            participantes = JSON.parse(dadosParticipantes);
        }
        
        if (dadosPesquisas) {
            pesquisas = JSON.parse(dadosPesquisas);
        }
        
        atualizarListaParticipantes();
        atualizarIndicadorPresenca();
        atualizarResultadosPesquisa();
        carregarImagemCapa();
    }
}

// === UTILITÁRIOS ===

// Permitir adicionar participante com Enter
// DOMContentLoaded duplicado removido - funcionalidades movidas para o primeiro

// === FUNÇÕES DE UPLOAD EXCEL ===

function processarExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
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
            
            jsonData.forEach((row, index) => {
                // Pular linha de cabeçalho se existir
                if (index === 0 && (row[0] === 'Nome' || row[0] === 'Nome Completo')) return;
                
                const nome = row[0] ? row[0].toString().trim() : '';
                const departamento = row[1] ? row[1].toString().trim() : 'Não informado';
                
                if (nome && nome !== '') {
                    // Verificar se já existe
                    if (!participantes.find(p => p.nome.toLowerCase() === nome.toLowerCase())) {
                        const participante = {
                            id: Date.now() + Math.random(),
                            nome: nome,
                            departamento: departamento,
                            presente: false,
                            horarioCheckIn: null
                        };
                        
                        participantes.push(participante);
                        adicionados++;
                    } else {
                        duplicados++;
                    }
                }
            });
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            salvarDados();
            
            // Mostrar resultado
            let mensagem = `Upload concluído!\n`;
            mensagem += `Participantes adicionados: ${adicionados}\n`;
            if (duplicados > 0) {
                mensagem += `Participantes duplicados (ignorados): ${duplicados}`;
            }
            
            alert(mensagem);
            
            // Limpar input
            event.target.value = '';
            
        } catch (error) {
            console.error('Erro ao processar Excel:', error);
            alert('Erro ao processar o arquivo Excel. Verifique se o formato está correto.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function baixarModeloExcel() {
    // Criar dados de exemplo
    const dadosModelo = [
        ['Nome Completo', 'Departamento'],
        ['João Silva', 'TI'],
        ['Maria Santos', 'RH'],
        ['Pedro Oliveira', 'Vendas'],
        ['Ana Costa', 'Marketing']
    ];
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dadosModelo);
    
    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    
    // Baixar arquivo
    XLSX.writeFile(wb, 'modelo-participantes.xlsx');
}

// Função para exportar dados (útil para backup)
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
    link.download = `dados-treinamento-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Função para limpar todos os dados
async function limparListaParticipantes() {
    // Verificar se há participantes na lista
    if (participantes.length === 0) {
        alert('A lista já está vazia.');
        return;
    }
    
    // Mostrar alerta de confirmação
    const confirmacao = confirm(
        `⚠️ ATENÇÃO!\n\nTodos os dados serão apagados permanentemente:\n\n` +
        `• ${participantes.length} participante(s)\n` +
        `• Registros de presença\n` +
        `• Histórico de sorteios\n` +
        `• Pesquisas de satisfação\n\n` +
        `Esta ação não pode ser desfeita.\n\n` +
        `Deseja realmente limpar todos os dados?`
    );
    
    if (confirmacao) {
        try {
            // Limpar todos os dados
            participantes = [];
            pesquisas = [];
            
            if (isSupabaseReady) {
                // Limpar dados no Supabase
                await window.supabaseService.clearAllData();
            } else {
                // Limpar localStorage
                localStorage.removeItem('participantes');
                localStorage.removeItem('pesquisas');
                localStorage.removeItem('imagemCapa');
            }
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            atualizarResultadosPesquisa();
            
            // Remover imagem de capa
            removerImagemCapa();
            
            alert('✅ Todos os dados foram limpos com sucesso!');
            
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            alert('Erro ao limpar dados. Tente novamente.');
        }
    }
}

async function limparDados() {
    try {
        if (isSupabaseReady) {
            await window.supabaseService.clearAllData();
        } else {
            localStorage.clear();
        }
        
        // Resetar variáveis
        participantes = [];
        pesquisas = [];
        
        // Atualizar interface
        atualizarListaParticipantes();
        atualizarIndicadorPresenca();
        atualizarResultadosPesquisa();
        
        alert('Dados limpos com sucesso!');
        
    } catch (error) {
        console.error('Erro ao limpar dados:', error);
        alert('Erro ao limpar dados. Tente novamente.');
    }
}

// Funções para gerenciamento de imagem de capa
function configurarUploadImagem() {
    const uploadInput = document.getElementById('cover-upload');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                processarImagemCapa(file);
            }
        });
    }
    
    // Carregar imagem salva se existir
    carregarImagemCapa();
}

function processarImagemCapa(file) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        alert('❌ Por favor, selecione apenas arquivos de imagem.');
        return;
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('❌ A imagem deve ter no máximo 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagemBase64 = e.target.result;
        
        // Salvar no localStorage
        localStorage.setItem('imagemCapa', imagemBase64);
        
        // Exibir preview
        exibirImagemCapa(imagemBase64);
        
        // Aplicar também no cabeçalho
        aplicarImagemCabecalho(imagemBase64);
        
        alert('✅ Imagem de capa atualizada com sucesso!');
    };
    
    reader.readAsDataURL(file);
}

function exibirImagemCapa(imagemSrc) {
    const preview = document.getElementById('cover-preview');
    const noCover = document.getElementById('no-cover');
    const removeBtn = document.getElementById('remove-cover');
    
    if (preview && noCover && removeBtn) {
        preview.src = imagemSrc;
        preview.style.display = 'block';
        noCover.style.display = 'none';
        removeBtn.style.display = 'inline-block';
    }
}

function removerImagemCapa() {
    if (confirm('Tem certeza que deseja remover a imagem de capa?')) {
        // Remover do localStorage
        localStorage.removeItem('imagemCapa');
        
        // Atualizar interface
        const preview = document.getElementById('cover-preview');
        const noCover = document.getElementById('no-cover');
        const removeBtn = document.getElementById('remove-cover');
        
        if (preview && noCover && removeBtn) {
            preview.style.display = 'none';
            preview.src = '';
            noCover.style.display = 'flex';
            removeBtn.style.display = 'none';
        }
        
        // Remover também do cabeçalho
        const headerImage = document.getElementById('header-cover-image');
        const headerCover = document.getElementById('header-cover');
        if (headerImage && headerCover) {
            headerImage.style.display = 'none';
            headerImage.src = '';
            headerCover.style.display = 'none';
        }
        
        alert('✅ Imagem de capa removida com sucesso!');
    }
}

function carregarImagemCapa() {
     const imagemSalva = localStorage.getItem('imagemCapa');
     if (imagemSalva) {
         exibirImagemCapa(imagemSalva);
         // Também aplicar no cabeçalho
         aplicarImagemCabecalho(imagemSalva);
     }
 }

// Funções de autenticação do administrador
const SENHA_ADMIN = "admin123"; // Senha padrão (pode ser alterada)
let currentUser = null;

function showAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'flex';
    document.getElementById('admin-password').focus();
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
    document.getElementById('admin-password').value = '';
    document.getElementById('login-error').style.display = 'none';
}

async function autenticarAdmin(event) {
    event.preventDefault();
    
    const senha = document.getElementById('admin-password').value;
    const loginError = document.getElementById('login-error');
    
    try {
        if (isSupabaseReady) {
            // Usar Supabase Auth para autenticação
            const adminEmail = 'admin@sistema.com'; // Email padrão do admin
            
            try {
                const { user } = await window.supabaseService.signIn(adminEmail, senha);
                currentUser = user;
                
                // Login bem-sucedido
                document.getElementById('admin-login-modal').style.display = 'none';
                showModule('admin');
                document.getElementById('admin-panel').style.display = 'block';
                
                // Salvar estado de login (sessão)
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminUser', JSON.stringify(user));
                
                // Limpar campo de senha
                document.getElementById('admin-password').value = '';
                loginError.style.display = 'none';
                
            } catch (authError) {
                // Se falhar no Supabase, usar autenticação local como fallback
                if (senha === SENHA_ADMIN) {
                    loginSuccess();
                } else {
                    loginFailed();
                }
            }
        } else {
            // Usar autenticação local
            if (senha === SENHA_ADMIN) {
                loginSuccess();
            } else {
                loginFailed();
            }
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
        loginFailed();
    }
    
    function loginSuccess() {
        document.getElementById('admin-login-modal').style.display = 'none';
        showModule('admin');
        document.getElementById('admin-panel').style.display = 'block';
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('admin-password').value = '';
        loginError.style.display = 'none';
    }
    
    function loginFailed() {
        loginError.style.display = 'block';
        document.getElementById('admin-password').value = '';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
}

async function logoutAdmin() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        try {
            if (isSupabaseReady && currentUser) {
                await window.supabaseService.signOut();
                currentUser = null;
            }
            
            // Ocultar painel administrativo
            document.getElementById('admin-panel').style.display = 'none';
            
            // Voltar para o módulo de presença
            showModule('presenca');
            
            // Remover estado de login
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminUser');
            
        } catch (error) {
            console.error('Erro no logout:', error);
            // Mesmo com erro, fazer logout local
            document.getElementById('admin-panel').style.display = 'none';
            showModule('presenca');
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminUser');
        }
    }
}

async function verificarLoginAdmin() {
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    
    if (adminLoggedIn === 'true') {
        if (isSupabaseReady) {
            // Verificar se o usuário ainda está autenticado no Supabase
            try {
                const user = await window.supabaseService.getCurrentUser();
                if (user) {
                    currentUser = user;
                    document.getElementById('admin-panel').style.display = 'block';
                } else {
                    // Usuário não está mais autenticado, fazer logout
                    sessionStorage.removeItem('adminLoggedIn');
                    sessionStorage.removeItem('adminUser');
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
            }
        } else {
            // Usar verificação local
            document.getElementById('admin-panel').style.display = 'block';
        }
    }
}

// Configurar listener para mudanças de autenticação
async function setupAuthListener() {
    if (isSupabaseReady) {
        window.supabaseService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                currentUser = null;
                document.getElementById('admin-panel').style.display = 'none';
                sessionStorage.removeItem('adminLoggedIn');
                sessionStorage.removeItem('adminUser');
                showModule('presenca');
            } else if (event === 'SIGNED_IN' && session?.user) {
                currentUser = session.user;
            }
        });
    }
}

function aplicarImagemCabecalho(imagemSrc) {
    const headerImage = document.getElementById('header-cover-image');
    const headerCover = document.getElementById('header-cover');
    
    if (headerImage && headerCover) {
        headerImage.src = imagemSrc;
        headerImage.style.display = 'block';
        headerCover.style.display = 'block';
    }
}