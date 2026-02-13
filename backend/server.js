require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const LIMITE_DIARIO_PADRAO = 14;

app.use(cors());
app.use(express.json());

const validTokens = new Set();

/* ======================================================
   AUTH MIDDLEWARE
====================================================== */

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);
  if (!validTokens.has(token)) return res.sendStatus(403);

  next();
};

/* ======================================================
   LOGIN
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
  const dia = new Date().getDay();
  return dia === 0 || dia === 6;
}

function obterConfigAgenda(dataHoje) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM agenda_config WHERE data = ?",
      [dataHoje],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function contarAtendimentosHoje(dataHoje) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) as total FROM tiragens WHERE data = ? AND status = 'pago'",
      [dataHoje],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      }
    );
  });
}

async function calcularStatusAgenda() {
  const dataHoje = hoje();

  const config = await obterConfigAgenda(dataHoje);
  const totalHoje = await contarAtendimentosHoje(dataHoje);

  const max = config?.max_atendimentos || LIMITE_DIARIO_PADRAO;
  const manual = config?.fechada_manual || 0;

  let status = "aberta";

  if (isFinalDeSemana()) status = "fechada";
  if (manual === 1) status = "fechada";
  if (totalHoje >= max) status = "fechada";

  return {
    data: dataHoje,
    atendimentos: totalHoje,
    max,
    status
  };
}

/* ======================================================
   STATUS AGENDA (PROTEGIDO)
====================================================== */

app.get("/agenda/status", authMiddleware, async (req, res) => {
  try {
    const status = await calcularStatusAgenda();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   STATUS AGENDA (PÚBLICO)
====================================================== */

app.get("/agenda/status-public", async (req, res) => {
  try {
    const status = await calcularStatusAgenda();
    res.json({ status: status.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   TOGGLE AGENDA
====================================================== */

app.post("/agenda/toggle", authMiddleware, async (req, res) => {
  const dataHoje = hoje();

  db.get(
    "SELECT * FROM agenda_config WHERE data = ?",
    [dataHoje],
    (err, agenda) => {
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
        [dataHoje, LIMITE_DIARIO_PADRAO, 1]
      );

      res.json({ sucesso: true });
    }
  );
});

/* ======================================================
   LISTAR TIRAGENS
====================================================== */

app.get("/tiragens", authMiddleware, (req, res) => {
  db.all("SELECT * FROM tiragens ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* ======================================================
   EXPORTAR CSV PARA NF
====================================================== */

app.get("/tiragens/exportar-csv", authMiddleware, (req, res) => {
  const { mes } = req.query; // formato YYYY-MM

  if (!mes) {
    return res.status(400).json({ error: "Informe o mês no formato YYYY-MM" });
  }

  db.all(
    "SELECT * FROM tiragens WHERE data LIKE ? AND status = 'pago'",
    [`${mes}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      let csv =
        "Data,Nome,CPF,Email,Telefone,Cidade,Rua,Número,CEP,Tipo,Valor,MP Payment ID\n";

      rows.forEach((r) => {
        csv += `${r.data},${r.nome},${r.cpf},${r.email},${r.telefone},${r.cidade},${r.rua},${r.numero},${r.cep},${r.tipo},${r.valor},${r.mp_payment_id}\n`;
      });

      res.header("Content-Type", "text/csv");
      res.attachment(`relatorio-${mes}.csv`);
      res.send(csv);
    }
  );
});

/* ======================================================
   CRIAR TIRAGEM
====================================================== */

app.post("/tiragens", async (req, res) => {
  const statusAgenda = await calcularStatusAgenda();

  if (statusAgenda.status === "fechada") {
    return res.status(400).json({ error: "Agenda fechada" });
  }

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
            auto_return: "approved"
          }
        });

        res.json({
          sucesso: true,
          init_point: result.init_point
        });
      } catch (mpError) {
        res.status(500).json({
          error: "Erro ao criar preferência no Mercado Pago"
        });
      }
    }
  );
});

/* ======================================================
   WEBHOOK
====================================================== */

app.post("/webhook", async (req, res) => {
  if (req.query.type === "payment") {
    const payment = new Payment(client);

    try {
      const paymentData = await payment.get({
        id: req.query["data.id"]
      });

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
