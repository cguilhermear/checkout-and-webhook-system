const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// 🔴 COLOQUE SEU ACCESS TOKEN AQUI
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const app = express();
const PORT = 3000;

/* ======================================================
   MIDDLEWARES
====================================================== */

app.use(cors());
app.use(express.json());

// Load Environment Variables
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// In-memory token store (simplest solution for now)
const validTokens = new Set();

/* ======================================================
   AUTH MIDDLEWARE
====================================================== */

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);
    if (!validTokens.has(token)) return res.sendStatus(403);

    next();
};

/* ======================================================
   LOGIN ENDPOINT
====================================================== */

app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        const token = uuidv4();
        validTokens.add(token);
        return res.json({ token });
    }

    res.status(401).json({ error: "Senha incorreta" });
});

/* ======================================================
   BANCO DE DADOS
====================================================== */

const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS tiragens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT,
            nome TEXT,
            cpf TEXT,
            email TEXT,
            telefone TEXT,
            data_nascimento TEXT,
            cidade TEXT,
            rua TEXT,
            numero TEXT,
            cep TEXT,
            tipo TEXT,
            quantidade INTEGER,
            valor REAL,
            emergencial INTEGER,
            status TEXT,
            mp_payment_id TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS agenda_config (
            data TEXT PRIMARY KEY,
            max_atendimentos INTEGER,
            fechada_manual INTEGER
        )
    `);

});

/* ======================================================
   FUNÇÕES AUXILIARES
====================================================== */

function hoje() {
    return new Date().toISOString().split("T")[0];
}

function isFinalDeSemana() {
    const d = new Date();
    const dia = d.getDay();
    return dia === 0 || dia === 6;
}

/* ======================================================
   STATUS AGENDA (PROTECTED)
====================================================== */

app.get("/agenda/status", (req, res) => {

    const dataHoje = hoje();

    db.get("SELECT * FROM agenda_config WHERE data = ?", [dataHoje], (err, agenda) => {

        if (err) return res.status(500).json({ error: err.message });

        db.get(
            "SELECT COUNT(*) as total FROM tiragens WHERE data = ? AND status = 'pago'",
            [dataHoje],
            (err2, row) => {

                if (err2) return res.status(500).json({ error: err2.message });

                const totalHoje = row.total;
                const max = agenda ? agenda.max_atendimentos : 14;
                const manual = agenda ? agenda.fechada_manual : 0;

                let status = "aberta";

                if (isFinalDeSemana()) status = "fechada";
                if (manual === 1) status = "fechada";
                if (totalHoje >= max) status = "fechada";

                res.json({
                    data: dataHoje,
                    atendimentos: totalHoje,
                    max,
                    status
                });
            }
        );
    });
});

/* ======================================================
   TOGGLE AGENDA (PROTECTED)
====================================================== */

app.post("/agenda/toggle", authMiddleware, (req, res) => {

    const dataHoje = hoje();

    db.get("SELECT * FROM agenda_config WHERE data = ?", [dataHoje], (err, agenda) => {

        if (agenda) {
            const novoStatus = agenda.fechada_manual === 1 ? 0 : 1;

            db.run(
                "UPDATE agenda_config SET fechada_manual = ? WHERE data = ?",
                [novoStatus, dataHoje]
            );

            return res.json({ sucesso: true });
        }

        db.run(
            "INSERT INTO agenda_config (data, max_atendimentos, fechada_manual) VALUES (?, ?, ?)",
            [dataHoje, 14, 1]
        );

        res.json({ sucesso: true });

    });

});

/* ======================================================
   LISTAR TIRAGENS (PROTECTED)
====================================================== */

app.get("/tiragens", authMiddleware, (req, res) => {

    db.all("SELECT * FROM tiragens ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });

});

/* ======================================================
   CRIAR TIRAGEM + GERAR CHECKOUT MP
====================================================== */

app.post("/tiragens", async (req, res) => {

    const dataHoje = hoje();

    const {
        nome,
        cpf,
        email,
        telefone,
        data_nascimento,
        cidade,
        rua,
        numero,
        cep,
        tipo,
        quantidade,
        valor,
        emergencial
    } = req.body;

    db.get("SELECT COUNT(*) as total FROM tiragens WHERE data = ? AND status = 'pago'",
        [dataHoje],
        async (err, row) => {

            if (err) return res.status(500).json({ error: err.message });

            if (row.total >= 14 || isFinalDeSemana()) {
                return res.status(400).json({ error: "Agenda fechada" });
            }

            db.run(
                `
                INSERT INTO tiragens
                (data, nome, cpf, email, telefone, data_nascimento, cidade, rua, numero, cep, tipo, quantidade, valor, emergencial, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    dataHoje,
                    nome,
                    cpf,
                    email,
                    telefone,
                    data_nascimento,
                    cidade,
                    rua,
                    numero,
                    cep,
                    tipo,
                    quantidade,
                    valor,
                    emergencial ? 1 : 0,
                    "aguardando_pagamento"
                ],
                async function (err2) {

                    if (err2) return res.status(500).json({ error: err2.message });

                    const tiragemId = this.lastID;



                    try {
                        const preference = new Preference(client);
                        const result = await preference.create({
                            body: {
                                items: [
                                    {
                                        title: `Tiragem - ${tipo}`,
                                        quantity: 1,
                                        unit_price: Number(valor)
                                    }
                                ],
                                external_reference: String(tiragemId),
                                notification_url: "https://SEU-DOMINIO.com/webhook",
                                back_urls: {
                                    success: "https://SEU-DOMINIO.com/sucesso",
                                    failure: "https://SEU-DOMINIO.com/falha",
                                    pending: "https://SEU-DOMINIO.com/pendente"
                                },
                                auto_return: "approved"
                            }
                        });

                        res.json({
                            sucesso: true,
                            init_point: result.init_point
                        });
                    } catch (mpError) {
                        console.error(mpError);
                        res.status(500).json({ error: "Erro ao criar preferência no Mercado Pago" });
                    }
                }
            );

        });

});

/* ======================================================
   WEBHOOK MERCADO PAGO
====================================================== */

app.post("/webhook", async (req, res) => {

    if (req.query.type === "payment") {

        const payment = new Payment(client);
        try {
            const paymentData = await payment.get({ id: req.query["data.id"] });

            if (paymentData.status === "approved") {

                const tiragemId = paymentData.external_reference;

                db.run(
                    "UPDATE tiragens SET status = 'pago', mp_payment_id = ? WHERE id = ?",
                    [paymentData.id, tiragemId]
                );
            }
        } catch (error) {
            console.error(error);
        }
    }

    res.sendStatus(200);
});

/* ======================================================
   START
====================================================== */

app.listen(PORT, () => {
    console.log(`🔥 Backend rodando em http://localhost:${PORT}`);
});