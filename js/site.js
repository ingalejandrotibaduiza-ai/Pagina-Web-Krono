const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

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
  if (isOpen) setTimeout(() => chatInput?.focus(), 50);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function addMsg(text, who = "bot", { html = false } = {}) {
  if (!chatBody) return;
  const div = document.createElement("div");
  div.className = `msg ${who === "me" ? "me" : "bot"}`;
  div.innerHTML = html ? text : escapeHtml(text);
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function renderQuick() {
  if (!chatQuick) return;
  chatQuick.innerHTML = "";
  const options = [
    { key: "web", label: "🌐 Web premium" },
    { key: "sistema", label: "🧩 Sistema web" },
    { key: "auto", label: "🤖 Automatización" },
    { key: "otro", label: "✨ Otro" }
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

function replyFor(key) {
  if (key === "web") {
    addMsg("Quiero una 🌐 Web premium", "me");
    addMsg("Perfecto. ¿Qué buscas?", "bot");
    addMsg("• Landing de ventas\n• Portafolio\n• Web corporativa\n\nSi quieres, lo resolvemos en 3 preguntas y te paso una propuesta.", "bot");
  } else if (key === "sistema") {
    addMsg("Necesito 🧩 Sistema web", "me");
    addMsg("Listo. ¿Tu sistema es para…?", "bot");
    addMsg("• Panel admin / dashboard\n• Formularios + base de datos\n• Usuarios y roles\n• Reportes\n\nCuéntame qué debe hacer y te digo el mejor camino.", "bot");
  } else if (key === "auto") {
    addMsg("Busco 🤖 Automatización", "me");
    addMsg("Genial. ¿Qué quieres automatizar?", "bot");
    addMsg("• Respuestas / atención\n• Reportes y hojas\n• Integraciones\n• Bots de tareas\n\nDime el proceso y lo convierto en flujo simple.", "bot");
  } else {
    addMsg("✨ Otro", "me");
    addMsg(`Dale. Escríbeme por WhatsApp y te respondo directo: <a href="${WA_LINK}" target="_blank" rel="noreferrer">Abrir WhatsApp</a>`, "bot", { html: true });
  }
}

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

if (chatQuick) {
  chatQuick.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-key]");
    if (!btn) return;
    replyFor(btn.dataset.key);
  });
}

if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = chatInput.value.trim();
    if (!txt) return;
    addMsg(txt, "me");
    chatInput.value = "";

    const lower = txt.toLowerCase();
    if (lower.includes("web") || lower.includes("landing") || lower.includes("pagina")) {
      replyFor("web");
      return;
    }
    if (lower.includes("sistema") || lower.includes("panel") || lower.includes("crud") || lower.includes("dashboard")) {
      replyFor("sistema");
      return;
    }
    if (lower.includes("automat") || lower.includes("bot") || lower.includes("integr")) {
      replyFor("auto");
      return;
    }

    addMsg("Perfecto. Para ayudarte mejor dime:", "bot");
    addMsg("1) ¿Qué necesitas que haga?\n2) ¿Para qué negocio?\n3) ¿Tienes ejemplo de referencia?", "bot");
    addMsg(`Si prefieres, vamos directo por WhatsApp: <a href="${WA_LINK}" target="_blank" rel="noreferrer">Abrir WhatsApp</a>`, "bot", { html: true });
  });
}
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
