🚀 Payment Flow with Checkout and Webhook Processing

Sistema de venda de serviços digitais com integração de pagamento e confirmação assíncrona via webhook.

🧠 Contexto

O projeto implementa um fluxo completo onde:

o pagamento ocorre via gateway externo
o backend é responsável pela consistência do estado
ações pós-pagamento são disparadas apenas após confirmação real
🏗️ Arquitetura
Frontend → Backend → Payment Gateway → Webhook → Backend → User (WhatsApp)
⚙️ Fluxo
1. Criação da Solicitação

O frontend envia os dados para o backend, que:

persiste a operação com status aguardando_pagamento
cria uma sessão de pagamento via Mercado Pago
retorna a URL de checkout
2. Pagamento

O usuário realiza o pagamento no ambiente do gateway.

3. Confirmação via Webhook

Após o pagamento:

o gateway notifica o backend
o sistema consulta a API do provedor
valida o status da transação
atualiza o estado para pago
4. Pós-pagamento

Após confirmação:

o usuário é redirecionado
inicia o contato via WhatsApp para execução do serviço
🔗 Integrações
Mercado Pago → checkout e confirmação de pagamento
WhatsApp → canal de entrega do serviço
🗄️ Persistência

Banco SQLite contendo:

dados do cliente
tipo de serviço
valor
status do pagamento
status da execução
📊 Estados do Sistema
Pagamento
aguardando_pagamento
pago
Execução
pendente
concluida
🎯 Decisões Técnicas
uso de webhook como fonte de verdade (não confiar no frontend)
persistência antes da transação financeira
uso de external_reference para correlação de dados
separação entre estado de pagamento e execução
