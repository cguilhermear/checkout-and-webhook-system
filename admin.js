// ========================================
// DADOS MOCK
// ========================================
let tiragensData = [
    {
        id: 1,
        data: '2025-11-20',
        nome: 'Maria Silva',
        cpf: '123.456.789-00',
        email: 'maria@email.com',
        telefone: '(11) 98765-4321',
        dataNascimento: '1990-05-15',
        cidade: 'São Paulo',
        rua: 'Rua das Flores',
        numero: '123',
        cep: '12345-678',
        tipo: 'pergunta-avulsa',
        tipoNome: 'Pergunta Avulsa',
        quantidade: 2,
        valor: 132,
        emergencial: false,
        status: 'pendente'
    },
    {
        id: 2,
        data: '2025-11-21',
        nome: 'João Santos',
        cpf: '987.654.321-00',
        email: 'joao@email.com',
        telefone: '(11) 91234-5678',
        dataNascimento: '1985-08-20',
        cidade: 'São Paulo',
        rua: 'Av. Paulista',
        numero: '1000',
        cep: '01310-100',
        tipo: 'templo-afrodite',
        tipoNome: 'Templo de Afrodite',
        quantidade: 1,
        valor: 165,
        emergencial: false,
        status: 'concluida'
    }
];

let tiragensFiltradas = [...tiragensData];
let paginaAtual = 1;
const itensPorPagina = 10;

let agendaManualFechada = false;
const LIMITE_DIARIO = 14;

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filtro-mes').value = mesAtual;

    carregarTiragens();
    atualizarEstatisticas();
    atualizarAgenda();
});

// ========================================
// AGENDA
// ========================================
function atualizarAgenda() {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    const atendimentosHoje = tiragensData.filter(t => t.data === hojeStr).length;

    const diaSemana = hoje.getDay(); // 0 domingo, 6 sábado
    const fimDeSemana = (diaSemana === 0 || diaSemana === 6);

    let status = 'aberta';

    if (agendaManualFechada) status = 'fechada';
    else if (fimDeSemana) status = 'fechada';
    else if (atendimentosHoje >= LIMITE_DIARIO) status = 'fechada';

    atualizarUIAgenda(atendimentosHoje, status);
}

function atualizarUIAgenda(total, status) {
    const contador = document.getElementById('agenda-contador');
    const badge = document.getElementById('agenda-status-badge');
    const barra = document.getElementById('agenda-barra');
    const btn = document.getElementById('btn-toggle-agenda');

    contador.textContent = `${total} / ${LIMITE_DIARIO}`;

    const porcentagem = Math.min((total / LIMITE_DIARIO) * 100, 100);
    barra.style.width = porcentagem + '%';

    if (status === 'aberta') {
        badge.className = "px-4 py-2 rounded-full text-sm font-bold border bg-green-900/40 text-green-400 border-green-500";
        badge.textContent = "🟢 Agenda Aberta";
        btn.textContent = "Fechar Agenda";
    } else {
        badge.className = "px-4 py-2 rounded-full text-sm font-bold border bg-red-900/40 text-red-400 border-red-500";
        badge.textContent = "🔴 Agenda Fechada";
        btn.textContent = "Abrir Agenda";
    }
}

function toggleAgendaManual() {
    agendaManualFechada = !agendaManualFechada;
    atualizarAgenda();
}

// ========================================
// FILTROS
// ========================================
function aplicarFiltros() {
    const nome = document.getElementById('filtro-nome').value.toLowerCase();
    const cpf = document.getElementById('filtro-cpf').value;
    const tipo = document.getElementById('filtro-tiragem').value;
    const data = document.getElementById('filtro-data').value;

    tiragensFiltradas = tiragensData.filter(t => {
        return (!nome || t.nome.toLowerCase().includes(nome)) &&
               (!cpf || t.cpf.includes(cpf)) &&
               (!tipo || t.tipo === tipo) &&
               (!data || t.data === data);
    });

    paginaAtual = 1;
    carregarTiragens();
}

function limparFiltros() {
    document.getElementById('filtro-nome').value = '';
    document.getElementById('filtro-cpf').value = '';
    document.getElementById('filtro-tiragem').value = '';
    document.getElementById('filtro-data').value = '';

    tiragensFiltradas = [...tiragensData];
    carregarTiragens();
}

// ========================================
// TABELA
// ========================================
function carregarTiragens() {
    const tabela = document.getElementById('tabela-tiragens');
    tabela.innerHTML = '';

    tiragensFiltradas.forEach(t => {
        const statusClass = t.status === 'concluida'
            ? 'bg-green-900/30 text-green-400 border-green-500/50'
            : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';

        tabela.innerHTML += `
        <tr class="border-b border-purple-500/20 hover:bg-purple-900/20 transition">
            <td class="py-3 px-4">${formatarData(t.data)}</td>
            <td class="py-3 px-4">${t.nome}</td>
            <td class="py-3 px-4">${t.cpf}</td>
            <td class="py-3 px-4">${t.cidade || ''}</td>
            <td class="py-3 px-4">${t.rua || ''}</td>
            <td class="py-3 px-4">${t.numero || ''}</td>
            <td class="py-3 px-4">${t.cep || ''}</td>
            <td class="py-3 px-4">${t.tipoNome}</td>
            <td class="py-3 px-4 font-bold">R$ ${t.valor}</td>
            <td class="py-3 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                    ${t.status === 'concluida' ? '✓ Concluída' : '⏳ Pendente'}
                </span>
            </td>
            <td class="py-3 px-4">
                <button onclick="verDetalhes(${t.id})" class="text-purple-400 hover:text-purple-300 font-bold">👁️ Ver</button>
            </td>
        </tr>`;
    });

    atualizarEstatisticas();
}

// ========================================
// ESTATÍSTICAS
// ========================================
function atualizarEstatisticas() {
    document.getElementById('stat-total').textContent = tiragensData.length;
    document.getElementById('stat-concluidas').textContent =
        tiragensData.filter(t => t.status === 'concluida').length;
    document.getElementById('stat-pendentes').textContent =
        tiragensData.filter(t => t.status === 'pendente').length;

    const faturamento = tiragensData.reduce((s, t) => s + t.valor, 0);
    document.getElementById('stat-faturamento').textContent = formatarMoeda(faturamento);
}

// ========================================
// MODAL
// ========================================
function verDetalhes(id) {
    const tiragem = tiragensData.find(t => t.id === id);
    if (!tiragem) return;

    alert(`Cliente: ${tiragem.nome}\nCPF: ${tiragem.cpf}\nValor: R$ ${tiragem.valor}`);
}

// ========================================
// EXPORTAR CSV
// ========================================
function exportarCSV() {
    let csv = "Data,Nome,CPF,Cidade,Rua,Número,CEP,Tipo,Valor,Status\n";

    tiragensData.forEach(t => {
        csv += `${t.data},${t.nome},${t.cpf},${t.cidade},${t.rua},${t.numero},${t.cep},${t.tipoNome},${t.valor},${t.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_tiragens.csv";
    link.click();
}

// ========================================
// UTILITÁRIOS
// ========================================
function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}
