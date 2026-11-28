/* SMART COOKING™ — DANNY CONVERSATION ENGINE (v0.2.0) */

(function () {
  "use strict";

  if (window.DannyEngine) return;

  const core = window.DannyCore;
  if (!core) {
    console.error("Danny Engine: Core is missing.");
    return;
  }

  const root = document.getElementById("danny-root");
  if (!root) return;

  const BRAIN_URL =
    "https://tgsurjfvbfkbvlmsmrag.supabase.co/functions/v1/danny-brain";
  const NO_ANSWER_PREFIX = "لم أجد إجابة مؤكدة";
  const MAX_LEN = 500;

  const panel = root.querySelector("#danny-panel");
  const header = root.querySelector("#danny-header");
  const closeBtn = root.querySelector("#danny-close");
  const messages = root.querySelector("#danny-messages");
  const form = root.querySelector("#danny-composer");
  const input = root.querySelector("#danny-input");
  const send = root.querySelector("#danny-send");
  const status = root.querySelector("#danny-status");

  const history = [];
  let busy = false;
  let isCreator = false;
  let brainBtn = null;
  let learn = null;
  let learnInput = null;
  let saveBtn = null;
  let noteEl = null;
  let listEl = null;

  input.maxLength = MAX_LEN;

  function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = "danny-message danny-message--" + sender;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    send.disabled = value;
    status.textContent = value ? "Danny يفكر..." : "متصل — جاهز للمحادثة";
    if (!value) input.focus();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===== الاتصال بالعقل (الوسيط) =====
  async function callBrain(payload, token, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 20000);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = "Bearer " + token;
      const res = await fetch(BRAIN_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {}
      return { status: res.status, data: data };
    } finally {
      clearTimeout(timer);
    }
  }

  function aiError(data) {
    const code = data && data.error;
    if (code === "rate_limited") {
      return "أنت تسأل بسرعة! انتظر دقيقة ثم أعد المحاولة.";
    }
    if (code === "daily_limit" || code === "quota") {
      return "انتهت حصتي المجانية لهذا اليوم، لكنني ما زلت أجيب عن أسئلة الموقع المعروفة. عد غداً للمحادثة الكاملة.";
    }
    if (code === "too_long") {
      return "رسالتك طويلة. اختصرها في 500 حرف أو أقل.";
    }
    return "تعذّر الاتصال بعقلي الذكي الآن. حاول بعد قليل.";
  }

  async function askAI(message) {
    const prior = history
      .slice(0, -1)
      .slice(-6)
      .map((h) => ({ sender: h.sender, text: h.text }));
    try {
      const r = await callBrain(
        { action: "chat", message: message, history: prior },
        null
      );
      if (r.status === 200 && r.data && typeof r.data.reply === "string") {
        return r.data.reply;
      }
      return aiError(r.data);
    } catch (e) {
      return "تعذّر الاتصال بعقلي الذكي الآن. تحقق من الإنترنت وحاول مجدداً.";
    }
  }

  // ===== المحادثة =====
  async function handleMessage(event) {
    event.preventDefault();

    if (busy) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = "";

    addMessage(message, "user");
    history.push({ sender: "user", text: message });

    setBusy(true);

    const typing = document.createElement("div");
    typing.className = "danny-message danny-message--danny danny-typing";
    typing.textContent = "Danny يفكر...";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      await wait(250);

      const plain = core.reply(message);
      let answer;

      if (plain.startsWith(NO_ANSWER_PREFIX)) {
        answer = await askAI(message);
      } else {
        answer = isCreator ? core.reply(message, { isCreator: true }) : plain;
      }

      typing.remove();
      addMessage(answer, "danny");
      history.push({ sender: "danny", text: answer });

      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
    } catch (error) {
      typing.remove();
      addMessage(
        "عذراً، واجهت مشكلة أثناء معالجة رسالتك. حاول مرة أخرى.",
        "danny"
      );
      console.error("Danny conversation error:", error);
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener("submit", handleMessage);

  // ===== قسم التعلم (للمنشئ فقط، والخادم هو من يتحقق) =====
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent =
      "#danny-brain-btn{background:none;border:1px solid #39ff1466;color:#39ff14;border-radius:8px;font-size:16px;padding:2px 8px;cursor:pointer;margin-inline-start:6px}" +
      "#danny-learn{display:none;flex-direction:column;gap:10px;padding:12px;max-height:60vh;overflow-y:auto}" +
      "#danny-learn.open{display:flex}" +
      "#danny-learn h3{margin:0;font-size:15px;color:#39ff14}" +
      "#danny-learn textarea{width:100%;min-height:70px;resize:vertical;background:#000;color:#fff;border:1px solid #39ff1488;border-radius:8px;padding:8px;font:inherit;font-size:14px;box-sizing:border-box}" +
      "#danny-learn-save{align-self:flex-start;background:#39ff14;color:#000;border:0;border-radius:8px;padding:8px 16px;font:inherit;font-weight:bold;cursor:pointer}" +
      "#danny-learn-save:disabled{opacity:.5}" +
      "#danny-learn-warn{font-size:12px;opacity:.75}" +
      "#danny-learn-note{font-size:13px;min-height:16px}" +
      ".danny-learn-item{display:flex;gap:8px;align-items:flex-start;border:1px solid #ffffff22;border-radius:8px;padding:8px;font-size:13px}" +
      ".danny-learn-item span{flex:1;white-space:pre-wrap;word-break:break-word}" +
      ".danny-learn-item button{background:none;border:0;color:#ff5c65;font-size:16px;cursor:pointer}";
    document.head.appendChild(style);
  }

  function note(text, isErr) {
    noteEl.textContent = text;
    noteEl.style.color = isErr ? "#ff5c65" : "";
  }

  async function creatorCall(payload) {
    const token = await Auth.getToken();
    if (!token) return { status: 401, data: { error: "forbidden" } };
    return callBrain(payload, token);
  }

  function renderList(items) {
    listEl.textContent = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "danny-learn-item";

      const text = document.createElement("span");
      text.textContent = item.content;

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "🗑";
      del.setAttribute("aria-label", "احذف");
      del.addEventListener("click", () => forget(item.id, del));

      row.appendChild(text);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  async function loadList() {
    note("جارٍ التحميل...");
    try {
      const r = await creatorCall({ action: "list" });
      if (r.status !== 200 || !r.data || !Array.isArray(r.data.items)) {
        note("تعذّر تحميل الذاكرة.", true);
        return false;
      }
      renderList(r.data.items);
      note(r.data.items.length ? "" : "لم يتعلم Danny شيئاً بعد.");
      return true;
    } catch (e) {
      note("تعذّر الاتصال.", true);
      return false;
    }
  }

  async function learnNow() {
    const content = learnInput.value.trim();
    if (!content) {
      note("اكتب شيئاً أولاً.", true);
      return;
    }
    saveBtn.disabled = true;
    note("جارٍ الحفظ...");
    try {
      const r = await creatorCall({ action: "learn", content: content });
      if (r.status === 200 && r.data && r.data.ok) {
        learnInput.value = "";
        await loadList();
        note("تعلّم Danny! ✅");
      } else {
        note("لم يُحفظ. تأكد أنك مسجّل الدخول بحساب المنشئ.", true);
      }
    } catch (e) {
      note("تعذّر الاتصال.", true);
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function forget(id, btn) {
    btn.disabled = true;
    try {
      const r = await creatorCall({ action: "forget", id: id });
      if (r.status === 200 && r.data && r.data.ok) {
        await loadList();
      } else {
        note("تعذّر الحذف.", true);
        btn.disabled = false;
      }
    } catch (e) {
      note("تعذّر الاتصال.", true);
      btn.disabled = false;
    }
  }

  function setLearnOpen(open) {
    learn.classList.toggle("open", open);
    messages.style.display = open ? "none" : "";
    status.style.display = open ? "none" : "";
    form.style.display = open ? "none" : "";
    brainBtn.textContent = open ? "💬" : "🧠";
    brainBtn.setAttribute(
      "aria-label",
      open ? "العودة للمحادثة" : "قسم التعلم"
    );
    if (open) loadList();
  }

  function buildLearnUI() {
    injectStyles();

    learn = document.createElement("section");
    learn.id = "danny-learn";
    learn.innerHTML =
      "<h3>🧠 ما يتعلمه Danny</h3>" +
      '<textarea id="danny-learn-input" maxlength="500" placeholder="اكتب معلومة تريد أن يتعلمها Danny..."></textarea>' +
      '<button id="danny-learn-save" type="button">احفظ في ذاكرته</button>' +
      '<div id="danny-learn-warn">تنبيه: ما يتعلمه Danny قد يقوله للزوار، فلا تكتب أسراراً.</div>' +
      '<div id="danny-learn-note"></div>' +
      '<div id="danny-learn-list"></div>';

    panel.insertBefore(learn, form);

    learnInput = learn.querySelector("#danny-learn-input");
    saveBtn = learn.querySelector("#danny-learn-save");
    noteEl = learn.querySelector("#danny-learn-note");
    listEl = learn.querySelector("#danny-learn-list");

    saveBtn.addEventListener("click", learnNow);
  }

  function showBrain() {
    if (brainBtn) return;
    buildLearnUI();

    brainBtn = document.createElement("button");
    brainBtn.id = "danny-brain-btn";
    brainBtn.type = "button";
    brainBtn.textContent = "🧠";
    brainBtn.setAttribute("aria-label", "قسم التعلم");
    brainBtn.addEventListener("click", () =>
      setLearnOpen(!learn.classList.contains("open"))
    );

    header.insertBefore(brainBtn, closeBtn);
    addMessage("أهلاً بك يا Creator 👑 يمكنك تعليمي من زر 🧠 في الأعلى.", "danny");
  }

  function waitForAuth(ms) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      (function check() {
        if (typeof Auth !== "undefined" && Auth && typeof Auth.getToken === "function") {
          return resolve(true);
        }
        if (Date.now() - t0 > ms) return resolve(false);
        setTimeout(check, 250);
      })();
    });
  }

  async function initCreator() {
    try {
      if (!(await waitForAuth(6000))) return;
      const token = await Auth.getToken();
      if (!token) return;
      const r = await callBrain({ action: "whoami" }, token, 10000);
      if (r.status === 200 && r.data && r.data.creator === true) {
        isCreator = true;
        showBrain();
      }
    } catch (e) {
      /* زائر عادي */
    }
  }

  input.disabled = false;
  send.disabled = false;
  status.textContent = "متصل — جاهز للمحادثة";

  window.DannyEngine = Object.freeze({
    version: "0.2.0",
    getHistory: () => history.map((item) => ({ ...item })),
  });

  console.log("Danny Engine initialized. Version 0.2.0");

  initCreator();
})();
