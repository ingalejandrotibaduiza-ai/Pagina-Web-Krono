const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// health check
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// guardar lead
app.post("/api/leads", async (req, res) => {
  const { nombre, whatsapp, email, interes } = req.body;
  try {
    const q = `
      INSERT INTO leads (nombre, whatsapp, email, interes)
      VALUES ($1,$2,$3,$4)
      RETURNING *;
    `;
    const r = await pool.query(q, [nombre || null, whatsapp || null, email || null, interes || null]);
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// crear conversación
app.post("/api/conversaciones", async (req, res) => {
  const { session_id } = req.body;
  try {
    const r = await pool.query(
      "INSERT INTO conversaciones (session_id) VALUES ($1) RETURNING *;",
      [session_id]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// guardar mensaje
app.post("/api/mensajes", async (req, res) => {
  const { conversacion_id, quien, texto } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO mensajes (conversacion_id, quien, texto)
       VALUES ($1,$2,$3) RETURNING *;`,
      [conversacion_id, quien, texto]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  const text = String(message || "").trim();

  if (!text) return res.json({ reply: "Escríbeme tu pregunta y te respondo 😊" });

  try {
    const q = `
      SELECT respuesta, similarity(pregunta, $1) AS score
      FROM faq
      ORDER BY score DESC
      LIMIT 1;
    `;
    const r = await pool.query(q, [text]);

    const best = r.rows[0];
    const score = best?.score ?? 0;

    // Ajusta este umbral si quieres más/menos “estricto”
    if (best && score >= 0.25) {
      return res.json({ reply: best.respuesta, score });
    }

    return res.json({
      reply:
        "Te entiendo. Para ayudarte mejor dime:\n1) ¿Qué necesitas que haga?\n2) ¿Para qué negocio?\n3) ¿Tienes un ejemplo de referencia?",
      score,
    });
  } catch (e) {
    return res.status(500).json({ reply: "Tuve un error. Intenta de nuevo 🙏", error: e.message });
  }
});


const port = process.env.PORT || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log("API corriendo en puerto:", port);
});