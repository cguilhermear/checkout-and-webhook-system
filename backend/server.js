const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const mercadopago = require("mercadopago");

const app = express();
const PORT = 3000;

/* ======================================================
   CONFIG MERCADO PAGO
====================================================== */

mercadopago.configure({
    access_token: "SEU_ACCESS_TOKEN_AQUI"
});

/* ======================================================
   MIDDLEWARE
====================================================== */

app.use(cors());
app.use(express.json());

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
            status TEXT
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
   AGENDA STATUS
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
   TOGGLE AGENDA MANUAL
====================================================== */

app.post("/agenda/toggle", (req, res) => {

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
   LISTAR TIRAGENS
====================================================== */

app.get("/tiragens", (req, res) => {

    db.all("SELECT * FROM tiragens ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });

});

/* ======================================================
   CRIAR TIRAGEM (VALIDAÇÃO AGENDA)
====================================================== */

app.post("/tiragens", (req, res) => {

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

                if (isFinalDeSemana()) {
                    return res.status(400).json({ error: "Agenda fechada (final de semana)" });
                }

                if (manual === 1) {
                    return res.status(400).json({ error: "Agenda fechada manualmente" });
                }

                if (totalHoje >= max) {
                    return res.status(400).json({ error: "Limite diário atingido" });
                }

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
                    function (err3) {
                        if (err3) return res.status(500).json({ error: err3.message });

                        res.json({
                            sucesso: true,
                            id: this.lastID
                        });
                    }
                );

            });
    });

});

/* ======================================================
   CRIAR PAGAMENTO MERCADO PAGO
====================================================== */

app.post("/pagamento", async (req, res) => {

    const { id } = req.body;

    db.get("SELECT * FROM tiragens WHERE id = ?", [id], async (err, tiragem) => {

        if (err || !tiragem) {
            return res.status(404).json({ error: "Tiragem não encontrada" });
        }

        try {

            const preference = {
                items: [
                    {
                        title: `Tiragem ${tiragem.tipo}`,
                        unit_price: Number(tiragem.valor),
                        quantity: 1
                    }
                ],
                external_reference: String(tiragem.id),
                notification_url: "https://SEU_DOMINIO/webhook",
                back_urls: {
                    success: "https://SEU_DOMINIO/sucesso.html",
                    failure: "https://SEU_DOMINIO/erro.html"
                },
                auto_return: "approved"
            };

            const response = await mercadopago.preferences.create(preference);

            res.json({
                init_point: response.body.init_point
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }

    });

});

/* ======================================================
   WEBHOOK MERCADO PAGO
====================================================== */

app.post("/webhook", async (req, res) => {

    try {

        const paymentId = req.query["data.id"];

        if (!paymentId) return res.sendStatus(200);

        const payment = await mercadopago.payment.findById(paymentId);

        if (payment.body.status === "approved") {

            const referencia = payment.body.external_reference;

            db.run(
                "UPDATE tiragens SET status = 'pago' WHERE id = ?",
                [referencia]
            );

        }

        res.sendStatus(200);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

});

/* ======================================================
   ALTERAR STATUS MANUAL
====================================================== */

app.patch("/tiragens/:id", (req, res) => {

    const { status } = req.body;

    db.run(
        "UPDATE tiragens SET status = ? WHERE id = ?",
        [status, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ sucesso: true });
        }
    );

});

/* ======================================================
   START
====================================================== */

app.listen(PORT, () => {
    console.log(`🔥 Backend rodando em http://localhost:${PORT}`);
});
