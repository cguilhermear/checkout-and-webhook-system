// ========================================
// CONFIG E ESTADO
// ========================================
const API_URL = "http://localhost:3000";
let tiragensData = [];
let tiragensFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 10;
const LIMITE_DIARIO = 14;

// ========================================
// INICIALIZAÇÃO E AUTH
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();

    // Setup login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Initial Filters
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filtro-mes').value = mesAtual;
});

function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        showLogin();
    } else {
        loadDashboard();
    }
}

function showLogin() {
    document.getElementById('login-modal').classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('admin_token', data.token);
            document.getElementById('login-modal').classList.add('hidden');
            loadDashboard();
        } else {
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor');
    }
}

function getAuthHeader() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
    };
}

// ========================================
// CARREGAMENTO DE DADOS
// ========================================
async function loadDashboard() {
    await Promise.all([
        carregarTiragens(),
        atualizarAgenda()
    ]);
}

async function carregarTiragens() {
    try {
        const res = await fetch(`${API_URL}/tiragens`, {
            headers: getAuthHeader()
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('admin_token');
            return showLogin();
        }

        const data = await res.json();

        // Map backend data format if necessary, or just use it
        tiragensData = data.map(t => ({
            ...t,
            tipoNome: formatarTipo(t.tipo) // Helper to format type name
        }));

        aplicarFiltros(); // Updates filtered list and UI
    } catch (err) {
        console.error("Erro ao carregar tiragens:", err);
    }
}

// ========================================
// AGENDA
// ========================================
async function atualizarAgenda() {
    try {
        const res = await fetch(`${API_URL}/agenda/status`, {
            headers: getAuthHeader()
        });
        const data = await res.json();

        atualizarUIAgenda(data.atendimentos, data.status, data.max);
    } catch (err) {
        console.error("Erro ao carregar agenda:", err);
    }
}

function atualizarUIAgenda(total, status, max) {
    const contador = document.getElementById('agenda-contador');
    const badge = document.getElementById('agenda-status-badge');
    const barra = document.getElementById('agenda-barra');
    const btn = document.getElementById('btn-toggle-agenda');

    contador.textContent = `${total} / ${max}`;

    const porcentagem = Math.min((total / max) * 100, 100);
    barra.style.width = porcentagem + '%';

    if (status === 'aberta') {
        badge.className = "px-4 py-2 rounded-full text-sm font-bold border bg-green-900/40 text-green-400 border-green-500";
        badge.textContent = "🟢 Agenda Aberta";
        btn.textContent = "Fechar Agenda";
        btn.onclick = () => toggleAgenda(false); // Pass current intent
    } else {
        badge.className = "px-4 py-2 rounded-full text-sm font-bold border bg-red-900/40 text-red-400 border-red-500";
        badge.textContent = "🔴 Agenda Fechada";
        btn.textContent = "Abrir Agenda";
        btn.onclick = () => toggleAgenda(true);
    }
}

async function toggleAgenda() {
    try {
        const res = await fetch(`${API_URL}/agenda/toggle`, {
            method: 'POST',
            headers: getAuthHeader()
        });

        if (res.ok) {
            atualizarAgenda();
        } else {
            alert("Erro ao alterar agenda");
        }
    } catch (err) {
        console.error(err);
    }
}

// ========================================
// FILTROS
// ========================================
function aplicarFiltros() {
    const filtroNome = document.getElementById('filtro-nome').value.toLowerCase();
    const filtroCpf = document.getElementById('filtro-cpf').value;
    const filtroTiragem = document.getElementById('filtro-tiragem').value;
    const filtroData = document.getElementById('filtro-data').value;

    tiragensFiltradas = tiragensData.filter(t => {
        return (!nome || t.nome.toLowerCase().includes(nome)) &&
            (!cpf || t.cpf.includes(cpf)) &&
            (!tipo || t.tipo === tipo) &&
            (!data || t.data === data);
    });

    paginaAtual = 1;
    renderizarTabela();
    atualizarEstatisticas();
}

function limparFiltros() {
    document.getElementById('filtro-nome').value = '';
    document.getElementById('filtro-cpf').value = '';
    document.getElementById('filtro-tiragem').value = '';
    document.getElementById('filtro-data').value = '';

    tiragensFiltradas = [...tiragensData];
    renderizarTabela();
    atualizarEstatisticas();
}

// ========================================
// CARREGAMENTO DE DADOS
// ========================================
function renderizarTabela() {
    const tabela = document.getElementById('tabela-tiragens');
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const tiragensExibidas = tiragensFiltradas.slice(inicio, fim);

    // Limpa tabela
    tabela.innerHTML = '';

    tiragensFiltradas.forEach(t => {
        const statusClass = t.status === 'pago' || t.status === 'concluida'
            ? 'bg-green-900/30 text-green-400 border-green-500/50'
            : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';

        const statusLabel = t.status === 'pago' ? 'Pago' : (t.status === 'concluida' ? 'Concluída' : 'Aguardando Pagamento');

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
                    ${statusLabel}
                </span>
            </td>
            <td class="py-3 px-4">
                <button onclick="verDetalhes(${t.id})" class="text-purple-400 hover:text-purple-300 font-bold">👁️ Ver</button>
            </td>
        </tr>`;
    });
}

// ========================================
// ESTATÍSTICAS
// ========================================
function atualizarEstatisticas() {
    document.getElementById('stat-total').textContent = tiragensData.length;
    document.getElementById('stat-concluidas').textContent =
        tiragensData.filter(t => t.status === 'pago' || t.status === 'concluida').length;
    document.getElementById('stat-pendentes').textContent =
        tiragensData.filter(t => t.status === 'aguardando_pagamento').length;

    const faturamento = tiragensData
        .filter(t => t.status === 'pago' || t.status === 'concluida')
        .reduce((s, t) => s + t.valor, 0);

    document.getElementById('stat-faturamento').textContent = formatarMoeda(faturamento);
}

// ========================================
// MODAL DETALHES
// ========================================
function verDetalhes(id) {
    const tiragem = tiragensData.find(t => t.id === id);
    if (!tiragem) return;

    alert(`Cliente: ${tiragem.nome}\nCPF: ${tiragem.cpf}\nValor: R$ ${tiragem.valor}\nID MP: ${tiragem.mp_payment_id || 'N/A'}`);
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
    if (!data) return '-';
    // Se data vier como ISO (Check se tem T)
    if (data.includes('T')) return data.split('T')[0].split('-').reverse().join('/');
    return data.split('-').reverse().join('/');
}

function formatarMoeda(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function formatarTipo(slug) {
    const mapa = {
        'pergunta-avulsa': 'Pergunta Avulsa',
        'templo-afrodite': 'Templo de Afrodite',
        'carta-canalizada': 'Carta Canalizada',
        'previsao-anual': 'Previsão Anual',
        'previsao-mensal': 'Previsão Mensal',
        'tem-traicao': 'Tem Traição?'
    };
    return mapa[slug] || slug;
}
