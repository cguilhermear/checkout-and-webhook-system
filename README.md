# 🔮 Site de Cartomancia - Front-End

Site profissional para atendimento de cartomancia com design moderno em tons de roxo.

## 📋 Estrutura do Projeto

```
site_cartomante/
├── index.html              # Página inicial
├── biografia.html          # Página sobre a cartomante
├── passo-a-passo.html     # Como funciona o processo
├── tiragens.html          # Formulário de solicitação
├── tiragens.js            # Lógica JavaScript
└── README.md              # Este arquivo
```

## ✨ Funcionalidades Implementadas

### 🏠 Página Inicial (index.html)
- Hero section com animação de estrelas
- 3 cards principais: Biografia, Passo a Passo e Solicitar Tiragem
- Design responsivo
- Menu de navegação fixo

### 👤 Biografia (biografia.html)
- Seção de introdução com placeholder para foto
- História da cartomante
- Áreas de especialidade
- Design elegante com gradientes roxos

### 📚 Passo a Passo (passo-a-passo.html)
- 6 passos detalhados do processo
- Seção para vídeo explicativo
- Perguntas frequentes (FAQ)
- Garantias de segurança

### 🔮 Tiragens (tiragens.html + tiragens.js)
**6 Tipos de Tiragens:**
1. ❤️ Tiragem do Amor - R$ 50,00
2. 💼 Tiragem de Carreira - R$ 50,00
3. 🌟 Tiragem Espiritual - R$ 60,00
4. 🔮 Tiragem Geral - R$ 45,00
5. ⏳ Passado/Presente/Futuro - R$ 55,00
6. ⚖️ Tiragem de Decisão - R$ 55,00

**Funcionalidades:**
- ✅ Seleção de tipo de tiragem com destaque visual
- ✅ Seletor de quantidade com botões +/-
- ✅ Cálculo automático de desconto progressivo:
  - 2-3 tiragens: 5% off
  - 4-5 tiragens: 10% off
  - 6+ tiragens: 15% off
- ✅ Opção "Emergencial" (2x o valor)
- ✅ Resumo do pedido em tempo real
- ✅ Formulário completo de dados pessoais
- ✅ Máscara automática para telefone
- ✅ Validações de formulário
- ✅ Modal de aviso legal
- ✅ Redirecionamento automático para WhatsApp

## 🎨 Design

### Paleta de Cores
- **Roxo Principal:** #9333ea, #a855f7, #c084fc
- **Roxo Escuro:** #581c87, #6b21a8, #7e22ce
- **Rosa:** #c77dff
- **Índigo:** Variações de azul-roxo

### Tipografia
- **Títulos:** Cinzel (Serif)
- **Corpo:** Raleway (Sans-serif)

### Efeitos Especiais
- Gradientes suaves
- Animação de estrelas no fundo
- Efeitos de hover nos cards
- Text-glow nos títulos principais
- Transições suaves

## 🚀 Como Usar

### 1. Abrir o Site
Basta abrir o arquivo `index.html` em qualquer navegador moderno.

### 2. Personalizar Conteúdo

#### Textos da Biografia:
No arquivo `biografia.html`, localize e edite:
```html
<p class="text-lg text-purple-200 mb-4 leading-relaxed">
    Meu nome é [Seu Nome]...
```

#### Adicionar Foto:
Coloque sua foto na pasta e substitua:
```html
<img src="caminho/para/sua-foto.jpg" alt="Cartomante">
```

#### Adicionar Vídeo:
No arquivo `passo-a-passo.html`, substitua o placeholder:
```html
<iframe src="https://www.youtube.com/embed/SEU_VIDEO_ID" ...></iframe>
```

#### Configurar WhatsApp:
No arquivo `tiragens.js`, altere o número:
```javascript
const numeroWhatsApp = '5511999999999'; // SEU NÚMERO AQUI
```

### 3. Ajustar Preços
No arquivo `tiragens.html`, você pode alterar os valores:
```html
onclick="selectTiragem('amor', 50, this)"
                      ↑ nome  ↑ preço
```

### 4. Modificar Descontos
No arquivo `tiragens.js`, função `calculateTotal()`:
```javascript
if (quantidade >= 6) {
    desconto = 0.15; // 15% - Você pode alterar aqui
}
```

## 📱 Responsividade

O site é totalmente responsivo e funciona em:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops
- 🖥️ Monitores grandes

## 🔧 Tecnologias Utilizadas

- **HTML5** - Estrutura
- **Tailwind CSS** (via CDN) - Estilização
- **JavaScript Vanilla** - Interatividade
- **Google Fonts** - Tipografia

## 🎯 Próximos Passos (Backend)

Para implementação completa, você precisará:

1. **Integração com Mercado Pago:**
   - Criar conta no Mercado Pago
   - Obter credenciais de API
   - Implementar checkout

2. **Banco de Dados:**
   - Armazenar pedidos
   - Histórico de clientes
   - Registros de pagamento

3. **Painel Administrativo:**
   - Visualizar pedidos
   - Gerenciar tiragens
   - Estatísticas

4. **E-mail Automático:**
   - Confirmação de pedido
   - Notificação de pagamento

## ⚠️ Importante

### Antes de publicar:
1. ✅ Substitua todos os textos de exemplo
2. ✅ Adicione suas próprias fotos
3. ✅ Configure o número do WhatsApp
4. ✅ Ajuste preços conforme desejado
5. ✅ Adicione seu vídeo explicativo
6. ✅ Teste em diferentes dispositivos
7. ✅ Configure SSL/HTTPS quando hospedar

### Aviso Legal:
O site já inclui avisos legais conforme normas de transparência, mas consulte um advogado para adequação às leis locais.

## 📞 Suporte

Para dúvidas sobre customização ou implementação, você pode:
- Consultar a documentação do Tailwind CSS
- Modificar os arquivos conforme necessário
- Testar localmente antes de publicar

---

**Desenvolvido com 💜 e ✨**

*Site de Cartomancia Profissional - Front-End Completo*
