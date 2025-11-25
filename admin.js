// ========================================
// DADOS DE EXEMPLO (Mock Data)
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
        rua: 'Av. Paulista',
        numero: '1000',
        cep: '01310-100',
        tipo: 'templo-afrodite',
        tipoNome: 'Templo de Afrodite',
        quantidade: 1,
        valor: 165,
        emergencial: false,
        status: 'concluida'
    },
    {
        id: 3,
        data: '2025-11-22',
        nome: 'Ana Paula Costa',
        cpf: '456.789.123-00',
        email: 'ana@email.com',
        telefone: '(21) 99876-5432',
        dataNascimento: '1992-03-10',
        rua: 'Rua do Comércio',
        numero: '456',
        cep: '20000-000',
        tipo: 'carta-canalizada',
        tipoNome: 'Carta Canalizada',
        quantidade: 1,
        valor: 200,
        emergencial: true,
        status: 'pendente'
    },
    {
        id: 4,
        data: '2025-11-23',
        nome: 'Carlos Eduardo',
        cpf: '321.654.987-00',
        email: 'carlos@email.com',
        telefone: '(11) 94567-8901',
        dataNascimento: '1988-12-05',
        rua: 'Rua das Acácias',
        numero: '789',
        cep: '04000-000',
        tipo: 'previsao-anual',
        tipoNome: 'Previsão Anual',
        quantidade: 1,
        valor: 400,
        emergencial: false,
        status: 'concluida'
    },
    {
        id: 5,
        data: '2025-11-24',
        nome: 'Fernanda Lima',
        cpf: '789.123.456-00',
        email: 'fernanda@email.com',
        telefone: '(11) 93456-7890',
        dataNascimento: '1995-07-18',
        rua: 'Rua dos Pinheiros',
        numero: '321',
        cep: '05000-000',
        tipo: 'tem-traicao',
        tipoNome: 'Tem Traição?',
        quantidade: 1,
        valor: 280,
        emergencial: false,
        status: 'pendente'
    }
];

let tiragensFiltradas = [...tiragensData];
let paginaAtual = 1;
const itensPorPagina = 10;

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Define mês atual no filtro
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filtro-mes').value = mesAtual;
    
    // Adiciona listener para atualizar estatísticas quando mudar o mês
    document.getElementById('filtro-mes').addEventListener('change', atualizarEstatisticas);
    
    carregarTiragens();
    atualizarEstatisticas();
});

// ========================================
// FILTROS
// ========================================
function aplicarFiltros() {
    const filtroNome = document.getElementById('filtro-nome').value.toLowerCase();
    const filtroCpf = document.getElementById('filtro-cpf').value;
    const filtroTiragem = document.getElementById('filtro-tiragem').value;
    const filtroData = document.getElementById('filtro-data').value;

    tiragensFiltradas = tiragensData.filter(tiragem => {
        const matchNome = !filtroNome || tiragem.nome.toLowerCase().includes(filtroNome);
        const matchCpf = !filtroCpf || tiragem.cpf.includes(filtroCpf);
        const matchTiragem = !filtroTiragem || tiragem.tipo === filtroTiragem;
        const matchData = !filtroData || tiragem.data === filtroData;

        return matchNome && matchCpf && matchTiragem && matchData;
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
    paginaAtual = 1;
    carregarTiragens();
}

// ========================================
// CARREGAMENTO DE DADOS
// ========================================
function carregarTiragens() {
    const tabela = document.getElementById('tabela-tiragens');
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const tiragensExibidas = tiragensFiltradas.slice(inicio, fim);

    // Limpa tabela
    tabela.innerHTML = '';

    // Adiciona linhas
    if (tiragensExibidas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-purple-300">
                    Nenhuma tiragem encontrada
                </td>
            </tr>
        `;
    } else {
        tiragensExibidas.forEach(tiragem => {
            const statusClass = tiragem.status === 'concluida' ? 'bg-green-900/30 text-green-400 border-green-500/50' : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
            const statusTexto = tiragem.status === 'concluida' ? '✓ Concluída' : '⏳ Pendente';
            
            // Mostra quantidade se for pergunta-avulsa ou templo-afrodite
            let tipoExibido = tiragem.tipoNome;
            if (tiragem.tipo === 'pergunta-avulsa' || tiragem.tipo === 'templo-afrodite') {
                tipoExibido += ` (${tiragem.quantidade})`;
            }

            const row = `
                <tr class="border-b border-purple-500/20 hover:bg-purple-900/20 transition">
                    <td class="py-3 px-4 whitespace-nowrap">${formatarData(tiragem.data)}</td>
                    <td class="py-3 px-4">${tiragem.nome}</td>
                    <td class="py-3 px-4 whitespace-nowrap">${tiragem.cpf}</td>
                    <td class="py-3 px-4">${tipoExibido}</td>
                    <td class="py-3 px-4 font-bold whitespace-nowrap">R$ ${tiragem.valor}</td>
                    <td class="py-3 px-4">
                        <span class="px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${statusClass}">
                            ${statusTexto}
                        </span>
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap">
                        <button onclick="verDetalhes(${tiragem.id})" class="text-purple-400 hover:text-purple-300 font-bold">
                            👁️ Ver
                        </button>
                    </td>
                </tr>
            `;
            tabela.innerHTML += row;
        });
    }

    // Atualiza paginação
    document.getElementById('page-start').textContent = tiragensExibidas.length > 0 ? inicio + 1 : 0;
    document.getElementById('page-end').textContent = Math.min(fim, tiragensFiltradas.length);
    document.getElementById('page-total').textContent = tiragensFiltradas.length;
    document.getElementById('total-registros').textContent = `${tiragensFiltradas.length} registro${tiragensFiltradas.length !== 1 ? 's' : ''}`;
}

// ========================================
// ESTATÍSTICAS
// ========================================
function atualizarEstatisticas() {
    const filtroMes = document.getElementById('filtro-mes').value;
    
    // Filtra dados para o mês selecionado ou mês atual
    let dadosFiltrados = tiragensData;
    if (filtroMes) {
        dadosFiltrados = tiragensData.filter(t => t.data.startsWith(filtroMes));
    } else {
        // Mês atual por padrão
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        dadosFiltrados = tiragensData.filter(t => t.data.startsWith(mesAtual));
    }
    
    const total = dadosFiltrados.length;
    const concluidas = dadosFiltrados.filter(t => t.status === 'concluida').length;
    const pendentes = dadosFiltrados.filter(t => t.status === 'pendente').length;
    const faturamento = dadosFiltrados.reduce((sum, t) => sum + t.valor, 0);

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-concluidas').textContent = concluidas;
    document.getElementById('stat-pendentes').textContent = pendentes;
    document.getElementById('stat-faturamento').textContent = formatarMoeda(faturamento);
}

// ========================================
// MODAL DE DETALHES
// ========================================
function verDetalhes(id) {
    const tiragem = tiragensData.find(t => t.id === id);
    if (!tiragem) return;

    const modal = document.getElementById('modal-detalhes');
    const conteudo = document.getElementById('modal-conteudo');

    const statusClass = tiragem.status === 'concluida' ? 'text-green-400' : 'text-yellow-400';
    const statusTexto = tiragem.status === 'concluida' ? '✓ Concluída' : '⏳ Pendente';

    conteudo.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <h3 class="font-bold text-purple-300 mb-2">Informações Pessoais</h3>
                <div class="space-y-2 text-sm">
                    <p><strong>Nome:</strong> ${tiragem.nome}</p>
                    <p><strong>CPF:</strong> ${tiragem.cpf}</p>
                    <p><strong>Email:</strong> ${tiragem.email}</p>
                    <p><strong>WhatsApp:</strong> ${tiragem.telefone}</p>
                    <p><strong>Data de Nascimento:</strong> ${formatarData(tiragem.dataNascimento)}</p>
                </div>
            </div>

            <div>
                <h3 class="font-bold text-purple-300 mb-2">Endereço</h3>
                <div class="space-y-2 text-sm">
                    <p><strong>Rua:</strong> ${tiragem.rua}</p>
                    <p><strong>Número:</strong> ${tiragem.numero}</p>
                    <p><strong>CEP:</strong> ${tiragem.cep}</p>
                </div>
            </div>

            <div>
                <h3 class="font-bold text-purple-300 mb-2">Detalhes da Tiragem</h3>
                <div class="space-y-2 text-sm">
                    <p><strong>Tipo:</strong> ${tiragem.tipoNome}</p>
                    <p><strong>Quantidade:</strong> ${tiragem.quantidade}</p>
                    <p><strong>Valor:</strong> R$ ${tiragem.valor}</p>
                    <p><strong>Emergencial:</strong> ${tiragem.emergencial ? 'Sim' : 'Não'}</p>
                    <p><strong>Data do Pedido:</strong> ${formatarData(tiragem.data)}</p>
                </div>
            </div>

            <div>
                <h3 class="font-bold text-purple-300 mb-2">Status</h3>
                <div class="space-y-2 text-sm">
                    <p class="${statusClass} font-bold text-lg">${statusTexto}</p>
                </div>
            </div>
        </div>

        <div class="mt-6 flex gap-4">
            <button onclick="alterarStatus(${tiragem.id})" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg transition">
                Alterar Status
            </button>
            <button onclick="fecharModal()" class="bg-purple-900/50 hover:bg-purple-900/70 text-white font-bold px-6 py-2 rounded-lg transition border border-purple-500">
                Fechar
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function fecharModal() {
    const modal = document.getElementById('modal-detalhes');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function alterarStatus(id) {
    const tiragem = tiragensData.find(t => t.id === id);
    if (!tiragem) return;

    tiragem.status = tiragem.status === 'pendente' ? 'concluida' : 'pendente';
    
    carregarTiragens();
    atualizarEstatisticas();
    
    // Reabre o modal com os dados atualizados
    verDetalhes(id);
}

// ========================================
// PAGINAÇÃO
// ========================================
function proximaPagina() {
    const totalPaginas = Math.ceil(tiragensFiltradas.length / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        carregarTiragens();
    }
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        carregarTiragens();
    }
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
