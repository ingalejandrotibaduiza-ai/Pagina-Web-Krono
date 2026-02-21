const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const API_BASE = (() => {
  // Codespaces: https://xxxx-5500.app.github.dev -> https://xxxx-3001.app.github.dev
  if (location.hostname.endsWith("app.github.dev")) {
    return location.origin.replace(/-\d+\.app\.github\.dev$/, "-3001.app.github.dev");
  }
  // Local
  return "http://localhost:3001";
})();

fetch(`${API_BASE}/api/health`)
  .then((r) => r.json())
  .then((d) => console.log("API health:", d))
  .catch((err) => console.error("API health error:", err));


const SESSION_KEY = "krono_session_id";

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      (crypto?.randomUUID?.() ||
        `sid_${Date.now()}_${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const SESSION_ID = getSessionId();
let CONVERSACION_ID = null;
let CONVERSACION_PROMISE = null;

async function ensureConversation() {
  if (CONVERSACION_ID) return CONVERSACION_ID;
  if (CONVERSACION_PROMISE) return CONVERSACION_PROMISE;

  CONVERSACION_PROMISE = fetch(`${API_BASE}/api/conversaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: SESSION_ID }),
  })
    .then((r) => r.json())
    .then((d) => {
      CONVERSACION_ID = d?.id ?? null;
      return CONVERSACION_ID;
    })
    .catch((err) => {
      CONVERSACION_PROMISE = null;
      console.warn("No se pudo crear conversación:", err);
      return null;
    });

  return CONVERSACION_PROMISE;
}

async function saveMessage(quien, texto) {
  try {
    const cid = await ensureConversation();
    if (!cid) return;

    await fetch(`${API_BASE}/api/mensajes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversacion_id: cid, quien, texto }),
    });
  } catch (err) {
    console.warn("No se pudo guardar mensaje:", err);
  }
}

// ==========================
// Year
// ==========================
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==========================
// Drawer menu
// ==========================
const menuBtn = $("#menuBtn");
const drawer = $("#drawer");

if (menuBtn && drawer) {
  const toggleDrawer = () => drawer.classList.toggle("show");
  menuBtn.addEventListener("click", toggleDrawer);

  drawer.addEventListener("click", (e) => {
    if (e.target && e.target.matches("a")) drawer.classList.remove("show");
  });

  document.addEventListener("click", (e) => {
    const inside = drawer.contains(e.target) || menuBtn.contains(e.target);
    if (!inside) drawer.classList.remove("show");
  });
}

// ==========================
// Copy email
// ==========================
const copyBtn = $("#copyEmail");
const emailText = $("#emailText");

if (copyBtn && emailText) {
  copyBtn.addEventListener("click", async () => {
    const txt = emailText.textContent.trim();
    try {
      await navigator.clipboard.writeText(txt);
      copyBtn.textContent = "Copiado ✅";
      setTimeout(() => (copyBtn.textContent = "Copiar email"), 1200);
    } catch {
      copyBtn.textContent = "No se pudo";
      setTimeout(() => (copyBtn.textContent = "Copiar email"), 1200);
    }
  });
}

// ==========================
// Reveal animations
// ==========================
const reveals = $$(".reveal");

if ("IntersectionObserver" in window && reveals.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) en.target.classList.add("is-in");
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

// ==========================
// Process (meter + active card)
// ==========================
const processGrid = $("#processGrid");
const processFill = $("#processFill");

if (processGrid && processFill) {
  const cards = $$(".process-card", processGrid);

  const setStep = (n) => {
    cards.forEach((c) => {
      const active = Number(c.dataset.step) === n;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const pct = Math.max(0, Math.min(100, (n / 4) * 100));
    processFill.style.width = pct + "%";
  };

  setStep(1);

  const onPick = (card) => {
    const n = Number(card.dataset.step || 1);
    setStep(n);
  };

  processGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".process-card");
    if (card) onPick(card);
  });

  processGrid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".process-card");
    if (!card) return;
    e.preventDefault();
    onPick(card);
  });
}

// ==========================
// Chat elements
// ==========================
const chatToggle = $("#chatToggle");
const chatBackdrop = $("#chatBackdrop");
const chatWidget = $("#chatWidget");
const chatClose = $("#chatClose");
const chatBody = $("#chatBody");
const chatQuick = $("#chatQuick");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");

const WA_LINK = chatToggle?.dataset?.whatsapp || "https://wa.link/zx1j4t";

function setChatOpen(isOpen) {
  if (!chatWidget || !chatBackdrop) return;
  chatWidget.classList.toggle("show", isOpen);
  chatBackdrop.classList.toggle("show", isOpen);
  chatWidget.setAttribute("aria-hidden", isOpen ? "false" : "true");
  chatBackdrop.setAttribute("aria-hidden", isOpen ? "false" : "true");
  document.documentElement.classList.toggle("chat-open", isOpen);

  if (chatToggle) {
    chatToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    chatToggle.setAttribute("aria-label", isOpen ? "Cerrar chat" : "Abrir chat");
  }

  if (isOpen) setTimeout(() => chatInput?.focus(), 50);
}

function escapeHtml(input) {
  const str = String(input ?? "");
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function addMsg(text, who = "bot", { html = false } = {}) {
  if (!chatBody) return;

  const div = document.createElement("div");
  div.className = `msg ${who === "me" ? "me" : "bot"}`;
  div.innerHTML = html ? String(text ?? "") : escapeHtml(text);
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;

  // Guardar en DB (texto plano)
  const plain = (div.textContent || "").trim();
  if (plain) saveMessage(who === "me" ? "me" : "bot", plain);
}

function renderQuick() {
  if (!chatQuick) return;
  chatQuick.innerHTML = "";

  const options = [
    { key: "web", label: "🌐 Web premium" },
    { key: "sistema", label: "🧩 Sistema web" },
    { key: "auto", label: "🤖 Automatización" },
    { key: "otro", label: "✨ Otro" },
  ];

  options.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "quick-btn";
    b.textContent = o.label;
    b.dataset.key = o.key;
    chatQuick.appendChild(b);
  });
}

function firstBoot() {
  if (!chatBody || chatBody.childElementCount) return;
  addMsg("Bienvenido a Krono ✨", "bot");
  addMsg("Hola 👋 Soy el bot de Krono.\n¿Qué necesitas hoy?", "bot");
  renderQuick();
}

// replyFor: usado por quick buttons. Si el usuario escribe (submit), usamos echoMe=false
function replyFor(key, { echoMe = true } = {}) {
  if (key === "web") {
    if (echoMe) addMsg("Quiero una 🌐 Web premium", "me");
    addMsg("Perfecto. ¿Qué buscas?", "bot");
    addMsg(
      "• Landing de ventas\n• Portafolio\n• Web corporativa\n\nSi quieres, lo resolvemos en 3 preguntas y te paso una propuesta.",
      "bot"
    );
  } else if (key === "sistema") {
    if (echoMe) addMsg("Necesito 🧩 Sistema web", "me");
    addMsg("Listo. ¿Tu sistema es para…?", "bot");
    addMsg(
      "• Panel admin / dashboard\n• Formularios + base de datos\n• Usuarios y roles\n• Reportes\n\nCuéntame qué debe hacer y te digo el mejor camino.",
      "bot"
    );
  } else if (key === "auto") {
    if (echoMe) addMsg("Busco 🤖 Automatización", "me");
    addMsg("Genial. ¿Qué quieres automatizar?", "bot");
    addMsg(
      "• Respuestas / atención\n• Reportes y hojas\n• Integraciones\n• Bots de tareas\n\nDime el proceso y lo convierto en flujo simple.",
      "bot"
    );
  } else {
    if (echoMe) addMsg("✨ Otro", "me");
    addMsg(
      `Dale. Escríbeme por WhatsApp y te respondo directo: <a href="${WA_LINK}" target="_blank" rel="noreferrer">Abrir WhatsApp</a>`,
      "bot",
      { html: true }
    );
  }
}

// Open/close chat
if (chatToggle && chatWidget && chatBackdrop) {
  chatToggle.addEventListener("click", () => {
    const open = !chatWidget.classList.contains("show");
    setChatOpen(open);
    if (open) firstBoot();
  });
}

if (chatClose) chatClose.addEventListener("click", () => setChatOpen(false));
if (chatBackdrop) chatBackdrop.addEventListener("click", () => setChatOpen(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setChatOpen(false);
});

// Quick buttons
if (chatQuick) {
  chatQuick.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-key]");
    if (!btn) return;
    replyFor(btn.dataset.key, { echoMe: true });
  });
}

// Submit (usuario escribe)
if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const txt = chatInput.value.trim();
    if (!txt) return;

    addMsg(txt, "me");
    chatInput.value = "";

    // Respuesta dinámica desde el backend (FAQ/IA)
    fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: txt }),
    })
      .then((r) => r.json())
      .then((d) => addMsg(d.reply || "No pude responder, ¿me repites?", "bot"))
      .catch(() => addMsg("No pude conectarme a la API 😕", "bot"));
  });
}

// ==========================
// initProceso (lo dejo porque tú lo tenías)
// OJO: ya existe otro controlador arriba (processGrid). Si ves cosas raras,
// me dices y lo dejamos en 1 solo.
// ==========================
(function initProceso() {
  function start() {
    const cards = Array.from(document.querySelectorAll(".process-card"));
    const fill = document.getElementById("processFill");

    if (!cards.length || !fill) return;

    let active = 0;

    function setActive(idx) {
      active = Math.max(0, Math.min(idx, cards.length - 1));

      cards.forEach((c, i) => {
        const on = i === active;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });

      const pct = Math.round(((active + 1) / cards.length) * 100);
      fill.style.width = pct + "%";
    }

    cards.forEach((card, i) => {
      card.addEventListener("click", () => setActive(i));
      card.addEventListener("mouseenter", () => setActive(i));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(i);
        }
      });
    });

    setActive(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();