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
            
            // Carregar participantes
            participantes = await window.databaseService.getParticipants();
            console.log('Participantes carregados do SQLite:', participantes.length);
            
            // Carregar pesquisas do SQLite
            pesquisas = await window.databaseService.getSurveyResponses();
            console.log('Pesquisas carregadas do SQLite:', pesquisas.length);
            
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
    modules.forEach(module => {
        if (module && module.classList) {
            module.classList.remove('active');
        }
    });
    
    // Remover classe active dos botões
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        if (btn && btn.classList) {
            btn.classList.remove('active');
        }
    });
    
    // Mostrar módulo selecionado
    const targetModule = document.getElementById(moduleId);
    if (targetModule && targetModule.classList) {
        targetModule.classList.add('active');
    }
    
    const targetBtn = document.querySelector(`[onclick="showModule('${moduleId}')"]`);
    if (targetBtn && targetBtn.classList) {
        targetBtn.classList.add('active');
    }
}

// Função para adicionar participante
async function adicionarParticipante() {
    const nomeInput = document.getElementById('nome-participante');
    const deptoInput = document.getElementById('depto-participante');
    
    if (!nomeInput || !deptoInput) {
        console.error('Elementos de input não encontrados');
        return;
    }
    
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
        nomeInput.focus();
        
        atualizarListaParticipantes();
        atualizarIndicadorPresenca();
        
    } catch (error) {
        console.error('Erro ao adicionar participante:', error);
        alert('Erro ao adicionar participante. Tente novamente.');
    }
}

// Função para alternar presença
async function togglePresenca(id) {
    const participante = participantes.find(p => p.id === id);
    if (participante) {
        // Verificar o status atual considerando ambas as propriedades
        const statusAtual = participante.presente || participante.present;
        const novoStatus = !statusAtual;
        
        try {
            if (window.databaseService && !window.databaseService.isLocalStorage) {
                // Atualizar no SQLite
                await window.databaseService.markPresent(id, novoStatus);
                participante.present = novoStatus;
                participante.presente = novoStatus; // Manter consistência
                participante.arrival_time = novoStatus ? new Date().toISOString() : null;
                participante.horarioCheckin = novoStatus ? new Date().toISOString() : null; // Manter consistência
            } else {
                // Fallback para localStorage
                participante.presente = novoStatus;
                participante.present = novoStatus; // Manter consistência
                participante.horarioCheckin = novoStatus ? new Date().toISOString() : null;
                participante.arrival_time = novoStatus ? new Date().toISOString() : null; // Manter consistência
                salvarDados();
            }
            
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
            alert('Erro ao atualizar presença. Tente novamente.');
        }
    }
}

// Função para remover participante
async function removerParticipante(id) {
    if (confirm('Tem certeza que deseja remover este participante?')) {
        try {
            if (window.databaseService && !window.databaseService.isLocalStorage) {
                // Remover do SQLite
                await window.databaseService.removeParticipant(id);
                participantes = participantes.filter(p => p.id !== id);
            } else {
                // Fallback para localStorage
                participantes = participantes.filter(p => p.id !== id);
                salvarDados();
            }
            
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
        } catch (error) {
            console.error('Erro ao remover participante:', error);
            alert('Erro ao remover participante. Tente novamente.');
        }
    }
}

// Função para atualizar lista de participantes
function atualizarListaParticipantes() {
    const lista = document.getElementById('lista-participantes');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    participantes.forEach(participante => {
        const li = document.createElement('li');
        li.className = `participant-item ${participante.presente || participante.present ? 'present' : ''}`;
        
        li.innerHTML = `
            <div class="participant-info">
                <span class="participant-name">${participante.nome || participante.name}</span>
                <span class="participant-dept">${participante.departamento || participante.department}</span>
                ${(participante.presente || participante.present) && (participante.horarioCheckin || participante.arrival_time) ? 
                    `<span class="checkin-time">Check-in: ${new Date(participante.horarioCheckin || participante.arrival_time).toLocaleTimeString()}</span>` : ''}
            </div>
            <div class="participant-actions">
                <button onclick="togglePresenca(${participante.id})" class="presence-btn">
                    ${participante.presente || participante.present ? 'Marcar Ausente' : 'Marcar Presente'}
                </button>
                <button onclick="removerParticipante(${participante.id})" class="remove-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        lista.appendChild(li);
    });
}

// Função para sortear grupos
function sortearGrupos() {
    const participantesPresentes = participantes.filter(p => p.presente || p.present);
    const numGruposElement = document.getElementById('num-grupos');
    
    if (!numGruposElement) {
        alert('Elemento de número de grupos não encontrado.');
        return;
    }
    
    const numGrupos = parseInt(numGruposElement.value);
    
    if (participantesPresentes.length === 0) {
        alert('Não há participantes presentes para sortear.');
        return;
    }
    
    if (numGrupos <= 0 || numGrupos > participantesPresentes.length) {
        alert('Número de grupos inválido.');
        return;
    }
    
    // Embaralhar participantes
    const participantesEmbaralhados = [...participantesPresentes].sort(() => Math.random() - 0.5);
    
    // Dividir em grupos
    const grupos = [];
    const pessoasPorGrupo = Math.floor(participantesPresentes.length / numGrupos);
    const sobra = participantesPresentes.length % numGrupos;
    
    let indice = 0;
    for (let i = 0; i < numGrupos; i++) {
        const tamanhoGrupo = pessoasPorGrupo + (i < sobra ? 1 : 0);
        grupos.push(participantesEmbaralhados.slice(indice, indice + tamanhoGrupo));
        indice += tamanhoGrupo;
    }
    
    exibirResultadoGrupos(grupos);
}

// Função para exibir resultado dos grupos
function exibirResultadoGrupos(grupos) {
    const resultado = document.getElementById('resultado-grupos');
    resultado.innerHTML = '';
    
    grupos.forEach((grupo, index) => {
        const div = document.createElement('div');
        div.className = 'grupo';
        div.innerHTML = `
            <h3>Grupo ${index + 1}</h3>
            <ul>
                ${grupo.map(p => `<li>${p.nome || p.name} - ${p.departamento || p.department}</li>`).join('')}
            </ul>
        `;
        resultado.appendChild(div);
    });
}

// Função para sortear brinde
function sortearBrinde() {
    const participantesPresentes = participantes.filter(p => p.presente || p.present);
    
    if (participantesPresentes.length === 0) {
        alert('Não há participantes presentes para sortear.');
        return;
    }
    
    const vencedor = participantesPresentes[Math.floor(Math.random() * participantesPresentes.length)];
    
    const resultado = document.getElementById('resultado-brinde');
    resultado.innerHTML = `
        <div class="vencedor">
            <h3>🎉 Parabéns!</h3>
            <p><strong>${vencedor.nome || vencedor.name}</strong></p>
            <p>${vencedor.departamento || vencedor.department}</p>
        </div>
    `;
}

// Configurar NPS
function configurarNPS() {
    const btns = document.querySelectorAll('.nps-btn');
    if (btns.length > 0) {
        btns.forEach(btn => {
            if (btn && btn.addEventListener) {
                btn.addEventListener('click', function() {
                    btns.forEach(b => {
                        if (b && b.classList) {
                            b.classList.remove('selected');
                        }
                    });
                    if (this.classList) {
                        this.classList.add('selected');
                    }
                });
            }
        });
    }
}

// Configurar formulário de pesquisa
function configurarFormularioPesquisa() {
    const form = document.getElementById('form-pesquisa');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nps = document.querySelector('.nps-btn.selected')?.dataset.value;
            const qualidadeElement = document.getElementById('qualidade');
            const instrutorElement = document.getElementById('instrutor');
            const comentariosElement = document.getElementById('comentarios');
            
            if (!qualidadeElement || !instrutorElement || !comentariosElement) {
                alert('Elementos do formulário não encontrados.');
                return;
            }
            
            const qualidade = qualidadeElement.value;
            const instrutor = instrutorElement.value;
            const comentarios = comentariosElement.value;
            
            if (!nps) {
                alert('Por favor, selecione uma nota de 0 a 10.');
                return;
            }
            
            if (!qualidade || !instrutor) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            const resposta = {
                id: Date.now(),
                nps: parseInt(nps),
                qualidade: qualidade,
                instrutor: instrutor,
                comentarios: comentarios,
                timestamp: new Date().toISOString()
            };
            
            try {
                if (window.databaseService && !window.databaseService.isLocalStorage) {
                    // Salvar no SQLite
                    const success = await window.databaseService.addSurveyResponse(resposta);
                    if (success) {
                        pesquisas.push(resposta);
                    }
                } else {
                    // Fallback para localStorage
                    pesquisas.push(resposta);
                    salvarDados();
                }
                
                // Limpar formulário
                form.reset();
                const npsButtons = document.querySelectorAll('.nps-btn');
                if (npsButtons.length > 0) {
                    npsButtons.forEach(btn => {
                        if (btn && btn.classList) {
                            btn.classList.remove('selected');
                        }
                    });
                }
                
                // Atualizar resultados
                atualizarResultadosPesquisa();
                
                alert('Obrigado pela sua avaliação!');
                
            } catch (error) {
                console.error('Erro ao salvar pesquisa:', error);
                alert('Erro ao salvar pesquisa. Tente novamente.');
            }
        });
    }
}

// Atualizar resultados da pesquisa
function atualizarResultadosPesquisa() {
    if (pesquisas.length === 0) {
        document.getElementById('total-respostas').textContent = '0';
        document.getElementById('promotores').textContent = '0';
        document.getElementById('neutros').textContent = '0';
        document.getElementById('detratores').textContent = '0';
        document.getElementById('nps-final').textContent = '-';
        return;
    }
    
    // Calcular categorias NPS
    let promotores = 0, neutros = 0, detratores = 0;
    pesquisas.forEach(p => {
        if (p.nps >= 9) promotores++;
        else if (p.nps >= 7) neutros++;
        else detratores++;
    });
    
    // Calcular NPS Score: (% Promotores - % Detratores)
    const totalRespostas = pesquisas.length;
    const percentualPromotores = (promotores / totalRespostas) * 100;
    const percentualDetratores = (detratores / totalRespostas) * 100;
    const npsScore = Math.round(percentualPromotores - percentualDetratores);
    
    // Atualizar elementos que existem no HTML
    document.getElementById('total-respostas').textContent = totalRespostas;
    document.getElementById('promotores').textContent = promotores;
    document.getElementById('neutros').textContent = neutros;
    document.getElementById('detratores').textContent = detratores;
    document.getElementById('nps-final').textContent = npsScore;
    
    atualizarGraficos();
}

// Atualizar gráficos
function atualizarGraficos() {
    criarGraficoNPS();
    criarGraficoQualidade();
    criarGraficoInstrutor();
}

// Limpar gráficos
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

// Criar gráfico NPS
function criarGraficoNPS() {
    const ctx = document.getElementById('npsChart');
    if (!ctx || pesquisas.length === 0) return;
    
    if (npsChart) npsChart.destroy();
    
    const npsData = Array(11).fill(0);
    pesquisas.forEach(p => npsData[p.nps]++);
    
    npsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [{
                label: 'Respostas',
                data: npsData,
                backgroundColor: npsData.map((_, index) => {
                    if (index <= 6) return '#ff6b6b'; // Detratores
                    if (index <= 8) return '#feca57'; // Neutros
                    return '#48ca48'; // Promotores
                }),
                borderColor: npsData.map((_, index) => {
                    if (index <= 6) return '#ee5a52';
                    if (index <= 8) return '#ff9ff3';
                    return '#40a040';
                }),
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
                legend: {
                    display: false
                }
            }
        }
    });
}

// Criar gráfico de qualidade do evento
function criarGraficoQualidade() {
    const ctx = document.getElementById('qualityChart');
    if (!ctx || pesquisas.length === 0) return;
    
    if (qualidadeChart) qualidadeChart.destroy();
    
    // Contar avaliações de qualidade
    const qualidadeCount = {
        'excelente': 0,
        'muito-bom': 0,
        'bom': 0,
        'regular': 0,
        'ruim': 0
    };
    
    pesquisas.forEach(p => {
        if (p.qualidade && qualidadeCount.hasOwnProperty(p.qualidade)) {
            qualidadeCount[p.qualidade]++;
        }
    });
    
    qualidadeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Excelente', 'Muito Bom', 'Bom', 'Regular', 'Ruim'],
            datasets: [{
                data: [
                    qualidadeCount['excelente'],
                    qualidadeCount['muito-bom'],
                    qualidadeCount['bom'],
                    qualidadeCount['regular'],
                    qualidadeCount['ruim']
                ],
                backgroundColor: [
                    '#4CAF50',
                    '#8BC34A',
                    '#FFC107',
                    '#FF9800',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Criar gráfico de instrutor
function criarGraficoInstrutor() {
    const ctx = document.getElementById('instrutorChart');
    if (!ctx || pesquisas.length === 0) return;
    
    if (instrutorChart) instrutorChart.destroy();
    
    // Contar avaliações do instrutor
    const instrutorCount = {
        'excelente': 0,
        'muito-bom': 0,
        'bom': 0,
        'regular': 0,
        'ruim': 0
    };
    
    pesquisas.forEach(p => {
        if (p.instrutor && instrutorCount.hasOwnProperty(p.instrutor)) {
            instrutorCount[p.instrutor]++;
        }
    });
    
    instrutorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Excelente', 'Muito Bom', 'Bom', 'Regular', 'Ruim'],
            datasets: [{
                label: 'Avaliação do Instrutor',
                data: [
                    instrutorCount['excelente'],
                    instrutorCount['muito-bom'],
                    instrutorCount['bom'],
                    instrutorCount['regular'],
                    instrutorCount['ruim']
                ],
                backgroundColor: [
                    '#4CAF50',
                    '#8BC34A',
                    '#FFC107',
                    '#FF9800',
                    '#F44336'
                ],
                borderColor: [
                    '#388E3C',
                    '#689F38',
                    '#F57C00',
                    '#E65100',
                    '#D32F2F'
                ],
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
                legend: {
                    display: false
                }
            }
        }
    });
}

// Limpar respostas da pesquisa
function limparRespostasPesquisa() {
    if (confirm('Tem certeza que deseja limpar todas as respostas da pesquisa?')) {
        try {
            if (window.databaseService && !window.databaseService.isLocalStorage) {
                // Limpar do SQLite
                window.databaseService.clearSurveyResponses();
            }
            
            pesquisas = [];
            salvarDados();
            
            atualizarResultadosPesquisa();
            limparGraficos();
            
            alert('Respostas da pesquisa foram limpas.');
            
        } catch (error) {
            console.error('Erro ao limpar pesquisas:', error);
            alert('Erro ao limpar pesquisas. Tente novamente.');
        }
    }
}

// Salvar dados no localStorage
function salvarDados() {
    try {
        const dados = {
            participantes: participantes,
            pesquisas: pesquisas,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('sistemaPresenca', JSON.stringify(dados));
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

// Atualizar indicador de presença
function atualizarIndicadorPresenca() {
    const presentes = participantes.filter(p => p.presente || p.present).length;
    const total = participantes.length;
    const ausentes = total - presentes;
    const percentualPresenca = total > 0 ? Math.round((presentes / total) * 100) : 0;
    
    // Atualizar elementos do módulo principal
    const totalElement = document.getElementById('total-participantes');
    const presentesElement = document.getElementById('total-presentes');
    
    if (totalElement) totalElement.textContent = total;
    if (presentesElement) presentesElement.textContent = presentes;
    
    // Atualizar elementos do indicador de presença (admin)
    const presentesCountElement = document.getElementById('presentes-count');
    const ausentesCountElement = document.getElementById('ausentes-count');
    const percentualPresencaElement = document.getElementById('percentual-presenca');
    
    if (presentesCountElement) presentesCountElement.textContent = presentes;
    if (ausentesCountElement) ausentesCountElement.textContent = ausentes;
    if (percentualPresencaElement) percentualPresencaElement.textContent = `${percentualPresenca}%`;
    
    // Atualizar gráfico de presença se existir
    atualizarGraficoPresenca(presentes, ausentes);
}

// Atualizar gráfico de presença
function atualizarGraficoPresenca(presentes, ausentes) {
    const ctx = document.getElementById('presenceChart');
    if (!ctx) return;
    
    if (window.presencaChart) {
        window.presencaChart.destroy();
    }
    
    window.presencaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presentes', 'Ausentes'],
            datasets: [{
                data: [presentes, ausentes],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Filtrar participantes
function filtrarParticipantes() {
    const filtroElement = document.getElementById('filtro-participantes');
    const statusFiltroElement = document.getElementById('filtro-status');
    
    if (!filtroElement || !statusFiltroElement) {
        console.error('Elementos de filtro não encontrados');
        return;
    }
    
    const filtro = filtroElement.value.toLowerCase();
    const statusFiltro = statusFiltroElement.value;
    
    const participantesFiltrados = participantes.filter(p => {
        const nomeMatch = (p.nome || p.name || '').toLowerCase().includes(filtro);
        const deptoMatch = (p.departamento || p.department || '').toLowerCase().includes(filtro);
        const textoMatch = nomeMatch || deptoMatch;
        
        let statusMatch = true;
        if (statusFiltro === 'presente') {
            statusMatch = p.presente;
        } else if (statusFiltro === 'ausente') {
            statusMatch = !p.presente;
        }
        
        return textoMatch && statusMatch;
    });
    
    // Atualizar lista com participantes filtrados
    const lista = document.getElementById('lista-participantes');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    participantesFiltrados.forEach(participante => {
        const li = document.createElement('li');
        li.className = `participante ${participante.presente ? 'presente' : 'ausente'}`;
        
        li.innerHTML = `
            <div class="info-participante">
                <span class="nome">${participante.nome || participante.name}</span>
                <span class="departamento">${participante.departamento || participante.department}</span>
                ${participante.presente && participante.horarioCheckin ? 
                    `<span class="horario">Check-in: ${new Date(participante.horarioCheckin).toLocaleTimeString()}</span>` : ''}
            </div>
            <div class="acoes-participante">
                <button onclick="togglePresenca(${participante.id})" class="btn-presenca">
                    ${participante.presente ? 'Marcar Ausente' : 'Marcar Presente'}
                </button>
                <button onclick="removerParticipante(${participante.id})" class="btn-remover">Remover</button>
            </div>
        `;
        
        lista.appendChild(li);
    });
}

// Limpar pesquisa
function limparPesquisa() {
    const filtroElement = document.getElementById('filtro-participantes');
    const statusElement = document.getElementById('filtro-status');
    
    if (filtroElement) filtroElement.value = '';
    if (statusElement) statusElement.value = 'todos';
    
    atualizarListaParticipantes();
}

// Processar arquivo Excel
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
            let erros = 0;
            
            // Mostrar progresso
            const progressDiv = document.createElement('div');
            progressDiv.innerHTML = '<p>Processando arquivo Excel...</p>';
            document.body.appendChild(progressDiv);
            
            // Processar cada linha (pular cabeçalho)
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row.length >= 2 && row[0] && row[1]) {
                    const nome = row[0].toString().trim();
                    const departamento = row[1].toString().trim();
                    
                    // Verificar duplicatas
                    if (participantes.find(p => p.nome?.toLowerCase() === nome.toLowerCase())) {
                        duplicados++;
                        continue;
                    }
                    
                    try {
                        // Adicionar participante
                        const participante = {
                            id: Date.now() + i,
                            nome: nome,
                            departamento: departamento,
                            presente: false,
                            horarioCheckIn: null
                        };
                        
                        participantes.push(participante);
                        adicionados++;
                        
                    } catch (error) {
                        console.error('Erro ao adicionar participante:', error);
                        erros++;
                    }
                }
            }
            
            // Salvar dados
            salvarDados();
            
            // Atualizar interface
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
            // Remover progresso
            document.body.removeChild(progressDiv);
            
            // Mostrar resultado
            alert(`Importação concluída!\nAdicionados: ${adicionados}\nDuplicados: ${duplicados}\nErros: ${erros}`);
            
        } catch (error) {
            console.error('Erro ao processar Excel:', error);
            alert('Erro ao processar arquivo Excel. Verifique o formato.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Baixar modelo Excel
function baixarModeloExcel() {
    const dados = [
        ['Nome', 'Departamento'],
        ['João Silva', 'TI'],
        ['Maria Santos', 'RH'],
        ['Pedro Oliveira', 'Vendas']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    
    XLSX.writeFile(wb, 'modelo_participantes.xlsx');
}

// Exportar dados
function exportarDados() {
    const dados = [
        ['Nome', 'Departamento', 'Presente', 'Horário Check-in']
    ];
    
    participantes.forEach(p => {
        dados.push([
            p.nome || p.name,
            p.departamento || p.department,
            p.presente ? 'Sim' : 'Não',
            p.presente && p.horarioCheckin ? new Date(p.horarioCheckin).toLocaleString() : ''
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    
    XLSX.writeFile(wb, `participantes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Limpar lista de participantes
async function limparListaParticipantes() {
    if (confirm('Tem certeza que deseja limpar toda a lista de participantes?')) {
        try {
            if (window.databaseService && !window.databaseService.isLocalStorage) {
                // Limpar do SQLite
                window.databaseService.clearParticipants();
            }
            
            participantes = [];
            salvarDados();
            
            atualizarListaParticipantes();
            atualizarIndicadorPresenca();
            
            alert('Lista de participantes foi limpa.');
            
        } catch (error) {
            console.error('Erro ao limpar participantes:', error);
            alert('Erro ao limpar participantes. Tente novamente.');
        }
    }
}

// Limpar todos os dados
async function limparDados() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
        try {
            if (window.databaseService && !window.databaseService.isLocalStorage) {
                // Limpar do SQLite
                window.databaseService.clearAll();
            }
            
            participantes = [];
            pesquisas = [];
            
            localStorage.removeItem('sistemaPresenca');
            
            atualizarListaParticipantes();
            atualizarResultadosPesquisa();
            atualizarIndicadorPresenca();
            limparGraficos();
            
            alert('Todos os dados foram limpos.');
            
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            alert('Erro ao limpar dados. Tente novamente.');
        }
    }
}

// Configurar upload de imagem
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

// Processar imagem de capa
function processarImagemCapa(file) {
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagemSrc = e.target.result;
        
        // Salvar no localStorage
        localStorage.setItem('imagemCapa', imagemSrc);
        
        // Exibir imagem
        exibirImagemCapa(imagemSrc);
        
        // Aplicar no cabeçalho
        aplicarImagemCabecalho(imagemSrc);
    };
    
    reader.readAsDataURL(file);
}

// Exibir imagem de capa
function exibirImagemCapa(imagemSrc) {
    const preview = document.getElementById('preview-imagem');
    if (preview) {
        preview.innerHTML = `
            <img src="${imagemSrc}" alt="Imagem de Capa" style="max-width: 200px; max-height: 150px;">
            <button onclick="removerImagemCapa()" class="btn-remover">Remover Imagem</button>
        `;
    }
}

// Remover imagem de capa
function removerImagemCapa() {
    if (confirm('Tem certeza que deseja remover a imagem de capa?')) {
        localStorage.removeItem('imagemCapa');
        
        const preview = document.getElementById('preview-imagem');
        if (preview) {
            preview.innerHTML = '<p>Nenhuma imagem selecionada</p>';
        }
        
        // Remover do cabeçalho
        const header = document.querySelector('.header');
        if (header) {
            header.style.backgroundImage = '';
            header.style.backgroundColor = '';
        }
    }
}

// Carregar imagem de capa
function carregarImagemCapa() {
    const imagemSalva = localStorage.getItem('imagemCapa');
    if (imagemSalva) {
        exibirImagemCapa(imagemSalva);
        aplicarImagemCabecalho(imagemSalva);
    }
}

// Sistema de autenticação admin
const SENHA_ADMIN = "admin123";
let currentUser = null;

function showAdminLogin() {
    const modalElement = document.getElementById('admin-login-modal');
    if (modalElement) modalElement.style.display = 'block';
}

function closeAdminLogin() {
    const modalElement = document.getElementById('admin-login-modal');
    if (modalElement) modalElement.style.display = 'none';
}

async function autenticarAdmin(event) {
    event.preventDefault();
    
    const senhaElement = document.getElementById('admin-password');
    
    if (!senhaElement) {
        alert('Campo de senha não encontrado.');
        return;
    }
    
    const senha = senhaElement.value;
    
    if (senha === SENHA_ADMIN) {
        currentUser = { role: 'admin', loginTime: new Date() };
        localStorage.setItem('adminSession', JSON.stringify(currentUser));
        
        closeAdminLogin();
        loginSuccess();
        
        senhaElement.value = '';
    } else {
        loginFailed();
    }
}

function loginSuccess() {
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    
    if (adminPanel) {
        adminPanel.style.display = 'block';
        // Garantir que o módulo administrador seja exibido
        showModule('admin');
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    alert('Login realizado com sucesso!');
}

function loginFailed() {
    alert('Senha incorreta!');
    const senhaElement = document.getElementById('admin-password');
    if (senhaElement) senhaElement.value = '';
}

async function logoutAdmin() {
    if (confirm('Tem certeza que deseja fazer logout?')) {
        currentUser = null;
        localStorage.removeItem('adminSession');
        
        const adminPanel = document.getElementById('admin-panel');
        const loginBtn = document.getElementById('admin-login-btn');
        const logoutBtn = document.getElementById('admin-logout-btn');
        
        if (adminPanel) adminPanel.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        alert('Logout realizado com sucesso!');
    }
}

async function verificarLoginAdmin() {
    const session = localStorage.getItem('adminSession');
    if (session) {
        try {
            currentUser = JSON.parse(session);
            const loginTime = new Date(currentUser.loginTime);
            const now = new Date();
            const diffHours = (now - loginTime) / (1000 * 60 * 60);
            
            if (diffHours < 24) {
                loginSuccess();
            } else {
                localStorage.removeItem('adminSession');
                currentUser = null;
            }
        } catch (error) {
            localStorage.removeItem('adminSession');
            currentUser = null;
        }
    }
}

async function setupAuthListener() {
    // Configurar eventos de autenticação se necessário
}

function aplicarImagemCabecalho(imagemSrc) {
    const header = document.querySelector('.header');
    if (header) {
        header.style.backgroundImage = `url(${imagemSrc})`;
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarImagemCapa();
    verificarDadosCompartilhados();
});

// Função para gerar link de compartilhamento
function gerarLinkCompartilhamento() {
    try {
        const dados = {
            participantes: participantes,
            pesquisas: pesquisas,
            timestamp: new Date().toISOString()
        };
        
        const dadosComprimidos = btoa(JSON.stringify(dados));
        const urlAtual = window.location.origin + window.location.pathname;
        const linkCompartilhamento = `${urlAtual}?dados=${dadosComprimidos}`;
        
        // Criar modal para exibir o link
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-share-alt"></i> Link de Compartilhamento</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Use este link para compartilhar os dados com outros dispositivos:</p>
                    <div style="margin: 15px 0;">
                        <textarea id="linkCompartilhamento" readonly style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px;">${linkCompartilhamento}</textarea>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="copiarLink()" class="btn-primary">
                            <i class="fas fa-copy"></i> Copiar Link
                        </button>
                        <button onclick="gerarQRCode('${linkCompartilhamento}')" class="btn-secondary">
                            <i class="fas fa-qrcode"></i> Gerar QR Code
                        </button>
                    </div>
                    <div id="qrcode-container" style="text-align: center; margin-top: 15px;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Erro ao gerar link de compartilhamento:', error);
        alert('Erro ao gerar link de compartilhamento. Os dados podem ser muito grandes.');
    }
}

// Função para copiar link
function copiarLink() {
    const textarea = document.getElementById('linkCompartilhamento');
    textarea.select();
    document.execCommand('copy');
    
    // Feedback visual
    const btn = event.target.closest('button');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.innerHTML = textoOriginal;
        btn.style.background = '';
    }, 2000);
}

// Função para gerar QR Code (versão simples)
function gerarQRCode(url) {
    const container = document.getElementById('qrcode-container');
    container.innerHTML = `
        <p>QR Code gerado:</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" 
             alt="QR Code" style="border: 1px solid #ddd; padding: 10px; background: white;">
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Escaneie este QR Code para acessar os dados em outro dispositivo
        </p>
    `;
}

// Função para verificar dados compartilhados na URL
function verificarDadosCompartilhados() {
    const urlParams = new URLSearchParams(window.location.search);
    const dadosCompartilhados = urlParams.get('dados');
    
    if (dadosCompartilhados) {
        try {
            const dados = JSON.parse(atob(dadosCompartilhados));
            
            // Confirmar se o usuário quer carregar os dados
            if (confirm('Dados compartilhados detectados! Deseja carregar estes dados?\n\n' +
                       `Participantes: ${dados.participantes?.length || 0}\n` +
                       `Pesquisas: ${dados.pesquisas?.length || 0}\n` +
                       `Data: ${dados.timestamp ? new Date(dados.timestamp).toLocaleString() : 'N/A'}`)) {
                
                // Carregar dados compartilhados
                if (dados.participantes) {
                    participantes = dados.participantes;
                }
                if (dados.pesquisas) {
                    pesquisas = dados.pesquisas;
                }
                
                // Atualizar interface
                atualizarListaParticipantes();
                atualizarResultadosPesquisa();
                atualizarIndicadorPresenca();
                
                // Salvar dados localmente
                salvarDados();
                
                // Limpar URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                alert('Dados carregados com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao carregar dados compartilhados:', error);
            alert('Erro ao carregar dados compartilhados. Link pode estar corrompido.');
        }
    }
}