# 🔮 Melissa Cartomancia - Site Profissional

Site profissional e moderno para atendimentos de cartomancia online com design místico em tons de roxo e animações interativas.

## 📋 Estrutura do Projeto

```
site_cartomante/
├── index.html              # Página inicial completa
├── tiragens.html          # Formulário de solicitação
├── admin.html             # Painel administrativo
├── login.html             # Login do admin
├── tiragens.js            # Lógica do formulário
├── admin.js               # Lógica do painel admin
├── tarot-cards.js         # Sistema de carta do dia
├── IMG_0418.JPG           # Foto da Melissa
└── README.md              # Este arquivo
```

## ✨ Funcionalidades Principais

### 🏠 Página Inicial (index.html)

#### Hero Section
- Animação de estrelas em movimento
- 3 cartas de tarô animadas com efeito float
- **Carta do Dia Aleatória** centralizada com dados dinâmicos
- Títulos com efeito glow
- Design totalmente responsivo

#### Seção "Como Funciona"
- **Desktop:** 4 cards em linha horizontal com setas indicativas entre eles
- **Mobile:** Scroll horizontal com snap automático
- Cards com design de cartas de tarô
- Numeração romana com progresso (I/IV, II/IV, etc.)
- Ícones ilustrativos para cada etapa
- Textos descritivos claros e concisos

**Passos:**
1. 📋 Escolha sua tiragem
2. ✍️ Preencha o formulário (informe seus dados)
3. 💳 Realize o pagamento (Mercado Pago)
4. 📱 Receba sua leitura em 24 horas pelo WhatsApp

#### Seção "Sobre a Melissa"
- Foto profissional (IMG_0418.JPG)
- Biografia completa e personalizada
- Informações sobre oráculos utilizados (Tarô, Baralho Cigano, Sibila)
- Detalhes de atendimento (online, segunda a sexta)
- Estatísticas visuais (10+ anos, 500+ consultas)
- Elementos decorativos com blur

### 🔮 Página de Tiragens (tiragens.html + tiragens.js)

**6 Tipos de Tiragens Disponíveis:**
1. ❓ **Pergunta Avulsa** - A partir de R$ 70,00
   - Método flexível que melhor responde sua pergunta
   - Não responde sobre traição
2. 🏛️ **Templo de Afrodite** - A partir de R$ 165,00
   - Pensamentos e sentimentos de ambos
   - Intenções e momento atual da relação
3. 💌 **Carta Canalizada** - R$ 200,00
   - Carta escrita como se viesse da pessoa amada
   - Revela pensamentos e sentimentos ocultos
4. 📅 **Previsão Anual** - R$ 400,00
   - Energias dos próximos 12 meses
   - Tendências e oportunidades de cada fase
5. 🗓️ **Previsão Mensal** - R$ 130,00
   - Energias de cada semana do mês
   - Orientações para o mês seguinte
6. 💔 **Tem Traição?** - R$ 280,00
   - Revela interferências de terceiros
   - Verdade sobre a outra relação

**Funcionalidades Avançadas:**
- ✅ Seleção visual de tiragem com destaque
- ✅ Contador de quantidade (+/-)
- ✅ **Sistema de Desconto Progressivo:**
  - 2-3 tiragens: 5% off
  - 4-5 tiragens: 10% off
  - 6+ tiragens: 15% off
- ✅ Opção "Emergencial" (duplica o valor)
- ✅ Cálculo automático em tempo real
- ✅ **Formulário Completo:**
  - Nome completo*
  - Data de nascimento*
  - WhatsApp (com máscara automática)
  - E-mail
  - CPF* (para nota fiscal)
  - Cidade*
  - Rua, Número, CEP (opcionais, em grid 3 colunas)
  - Pergunta/Situação (textarea)
- ✅ Validações inteligentes
- ✅ Modal de aviso legal
- ✅ Geração automática de mensagem para WhatsApp

### 🛡️ Painel Administrativo (admin.html + admin.js)

**Sistema Completo de Gerenciamento:**
- 🔐 Tela de login (login.html)
- 📊 Dashboard com estatísticas
- 📋 Tabela de pedidos com colunas:
  - Data, Nome, CPF, Cidade
  - Rua, Número, CEP
  - Tipo de tiragem, Valor, Status
  - Ações (Ver Detalhes, Concluir, Excluir)
- 🔍 Sistema de busca/filtro
- 💾 Mock de dados para demonstração
- 🎨 Interface consistente com o tema roxo místico

### ⭐ Sistema de Carta do Dia (tarot-cards.js)

**22 Arcanos Maiores do Tarô:**
- Dados completos de cada carta (nome, palavras-chave, ícone)
- Seleção aleatória diária
- Animação suave de troca
- Renderização dinâmica no hero section

## 🎨 Design e Identidade Visual

### Paleta de Cores
- **Roxo Principal:** #9333ea, #a855f7, #c084fc
- **Roxo Escuro:** #581c87, #6b21a8, #7e22ce  
- **Índigo:** #4f46e5, #6366f1, #818cf8
- **Ciano/Teal:** Para variações de cards
- **Rosa:** #ec4899, #f472b6 (acentos)

### Tipografia
- **Títulos:** Cinzel (Serif) - elegante e místico
- **Corpo:** Raleway (Sans-serif) - moderno e legível
- Tamanhos responsivos com classes Tailwind

### Efeitos Especiais
- ✨ Animação de estrelas infinita
- 💫 Cards com efeito "gentleFloat"
- 🌟 Text-glow nos títulos principais
- 🎴 Aspect-ratio 2:3 para cards (proporção de cartas de tarô)
- 🔮 Gradientes suaves e multi-camadas
- 🎭 Transições suaves em hovers
- 📱 Scroll horizontal com snap no mobile
- 🚫 Scrollbar oculta mantendo funcionalidade

### Responsividade
- **Mobile First:** Design otimizado para celular
- **Breakpoints:**
  - Mobile: < 768px (scroll horizontal)
  - Desktop: ≥ 1024px (layout em linha)
- **Cards adaptáveis:**
  - Mobile: w-48 (192px)
  - Desktop: max-w-xl com container max-w-7xl
- **Textos escaláveis:** text-xs até text-6xl com classes md:/lg:

## 🚀 Como Usar

### 1. Configuração Inicial

#### Número do WhatsApp:
No arquivo `tiragens.js`, linha ~200:
```javascript
const numeroWhatsApp = '5511999999999'; // ALTERE AQUI
```

#### Foto da Melissa:
Substitua `IMG_0418.JPG` por sua foto ou altere o nome em `index.html`:
```html
<img src="SUA_FOTO.jpg" alt="Melissa Cartomante" class="w-full h-full object-cover">
```

#### Textos Personalizados:
Edite diretamente em `index.html`:
- Biografia (seção #sobre-melissa)
- Descrições das tiragens
- Avisos legais

### 2. Ajustar Valores e Descontos

#### Preços das Tiragens:
Em `tiragens.html`, na função `selectTiragem()`:
```html
onclick="selectTiragem('pergunta-avulsa', 70, this)"
                      ↑ tipo           ↑ preço
```

Tiragens disponíveis:
- `'pergunta-avulsa'` - R$ 70
- `'templo-afrodite'` - R$ 165
- `'carta-canalizada'` - R$ 200
- `'previsao-anual'` - R$ 400
- `'previsao-mensal'` - R$ 130
- `'tem-traicao'` - R$ 280

#### Descontos Progressivos:
Em `tiragens.js`, função `calculateTotal()`:
```javascript
if (quantidade >= 6) desconto = 0.15; // 15% off
else if (quantidade >= 4) desconto = 0.10; // 10% off
else if (quantidade >= 2) desconto = 0.05; // 5% off
```

### 3. Personalizar Cartas do Dia

Edite `tarot-cards.js` para adicionar/modificar cartas:
```javascript
const tarotCards = [
    {
        number: "0",
        name: "O LOUCO",
        keywords: "Novos começos • Liberdade • Aventura",
        icon: `<svg>...</svg>`
    },
    // ... adicione mais cartas
];
```

## 📱 Tecnologias e Ferramentas

- **HTML5** - Estrutura semântica
- **Tailwind CSS 3.x** (CDN) - Framework CSS utility-first
- **JavaScript Vanilla** - Sem dependências externas
- **Google Fonts** - Cinzel + Raleway
- **SVG Icons** - Ícones personalizados inline
- **CSS Animations** - @keyframes para efeitos
- **Responsive Design** - Mobile-first approach

## 🎯 Próximos Passos (Backend)

### Integração Necessária:

1. **Mercado Pago API:**
   ```javascript
   // Implementar checkout
   mp.checkout({
       preference: {
           items: [{
               title: tiragemSelecionada,
               quantity: quantidade,
               unit_price: valorTotal
           }]
       }
   });
   ```

2. **Banco de Dados:**
   - MongoDB ou PostgreSQL
   - Schemas: Users, Orders, Payments
   - Relacionamentos e índices

3. **Backend Node.js/Express:**
   - Rotas de API RESTful
   - Autenticação JWT
   - Middleware de validação
   - Integração com Mercado Pago Webhooks

4. **Sistema de Notificações:**
   - WhatsApp API (Twilio/Evolution API)
   - E-mails transacionais (SendGrid/Nodemailer)
   - Confirmações automáticas

5. **Painel Admin Real:**
   - Substituir mock por API calls
   - Autenticação robusta
   - Logs de auditoria
   - Relatórios e analytics

## ⚠️ Checklist Pré-Lançamento

- [ ] ✅ Trocar número do WhatsApp
- [ ] ✅ Adicionar foto profissional
- [ ] ✅ Revisar todos os textos
- [ ] ✅ Testar formulário completo
- [ ] ✅ Validar cálculos de desconto
- [ ] ✅ Testar em múltiplos dispositivos
- [ ] ✅ Verificar responsividade (mobile/tablet/desktop)
- [ ] ✅ Configurar domínio e SSL
- [ ] ✅ Implementar backend (pagamentos)
- [ ] ✅ Adicionar analytics (Google Analytics)
- [ ] ✅ Política de privacidade/LGPD
- [ ] ✅ Termos de uso detalhados

## 📊 Arquivos e Funcionalidades

| Arquivo | Tamanho | Funcionalidade Principal |
|---------|---------|-------------------------|
| index.html | ~25KB | Página inicial completa |
| tiragens.html | ~15KB | Formulário de pedidos |
| admin.html | ~10KB | Interface administrativa |
| tiragens.js | ~8KB | Lógica do formulário |
| admin.js | ~12KB | Gerenciamento de pedidos |
| tarot-cards.js | ~15KB | Sistema de carta do dia |

## 🔒 Segurança

- ✅ Validação client-side (JavaScript)
- ⚠️ Implementar validação server-side
- ⚠️ Sanitização de inputs
- ⚠️ Proteção CSRF
- ⚠️ Rate limiting
- ⚠️ HTTPS obrigatório em produção

## 📞 Suporte e Documentação

- **Tailwind CSS:** https://tailwindcss.com/docs
- **Mercado Pago:** https://www.mercadopago.com.br/developers
- **WhatsApp API:** https://www.twilio.com/whatsapp

---

**Desenvolvido com 💜✨ por stwinfobx**

*Melissa Cartomancia - Clareza e Acolhimento para sua Jornada*

🔮 Versão 2.0 - Janeiro 2025