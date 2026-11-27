/* SMART COOKING™ — DANNY CONVERSATION ENGINE */

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

  const messages = root.querySelector("#danny-messages");
  const form = root.querySelector("#danny-composer");
  const input = root.querySelector("#danny-input");
  const send = root.querySelector("#danny-send");
  const status = root.querySelector("#danny-status");

  const history = [];
  let busy = false;

  function addMessage(text, sender) {
    const bubble = document.createElement("div");

    bubble.className =
      "danny-message danny-message--" + sender;

    bubble.textContent = text;
    messages.appendChild(bubble);

    messages.scrollTop = messages.scrollHeight;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    send.disabled = value;

    status.textContent = value
      ? "Danny يفكر..."
      : "متصل — جاهز للمحادثة";

    if (!value) input.focus();
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
    typing.className =
      "danny-message danny-message--danny danny-typing";
    typing.textContent = "Danny يفكر...";
    messages.appendChild(typing);

    messages.scrollTop = messages.scrollHeight;

    try {
      await wait(250);

      const answer = core.reply(message);

      typing.remove();
      addMessage(answer, "danny");

      history.push({ sender: "danny", text: answer });

      // الاحتفاظ بسجل المحادثة في الذاكرة أثناء الجلسة.
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

  input.disabled = false;
  send.disabled = false;

  status.textContent = "متصل — جاهز للمحادثة";

  window.DannyEngine = Object.freeze({
    version: "0.1.0",
    getHistory: () => history.map(item => ({ ...item }))
  });

  console.log("Danny Engine initialized. Version 0.1.0");
})();
