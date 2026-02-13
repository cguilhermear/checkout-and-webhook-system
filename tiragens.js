// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let tipoTiragemSelecionado = null;
let precoUnitarioBase = 0;
let quantidadeVariavel = 1;
let tabelaPrecos = {
    'pergunta-avulsa': [70, 132, 189, 240, 275],  // 1 a 5 perguntas
    'templo-afrodite': [165, 298, 445]  // 1 a 3 templos
};
let nomesTiragens = {
    'pergunta-avulsa': 'Pergunta Avulsa',
    'templo-afrodite': 'Templo de Afrodite',
    'carta-canalizada': 'Carta Canalizada',
    'previsao-anual': 'Previsão Anual',
    'previsao-mensal': 'Previsão Mensal',
    'tem-traicao': 'Tem Traição?'
};

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });
    }

    // Máscara de telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                e.target.value = value;
            }
        });
    }

    // Validação do formulário
    const form = document.getElementById('tiragem-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            validarEEnviarFormulario();
        });
    }
});

// ========================================
// SELEÇÃO DE TIRAGEM
// ========================================
function selectTiragem(tipo, preco, elemento) {
    // Remove seleção anterior
    const cards = document.querySelectorAll('.card-tiragem');
    cards.forEach(card => card.classList.remove('selected'));

    // Adiciona seleção ao card clicado
    elemento.classList.add('selected');

    // Atualiza variáveis globais
    tipoTiragemSelecionado = tipo;
    precoUnitarioBase = preco;
    quantidadeVariavel = 1;

    // Atualiza campos hidden
    document.getElementById('selected-tiragem').value = tipo;
    document.getElementById('preco-unitario').value = preco;

    // Mostra/esconde seletor de quantidade baseado no tipo
    const quantidadeSelector = document.getElementById('quantidade-selector');
    const quantidadeLabel = document.getElementById('quantidade-label');
    const quantidadeInfo = document.getElementById('quantidade-info');
    const quantidadeInput = document.getElementById('quantidade-variavel');

    if (tipo === 'pergunta-avulsa' || tipo === 'templo-afrodite') {
        quantidadeSelector.style.display = 'block';
        quantidadeInput.value = 1;

        if (tipo === 'pergunta-avulsa') {
            quantidadeLabel.textContent = 'Quantas perguntas você deseja?';
            quantidadeInput.max = 5;
            quantidadeInfo.innerHTML = '1 pergunta: R$ 70 | 2: R$ 132 | 3: R$ 189 | 4: R$ 240 | 5: R$ 275';
        } else {
            quantidadeLabel.textContent = 'Quantos templos você deseja?';
            quantidadeInput.max = 3;
            quantidadeInfo.innerHTML = '1 templo: R$ 165 | 2: R$ 298 | 3: R$ 445';
        }
    } else {
        quantidadeSelector.style.display = 'none';
    }

    // Atualiza resumo
    document.getElementById('resumo-tipo').textContent = nomesTiragens[tipo];

    // Recalcula total
    calculateTotal();

    // Scroll suave para a seção de opções
    setTimeout(() => {
        const opcoesSecao = document.querySelector('.bg-gradient-to-br.from-indigo-800\\/40');
        if (opcoesSecao) {
            opcoesSecao.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 300);
}

// ========================================
// CONTROLE DE QUANTIDADE VARIÁVEL
// ========================================
function increaseQuantidadeVariavel() {
    const input = document.getElementById('quantidade-variavel');
    const max = parseInt(input.max);
    let value = parseInt(input.value);
    if (value < max) {
        input.value = value + 1;
        quantidadeVariavel = value + 1;
        calculateTotal();
    }
}

function decreaseQuantidadeVariavel() {
    const input = document.getElementById('quantidade-variavel');
    let value = parseInt(input.value);
    if (value > 1) {
        input.value = value - 1;
        quantidadeVariavel = value - 1;
        calculateTotal();
    }
}

// ========================================
// CONTROLE DE QUANTIDADE
// ========================================
function increaseQuantity() {
    const input = document.getElementById('quantidade');
    let value = parseInt(input.value);
    if (value < 10) {
        input.value = value + 1;
        calculateTotal();
    }
}

function decreaseQuantity() {
    const input = document.getElementById('quantidade');
    let value = parseInt(input.value);
    if (value > 1) {
        input.value = value - 1;
        calculateTotal();
    }
}

// ========================================
// CÁLCULO DE PREÇO
// ========================================
function calculateTotal() {
    // Verifica se uma tiragem foi selecionada
    if (!tipoTiragemSelecionado || !precoUnitarioBase) {
        return;
    }

    // Calcula preço base
    let precoBase = precoUnitarioBase;

    // Para Pergunta Avulsa e Templo de Afrodite agora é multiplicação simples
    if (tipoTiragemSelecionado === 'pergunta-avulsa' ||
        tipoTiragemSelecionado === 'templo-afrodite') {
        precoBase = precoUnitarioBase * quantidadeVariavel;
    }

    const emergencial = document.getElementById('emergencial').checked;

    // Aplica emergencial (dobra o valor)
    let precoFinal = precoBase;
    if (emergencial) {
        precoFinal = precoBase * 2;
    }

    // Atualiza resumo
    document.getElementById('resumo-unitario').textContent = formatarMoeda(precoBase);
    document.getElementById('total-preco').textContent = formatarMoeda(precoFinal);

    // Mostra/esconde linha emergencial
    const emergencialRow = document.getElementById('emergencial-row');
    if (emergencial) {
        emergencialRow.style.display = 'flex';
        document.getElementById('resumo-emergencial').textContent = '+' + formatarMoeda(precoBase);
    } else {
        emergencialRow.style.display = 'none';
    }
}

// ========================================
// FORMATAÇÃO DE MOEDA
// ========================================
function formatarMoeda(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

// ========================================
// VALIDAÇÃO E ENVIO DO FORMULÁRIO
// ========================================
function validarEEnviarFormulario() {
    // Validar tiragem selecionada
    if (!tipoTiragemSelecionado) {
        alert('⚠️ Por favor, selecione um tipo de tiragem!');
        document.querySelector('.card-tiragem').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Validar campos obrigatórios
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const pergunta = document.getElementById('pergunta').value.trim();

    if (!nome || !email || !telefone || !pergunta) {
        alert('⚠️ Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Por favor, insira um e-mail válido!');
        return;
    }

    // Validar telefone (mínimo 10 dígitos)
    const telefoneNumeros = telefone.replace(/\D/g, '');
    if (telefoneNumeros.length < 10) {
        alert('⚠️ Por favor, insira um telefone válido!');
        return;
    }

    // Tudo validado - mostrar modal de aviso legal
    showModal();
}

// ========================================
// MODAL DE AVISO LEGAL
// ========================================
function showModal() {
    document.getElementById('modal-aviso').classList.remove('hidden');
    document.getElementById('modal-aviso').classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-aviso').classList.add('hidden');
    document.getElementById('modal-aviso').classList.remove('flex');
    document.body.style.overflow = 'auto';
}

const API_URL = "http://localhost:3000";

async function confirmAndSubmit() {
    closeModal();
    mostrarProcessamento();

    // Coletar dados do formulário
    const dados = {
        tipo: tipoTiragemSelecionado,
        quantidade: document.getElementById('quantidade').value,
        emergencial: document.getElementById('emergencial').checked,
        valor: calcularValorTotal(), // Helper to get raw value
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value, // Fixed ID
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        data_nascimento: document.getElementById('data_nascimento').value,
        cidade: document.getElementById('cidade').value,
        rua: document.getElementById('rua').value,
        numero: document.getElementById('numero').value,
        cep: document.getElementById('cep').value
    };

    try {
        const res = await fetch(`${API_URL}/tiragens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await res.json();

        if (res.ok && result.init_point) {
            // Sucesso: Redirecionar para Mercado Pago
            window.location.href = result.init_point;
        } else {
            // Erro
            removerProcessamento();
            alert(`⚠️ Erro: ${result.error || 'Não foi possível processar seu pedido.'}`);
        }

    } catch (err) {
        console.error(err);
        removerProcessamento();
        alert('❌ Erro de conexão com o servidor. Tente novamente.');
    }
}

// Helper para pegar valor numérico
function calcularValorTotal() {
    let precoBase = precoUnitarioBase;

    if (tipoTiragemSelecionado === 'pergunta-avulsa' ||
        tipoTiragemSelecionado === 'templo-afrodite') {
        precoBase = precoUnitarioBase * quantidadeVariavel;
    }

    if (document.getElementById('emergencial').checked) {
        precoBase = precoBase * 2;
    }

    return precoBase;
}

// ========================================
// PROCESSAMENTO
// ========================================
function mostrarProcessamento() {
    const overlay = document.createElement('div');
    overlay.id = 'processing-overlay';
    overlay.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center';
    overlay.innerHTML = `
        <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500 mb-8"></div>
            <h2 class="text-3xl font-bold text-white mb-4">Processando...</h2>
            <p class="text-purple-300">Aguarde, estamos gerando seu pagamento seguro.</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function removerProcessamento() {
    const overlay = document.getElementById('processing-overlay');
    if (overlay) overlay.remove();
}

// Remover função antiga redirecionarParaWhatsApp


// ========================================
// FUNÇÕES AUXILIARES
// ========================================

// Prevenir envio do formulário ao pressionar Enter em campos de texto
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
        e.preventDefault();
    }
});

// Scroll suave para âncoras
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
