// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let tipoTiragemSelecionado = null;
let precoUnitarioBase = 0;
let quantidadeVariavel = 1;
let tabelaPrecos = {
    'pergunta-avulsa': [57, 77, 107, 147, 167],  // 1 a 5 perguntas
    'templo-afrodite': [67, 117, 137]  // 1 a 3 templos
};
let nomesTiragens = {
    'pergunta-avulsa': 'Pergunta Avulsa',
    'templo-afrodite': 'Templo de Afrodite',
    'tiragem-completa': 'Tiragem Completa',
    'previsao-anual': 'Previsão Anual',
    'area-da-vida': 'Área da Vida',
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
        quantidadeInfo.innerHTML = '<strong>1 pergunta:</strong> R$ 57 | <strong>2:</strong> R$ 77 | <strong>3:</strong> R$ 107 | <strong>4:</strong> R$ 147 | <strong>5:</strong> R$ 167';
        } else {
            quantidadeLabel.textContent = 'Quantos templos você deseja?';
            quantidadeInput.max = 3;
            quantidadeInfo.innerHTML = '<strong>1 templo:</strong> R$ 67 | <strong>2:</strong> R$ 117 | <strong>3:</strong> R$ 137';
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
    if (!tipoTiragemSelecionado || !precoUnitarioBase) {
        return;
    }

    let precoBase = precoUnitarioBase;

    // Usa tabela progressiva se existir
    if (tabelaPrecos[tipoTiragemSelecionado]) {
        const tabela = tabelaPrecos[tipoTiragemSelecionado];
        const index = quantidadeVariavel - 1;

        if (tabela[index] !== undefined) {
            precoBase = tabela[index];
        }
    }

    const emergencial = document.getElementById('emergencial').checked;

    let precoFinal = precoBase;
    if (emergencial) {
        precoFinal = precoBase * 2;
    }

    document.getElementById('resumo-unitario').textContent = formatarMoeda(precoBase);
    document.getElementById('total-preco').textContent = formatarMoeda(precoFinal);

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

    // Validar campos obrigatórios (apenas os com *)
    const nome = document.getElementById('nome').value.trim();
    const dataNascimento = document.getElementById('data_nascimento').value;
    const cpf = document.getElementById('cpf').value.trim();
    const cidade = document.getElementById('cidade').value.trim();

    if (!nome || !dataNascimento || !cpf || !cidade) {
        alert('⚠️ Por favor, preencha todos os campos obrigatórios (*)!');
        return;
    }

    // Validar email
    const email = document.getElementById('email').value.trim();
    if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Por favor, insira um e-mail válido!');
        return;
    }
    }

    // Validar telefone (mínimo 10 dígitos)
    const telefone = document.getElementById('telefone').value.trim();
    if (telefone) {
    const telefoneNumeros = telefone.replace(/\D/g, '');
    if (telefoneNumeros.length < 10) {
        alert('⚠️ Por favor, insira um telefone válido!');
        return;
    }
    }

    // Tudo validado - mostrar modal de aviso legal
    confirmAndSubmit();
}

// ========================================
// MODAL DE AVISO LEGAL
// ========================================


const API_URL = "/api";


async function confirmAndSubmit() {
    mostrarProcessamento();
    // Coletar dados do formulário
    const dados = {
        tipo: tipoTiragemSelecionado,
        quantidade: quantidadeVariavel,
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
        console.log("RESPOSTA BACKEND:", result);   
        
        if (res.ok && result.sucesso) {

        localStorage.setItem("tiragem_id", result.tiragem_id);

        // TENTA abrir nova aba (Android / Desktop)
        const novaAba = window.open(result.init_point, "_blank");

        // Se bloqueou (iOS), redireciona na mesma aba
        if (!novaAba || novaAba.closed || typeof novaAba.closed === 'undefined') {
            window.location.href = result.init_point;
        } else {
            // Mantém usuário no fluxo do site
            window.location.href = `/pendente?id=${result.tiragem_id}`;
        }

            } else {
    removerProcessamento();

    if (res.status === 403) {
        alert(result.error);
    } else {
        alert('❌ Não foi possível processar seu pedido. Tente novamente.');
    }
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

    if (tabelaPrecos[tipoTiragemSelecionado]) {
        const tabela = tabelaPrecos[tipoTiragemSelecionado];
        const index = quantidadeVariavel - 1;

        if (tabela[index] !== undefined) {
            precoBase = tabela[index];
        }
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
