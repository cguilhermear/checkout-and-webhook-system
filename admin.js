// ========================================
// CONFIG E ESTADO
// ========================================
const API_URL = "/api";
let tiragensData = [];
let tiragensFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 10;
const LIMITE_DIARIO = 14;
let refreshInterval = null;

// ========================================
// INICIALIZAÇÃO E AUTH
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filtro-mes').value = mesAtual;
});

function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) showLogin();
    else {
        loadDashboard();
        iniciarAutoRefresh();
    }
}

function iniciarAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        atualizarAgenda();
        carregarTiragens();
    }, 30000);
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
            iniciarAutoRefresh();
        } else {
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
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
// DASHBOARD
// ========================================
async function loadDashboard() {
    await Promise.all([
        carregarTiragens(),
        atualizarAgenda()
    ]);
}

// ========================================
// TIRAGENS
// ========================================
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

        tiragensData = data.map(t => ({
            ...t,
            tipoNome: formatarTipo(t.tipo)
        }));

        aplicarFiltros();
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
    } else {
        badge.className = "px-4 py-2 rounded-full text-sm font-bold border bg-red-900/40 text-red-400 border-red-500";
        badge.textContent = "🔴 Agenda Fechada";
        btn.textContent = "Abrir Agenda";
    }

    btn.onclick = toggleAgenda;
}

async function toggleAgenda() {
    try {
        const res = await fetch(`${API_URL}/agenda/toggle`, {
            method: 'POST',
            headers: getAuthHeader()
        });

        if (res.ok) atualizarAgenda();
        else alert("Erro ao alterar agenda");
    } catch (err) {
        console.error(err);
    }
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
    renderizarTabela();
    atualizarEstatisticas();
}

function limparFiltros() {
    document.getElementById('filtro-nome').value = '';
    document.getElementById('filtro-cpf').value = '';
    document.getElementById('filtro-tiragem').value = '';
    document.getElementById('filtro-data').value = '';

    tiragensFiltradas = [...tiragensData];
    paginaAtual = 1;
    renderizarTabela();
    atualizarEstatisticas();
}

// ========================================
// EXPORTAR CSV 1 CLIQUE
// ========================================
function exportarCSV() {
    if (tiragensFiltradas.length === 0) {
        alert("Nenhum registro para exportar.");
        return;
    }

    let csv = "Data;Nome;CPF;Cidade;Rua;Numero;CEP;Tipo;Valor;Status\n";

    tiragensFiltradas.forEach(t => {
        csv += `${formatarData(t.data)};${t.nome};${t.cpf};${t.cidade || ''};${t.rua || ''};${t.numero || ''};${t.cep || ''};${t.tipoNome};${t.valor};${t.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_nf.csv";
    link.click();
}

// ========================================
// TABELA
// ========================================
function renderizarTabela() {
    const tabela = document.getElementById('tabela-tiragens');
    tabela.innerHTML = '';

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const tiragensExibidas = tiragensFiltradas.slice(inicio, fim);

    tiragensExibidas.forEach(t => {
        const statusClass = (t.status === 'pago' || t.status === 'concluida')
            ? 'bg-green-900/30 text-green-400 border-green-500/50'
            : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';

        const statusLabel = t.status === 'pago'
            ? 'Pago'
            : (t.status === 'concluida' ? 'Concluída' : 'Aguardando Pagamento');

        const statusTiragemClass = t.status_tiragem === 'concluida'
            ? 'bg-blue-900/30 text-blue-400 border-blue-500/50'
            : 'bg-purple-900/30 text-purple-300 border-purple-500/50';

        const statusTiragemLabel = t.status_tiragem === 'concluida'
            ? 'Tiragem Concluída'
            : 'Tiragem Pendente';

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
            <td class="py-3 px-4 flex flex-col gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                ${statusLabel}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusTiragemClass}">
                ${statusTiragemLabel}
            </span>
            </td>
            <td class="py-3 px-4 flex flex-col gap-2">
            ${t.status_tiragem === 'concluida'
                ? `<button onclick="toggleStatusTiragem(${t.id}, 'concluida')" 
                    class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full font-bold transition">
                    ✔ Concluída
                </button>`
                : `<button onclick="toggleStatusTiragem(${t.id}, 'pendente')" 
                    class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded-full font-bold transition">
                    Marcar como Concluída
                </button>`
            }
            <button onclick="verDetalhes(${t.id})" class="text-purple-400 hover:text-purple-300 font-bold text-xs">
                👁️ Ver
            </button>
</td>

        </tr>`;
    });

    atualizarPaginacao();
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
        .reduce((s, t) => s + Number(t.valor), 0);

    document.getElementById('stat-faturamento').textContent = formatarMoeda(faturamento);
}

// ========================================
// PAGINAÇÃO
// ========================================
function atualizarPaginacao() {
    const total = tiragensFiltradas.length;
    const inicio = total === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
    const fim = Math.min(paginaAtual * itensPorPagina, total);

    document.getElementById('page-start').textContent = inicio;
    document.getElementById('page-end').textContent = fim;
    document.getElementById('page-total').textContent = total;
    document.getElementById('total-registros').textContent = `${total} registros`;
}

function proximaPagina() {
    const totalPaginas = Math.ceil(tiragensFiltradas.length / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderizarTabela();
    }
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        renderizarTabela();
    }
}

// ========================================
// DETALHES
// ========================================
function verDetalhes(id) {
    const tiragem = tiragensData.find(t => t.id === id);
    if (!tiragem) return;

    alert(`Cliente: ${tiragem.nome}
CPF: ${tiragem.cpf}
Valor: R$ ${tiragem.valor}
ID MP: ${tiragem.mp_payment_id || 'N/A'}`);
}

// ========================================
// UTILITÁRIOS
// ========================================
function formatarData(data) {
    if (!data) return '-';
    if (data.includes('T')) return data.split('T')[0].split('-').reverse().join('/');
    return data.split('-').reverse().join('/');
}

function formatarMoeda(valor) {
    return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
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

// ========================================
// TOGGLE STATUS TIRAGEM 
// ========================================
async function toggleStatusTiragem(id, statusAtual) {

    const novoStatus = statusAtual === 'pendente' ? 'concluida' : 'pendente';

    try {
        const res = await fetch(`${API_URL}/tiragens/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ status_tiragem: novoStatus })
        });

        if (res.ok) {
            await carregarTiragens();
        } else {
            alert("Erro ao atualizar status da tiragem");
        }
    } catch (err) {
        console.error(err);
    }
}

// ========================================
// FILTRO COLAPSÁVEL 
// ========================================

function toggleFiltros() {
    const conteudo = document.getElementById('filtros-conteudo');
    const icone = document.getElementById('icone-filtros');

    conteudo.classList.toggle('hidden');

    if (conteudo.classList.contains('hidden')) {
        icone.textContent = '▼';
    } else {
        icone.textContent = '▲';
    }
}

let sidebarAberta = false;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-filtros');
    const layout = document.getElementById('layout-admin');
    const conteudo = document.getElementById('conteudo-principal');
    const filtrosConteudo = document.getElementById('filtros-conteudo');
    const icone = document.getElementById('icone-filtros');

    if (sidebarAberta) {
        // FECHA tudo
        sidebar.classList.add('hidden');
        layout.classList.remove('lg:grid-cols-4');
        layout.classList.add('lg:grid-cols-1');
        conteudo.classList.remove('lg:col-span-3');
        conteudo.classList.add('lg:col-span-1');
    } else {
        // ABRE tudo já expandido
        sidebar.classList.remove('hidden');
        layout.classList.remove('lg:grid-cols-1');
        layout.classList.add('lg:grid-cols-4');
        conteudo.classList.remove('lg:col-span-1');
        conteudo.classList.add('lg:col-span-3');

        // GARANTE filtros abertos
        filtrosConteudo.classList.remove('hidden');
        icone.textContent = '▲';
    }

    sidebarAberta = !sidebarAberta;
}



