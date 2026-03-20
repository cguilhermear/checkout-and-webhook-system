require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const paymentClient = new Payment(client);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const LIMITE_DIARIO_PADRAO = 14;

app.use(cors());
app.use(express.json());

const validTokens = new Set();

/* MIDDLEWARE DE AUTENTICAÇÃO */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token || !validTokens.has(token)) return res.sendStatus(403);
    next();
};

/* CONFIGURAÇÃO DO BANCO DE DADOS */
const db = new sqlite3.Database("./database.sqlite");
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tiragens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT, nome TEXT, cpf TEXT, email TEXT, telefone TEXT, 
    data_nascimento TEXT, cidade TEXT, rua TEXT, numero TEXT, 
    cep TEXT, tipo TEXT, quantidade INTEGER, valor REAL, 
    emergencial INTEGER, status TEXT, mp_payment_id TEXT,
    status_tiragem TEXT DEFAULT 'pendente'
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS agenda_config (
        data TEXT PRIMARY KEY, max_atendimentos INTEGER, fechada_manual INTEGER
    )`);
});

/* FUNÇÕES AUXILIARES */
function hoje() { return new Date().toISOString().split("T")[0]; }
function isFinalDeSemana() { const dia = new Date().getDay(); return dia === 0 || dia === 6; }

async function calcularStatusAgenda() {
    const dataHoje = hoje();

    return new Promise((resolve) => {
        db.get("SELECT * FROM agenda_config WHERE data = ?", [dataHoje], (err, config) => {

            db.get(
                "SELECT COUNT(*) as total FROM tiragens WHERE data = ? AND status = 'pago'",
                [dataHoje],
                (err2, row) => {

                    const totalHoje = row?.total || 0;
                    const max = config?.max_atendimentos || LIMITE_DIARIO_PADRAO;
                    const manual = config?.fechada_manual;

                    let status = "aberta";

                    // 🔴 Se admin fechou manualmente
                    if (manual === 1) {
                        status = "fechada";
                    }

                    // 🟢 Se admin abriu manualmente (forçou abrir)
                    else if (manual === 0) {
                        status = "aberta";
                    }

                    // ⚙️ Caso padrão automático (sem intervenção manual)
                    else if (totalHoje >= max) {
                        status = "fechada";
                    }

                    resolve({
                        data: dataHoje,
                        atendimentos: totalHoje,
                        max,
                        status
                    });
                }
            );
        });
    });
}

/* ROTAS DE LOGIN E AGENDA */
app.post("/login", (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        const token = uuidv4();
        validTokens.add(token);
        return res.json({ token });
    }
    res.status(401).json({ error: "Senha incorreta" });
});

app.get("/agenda/status", authMiddleware, async (req, res) => {
    const status = await calcularStatusAgenda();
    res.json(status);
});

app.get("/agenda/status-public", async (req, res) => {
    const status = await calcularStatusAgenda();
    res.json({ status: status.status });
});

app.post("/agenda/toggle", authMiddleware, (req, res) => {
    const dataHoje = hoje();

    db.get("SELECT * FROM agenda_config WHERE data = ?", [dataHoje], (err, agenda) => {

        if (!agenda) {
            // Se não existe config ainda, cria forçando fechamento
            db.run(
                "INSERT INTO agenda_config (data, max_atendimentos, fechada_manual) VALUES (?, ?, ?)",
                [dataHoje, LIMITE_DIARIO_PADRAO, 1]
            );
        } else {
            const novoStatus = agenda.fechada_manual === 1 ? 0 : 1;

            db.run(
                "UPDATE agenda_config SET fechada_manual = ? WHERE data = ?",
                [novoStatus, dataHoje]
            );
        }

        res.json({ sucesso: true });
    });
});

/* ROTAS DE TIRAGENS */
app.get("/tiragens", authMiddleware, (req, res) => {
    db.all("SELECT * FROM tiragens ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get("/tiragens/exportar-csv", authMiddleware, (req, res) => {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: "Informe o mês YYYY-MM" });
    db.all("SELECT * FROM tiragens WHERE data LIKE ? AND status = 'pago'", [`${mes}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        let csv = "Data,Nome,CPF,Email,Telefone,Cidade,Rua,Número,CEP,Tipo,Valor,MP Payment ID\n";
        rows.forEach(r => { csv += `${r.data},${r.nome},${r.cpf},${r.email},${r.telefone},${r.cidade},${r.rua},${r.numero},${r.cep},${r.tipo},${r.valor},${r.mp_payment_id}\n`; });
        res.header("Content-Type", "text/csv").attachment(`relatorio-${mes}.csv`).send(csv);
    });
});

console.log("🔥 TESTE LOG MP");

app.post("/tiragens", async (req, res) => {

    console.log("🔥 BODY RECEBIDO:", req.body);

// 🔒 VERIFICA STATUS DA AGENDA ANTES DE CRIAR TIRAGEM
const statusAgenda = await calcularStatusAgenda();

if (statusAgenda.status === "fechada") {
    return res.status(403).json({
        error: "As vagas de hoje já foram preenchidas 💜 Mas amanhã abrirei novas vagas! Quanto mais cedo você solicitar sua tiragem, maiores serão suas chances de conseguir atendimento. ✨"
    });
}

    const { nome, cpf, email, telefone, data_nascimento, cidade, rua, numero, cep, tipo, valor, emergencial } = req.body;

    db.run(
        `INSERT INTO tiragens (data, nome, cpf, email, telefone, data_nascimento, cidade, rua, numero, cep, tipo, quantidade, valor, emergencial, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [hoje(), nome, cpf, email, telefone, data_nascimento, cidade, rua, numero, cep, tipo, 1, valor, emergencial ? 1 : 0, "aguardando_pagamento"],
        async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const tiragemId = this.lastID;
            try {
                const preference = new Preference(client);
                const response = await preference.create({
                    body: {
                        items: [{
                            title: `Tiragem - ${tipo}`,
                            quantity: 1,
                            unit_price: 0.01, // Valor simbólico, o valor real é tratado no backend com a váriave de Number(valor)
                            currency_id: 'BRL'
                        }],
                        external_reference: String(tiragemId),
                        notification_url: "https://melissacartomante.com.br/webhook",
                        back_urls: {
                        success: `https://melissacartomante.com.br/sucesso?id=${tiragemId}`,
                        failure: `https://melissacartomante.com.br/falha?id=${tiragemId}`,
                        pending: `https://melissacartomante.com.br/pendente?id=${tiragemId}`
                        },
                    }
                });
                res.json({ sucesso: true, 
                    init_point: response.init_point,
                     tiragem_id: tiragemId
                 });
            } catch (mpError) {
                console.error("ERRO MP COMPLETO:");
    console.error(mpError);

    return res.status(500).json({
        error: "Erro na API do Mercado Pago",
        detalhe: mpError?.message
    });
            }
        }
    );
});

app.put("/tiragens/:id/status", authMiddleware, (req, res) => {
    const { id } = req.params;
    const { status_tiragem } = req.body;

    if (!["pendente", "concluida"].includes(status_tiragem)) {
        return res.status(400).json({ error: "Status inválido" });
    }

    db.run(
        "UPDATE tiragens SET status_tiragem = ? WHERE id = ?",
        [status_tiragem, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                sucesso: true,
                id,
                novo_status: status_tiragem
            });
        }
    );
});

app.get("/tiragens/:id/status-public", (req, res) => {
    const { id } = req.params;

    db.get(
        "SELECT status FROM tiragens WHERE id = ?",
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: "Não encontrado" });

            res.json({ status: row.status });
        }
    );
});

/* WEBHOOK PARA ATUALIZAÇÃO DE PAGAMENTO */
app.post('/webhook', async (req, res) => {

    try {

        if (req.body?.type && req.body.type !== "payment") {
            console.log("Evento ignorado:", req.body.type);
            return res.sendStatus(200);
        }

        const paymentId = req.body?.data?.id || req.body?.id;

        if (!paymentId) {
            console.log("Webhook recebido sem payment_id");
            return res.sendStatus(200);
        }

        console.log("Payment ID recebido:", paymentId);

        const payment = await paymentClient.get({ id: paymentId });

        const status = payment.status;
        const externalReference = payment.external_reference;

        console.log("Status pagamento:", status);
        console.log("External reference:", externalReference);

        if (!externalReference || isNaN(Number(externalReference))) {
            console.log("external_reference inválida");
            return res.sendStatus(200);
        }

        if (status === "approved") {

            db.run(
                `UPDATE tiragens 
                 SET status = 'pago', mp_payment_id = ?
                 WHERE id = ? AND status != 'pago'`,
                [paymentId, externalReference],
                function (err) {

                    if (err) {
                        console.error("Erro ao atualizar banco:", err);
                    } 
                    else if (this.changes > 0) {
                        console.log("Tiragem atualizada para PAGO:", externalReference);
                    } 
                    else {
                        console.log("Pagamento já estava marcado como pago:", externalReference);
                    }

                }
            );
        }

        res.sendStatus(200);

    } catch (err) {

        console.error("Erro Webhook:", err.message);

        res.sendStatus(200);
    }
});

/* REDIRECT APÓS PAGAMENTO */
app.get("/sucesso", async (req, res) => {
    const numero = "554988480529";
    const id = req.query.id;

    if (!id) {
        return res.redirect("/");
    }

    function esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function buscarTiragemComRetry(id, tentativas = 5) {
        for (let i = 0; i < tentativas; i++) {
            const tiragem = await new Promise((resolve) => {
                db.get("SELECT * FROM tiragens WHERE id = ?", [id], (err, row) => {
                    resolve(row);
                });
            });

            if (tiragem && tiragem.status === "pago") {
                return tiragem;
            }

            await esperar(1500); // espera 1.5s antes de tentar de novo
        }

        return null;
    }

    const tiragem = await buscarTiragemComRetry(id);

    if (!tiragem) {
        return res.send(`
            <h2>⏳ Aguardando confirmação do pagamento...</h2>
            <p>Atualize esta página em alguns segundos.</p>
        `);
    }

    // Mapa de nomes amigáveis
    const nomes = {
        'pergunta-avulsa': 'Pergunta Avulsa',
        'templo-afrodite': 'Templo de Afrodite',
        'tiragem-completa': 'Tiragem Completa',
        'area-da-vida': 'Área da Vida',
        'tem-traicao': 'Tem Traição?'
    };

    const mensagem = encodeURIComponent(
`Olá 💜 Acabei de realizar o pagamento da minha tiragem.

Nome completo: ${tiragem.nome}
Data de nascimento: ${tiragem.data_nascimento}
Método e quantidade: ${nomes[tiragem.tipo] || tiragem.tipo} (${tiragem.quantidade})`
    );

    res.redirect(`https://wa.me/${numero}?text=${mensagem}`);
});

app.get("/pendente", (req, res) => {
    res.send(`
        <html>
        <body style="font-family: Arial; text-align:center; padding-top:50px;">
            <h2>💜 Aguardando confirmação do pagamento...</h2>
            <p>Assim que o PIX for confirmado você será redirecionado automaticamente.</p>

            <script>

                const urlParams = new URLSearchParams(window.location.search);
                
                let externalReference = urlParams.get("id");  

                if(!externalReference){
                    externalReference = localStorage.getItem("tiragem_id");
                }

                setInterval(async () => {

                    if(!externalReference) return;

                    const response = await fetch("/tiragens/" + externalReference + "/status-public");
                    const data = await response.json();

                    if (data.status === "pago") {
                        window.location.href = "/sucesso?id=" + externalReference;
                    }

                }, 4000);

            </script>
        </body>
        </html>
    `);
});

/* INICIALIZAÇÃO */
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor pronto!`);
    console.log(`📍 Rodando em: http://localhost:${PORT}\n`);
});