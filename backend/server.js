require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
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

app.post("/tiragens", async (req, res) => {

// 🔒 VERIFICA STATUS DA AGENDA ANTES DE CRIAR TIRAGEM
const statusAgenda = await calcularStatusAgenda();

if (statusAgenda.status === "fechada") {
    return res.status(403).json({
        error: "As vagas de hoje já foram preenchidas 💜 Mas amanhã pela manhã você poderá garantir sua tiragem com prioridade."
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
                            unit_price: Number(valor),
                            currency_id: 'BRL'
                        }],
                        external_reference: String(tiragemId),
                        back_urls: {
                            success: "http://melissacartomante.com.br/sucesso",
                            failure: "http://melissacartomante.com.br/falha"
                        },
                    }
                });
                res.json({ sucesso: true, init_point: response.init_point });
            } catch (mpError) {
                console.error("ERRO DETALHADO MP:", JSON.stringify(mpError, null, 2));
                res.status(500).json({ error: "Erro na API do Mercado Pago" });
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

/* WEBHOOK PARA ATUALIZAÇÃO DE PAGAMENTO */
app.post("/webhook", async (req, res) => {
    try {
        if (req.body.type === "payment") {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: req.body.data.id });
            if (paymentData.status === "approved") {
                db.run("UPDATE tiragens SET status = 'pago', mp_payment_id = ? WHERE id = ?", [paymentData.id, paymentData.external_reference]);
            }
        }
        res.sendStatus(200);
    } catch (err) {
        console.error("Erro Webhook:", err);
        res.sendStatus(500);
    }
});

/* INICIALIZAÇÃO */
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor pronto!`);
    console.log(`📍 Rodando em: http://localhost:${PORT}\n`);
});
