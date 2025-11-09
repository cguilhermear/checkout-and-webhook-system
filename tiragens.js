// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let tipoTiragemSelecionado = null;
let precoUnitarioBase = 0;
let nomesTiragens = {
    'amor': 'Tiragem do Amor',
    'carreira': 'Tiragem de Carreira',
    'espiritual': 'Tiragem Espiritual',
    'geral': 'Tiragem Geral',
    'temporal': 'Passado/Presente/Futuro',
    'decisao': 'Tiragem de Decisão'
};

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });
    }

    // Máscara de telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
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
        form.addEventListener('submit', function(e) {
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
    
    // Atualiza campos hidden
    document.getElementById('selected-tiragem').value = tipo;
    document.getElementById('preco-unitario').value = preco;
    
    // Atualiza resumo
    document.getElementById('resumo-tipo').textContent = nomesTiragens[tipo];
    
    // Recalcula total
    calculateTotal();
    
    // Scroll suave para a próxima seção
    setTimeout(() => {
        document.querySelector('[class*="from-indigo-800"]').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 300);
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

    // Pega a quantidade
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    const emergencial = document.getElementById('emergencial').checked;

    // Calcula desconto por volume
    let desconto = 0;
    if (quantidade >= 6) {
        desconto = 0.15; // 15%
    } else if (quantidade >= 4) {
        desconto = 0.10; // 10%
    } else if (quantidade >= 2) {
        desconto = 0.05; // 5%
    }

    // Calcula preço com desconto
    let precoUnitario = precoUnitarioBase * (1 - desconto);

    // Aplica emergencial (dobra o valor)
    if (emergencial) {
        precoUnitario = precoUnitario * 2;
    }

    // Calcula total
    const total = precoUnitario * quantidade;

    // Atualiza resumo
    document.getElementById('resumo-quantidade').textContent = quantidade;
    document.getElementById('resumo-unitario').textContent = formatarMoeda(precoUnitario);
    document.getElementById('total-preco').textContent = formatarMoeda(total);

    // Mostra/esconde linha de desconto
    const descontoRow = document.getElementById('desconto-row');
    if (desconto > 0) {
        descontoRow.style.display = 'flex';
        document.getElementById('resumo-desconto').textContent = '-' + (desconto * 100) + '%';
    } else {
        descontoRow.style.display = 'none';
    }

    // Mostra/esconde linha de emergencial
    const emergencialRow = document.getElementById('emergencial-row');
    emergencialRow.style.display = emergencial ? 'flex' : 'none';
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

function confirmAndSubmit() {
    closeModal();
    
    // Coletar dados do formulário
    const dados = {
        tipo_tiragem: tipoTiragemSelecionado,
        nome_tiragem: nomesTiragens[tipoTiragemSelecionado],
        quantidade: document.getElementById('quantidade').value,
        emergencial: document.getElementById('emergencial').checked ? 'Sim' : 'Não',
        preco_total: document.getElementById('total-preco').textContent,
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        data_nascimento: document.getElementById('data_nascimento').value,
        pergunta: document.getElementById('pergunta').value
    };

    // AQUI você integraria com o backend para processar o pagamento
    // Por enquanto, vamos simular o redirecionamento para WhatsApp
    
    console.log('Dados do pedido:', dados);
    
    // Simular processamento
    mostrarProcessamento();
    
    setTimeout(() => {
        redirecionarParaWhatsApp(dados);
    }, 2000);
}

// ========================================
// PROCESSAMENTO E REDIRECIONAMENTO
// ========================================
function mostrarProcessamento() {
    // Criar overlay de processamento
    const overlay = document.createElement('div');
    overlay.id = 'processing-overlay';
    overlay.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center';
    overlay.innerHTML = `
        <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500 mb-8"></div>
            <h2 class="text-3xl font-bold text-white mb-4">Processando sua solicitação...</h2>
            <p class="text-purple-300">Aguarde enquanto preparamos tudo para você</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function redirecionarParaWhatsApp(dados) {
    // Número do WhatsApp da cartomante (ALTERAR PARA O NÚMERO REAL)
    const numeroWhatsApp = '5511999999999'; // Formato: 55 + DDD + Número
    
    // Montar mensagem
    const mensagem = `
🔮 *NOVA SOLICITAÇÃO DE TIRAGEM* 🔮

📋 *Tipo:* ${dados.nome_tiragem}
📦 *Quantidade:* ${dados.quantidade}
${dados.emergencial === 'Sim' ? '🚨 *EMERGENCIAL* ⚠️' : ''}
💰 *Valor Total:* ${dados.preco_total}

👤 *Dados do Cliente:*
Nome: ${dados.nome}
E-mail: ${dados.email}
WhatsApp: ${dados.telefone}
${dados.data_nascimento ? 'Data de Nascimento: ' + dados.data_nascimento : ''}

❓ *Pergunta/Situação:*
${dados.pergunta}

---
Aguardo confirmação para realizar o pagamento! ✨
    `.trim();

    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Criar URL do WhatsApp
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
    
    // Remover overlay de processamento
    const overlay = document.getElementById('processing-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Redirecionar
    window.location.href = urlWhatsApp;
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

// Prevenir envio do formulário ao pressionar Enter em campos de texto
document.addEventListener('keypress', function(e) {
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
