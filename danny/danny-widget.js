/* SMART COOKING™ — DANNY WIDGET */

(function () {
  "use strict";

  if (document.getElementById("danny-root")) return;

  const script = document.currentScript;
  const base = new URL("./", script.src);

  const avatar = new URL("assets/danny-avatar.png", base).href;
  const stylesheet = new URL("danny.css", base).href;

  function loadScript(filename) {
    return new Promise((resolve, reject) => {
      const element = document.createElement("script");

      element.src = new URL(filename, base).href;
      element.onload = resolve;
      element.onerror = () => reject(
        new Error("Failed to load " + filename)
      );

      document.body.appendChild(element);
    });
  }

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = stylesheet;
  document.head.appendChild(css);

  const root = document.createElement("div");
  root.id = "danny-root";

  root.innerHTML = `
    <button id="danny-bubble"
      type="button"
      aria-label="افتح محادثة Danny"
      aria-expanded="false"
      aria-controls="danny-panel">
      <img src="${avatar}" alt="Danny">
    </button>

    <section id="danny-panel" aria-label="محادثة Danny" hidden>
      <header id="danny-header">
        <img src="${avatar}" alt="Danny">

        <div id="danny-identity">
          <strong>Danny</strong>
          <small>SMART COOKING™ AI COMPANION</small>
        </div>

        <button id="danny-close" type="button"
          aria-label="تصغير المحادثة">×</button>
      </header>

      <div id="danny-messages" aria-live="polite">
        <div class="danny-message danny-message--danny">
          أهلاً! أنا Danny 🎾
          <br>
          كيف يمكنني مساعدتك في SMART COOKING™؟
        </div>
      </div>

      <div id="danny-status">
        جاري تشغيل نظام المحادثة...
      </div>

      <form id="danny-composer">
        <input id="danny-input" type="text"
          placeholder="اكتب رسالتك..."
          autocomplete="off"
          disabled>

        <button id="danny-send" type="submit" disabled>
          ➤
        </button>
      </form>
    </section>
  `;

  document.body.appendChild(root);

  const bubble = root.querySelector("#danny-bubble");
  const panel = root.querySelector("#danny-panel");
  const close = root.querySelector("#danny-close");
  const input = root.querySelector("#danny-input");
  const status = root.querySelector("#danny-status");

  function openDanny() {
    panel.hidden = false;
    bubble.setAttribute("aria-expanded", "true");
  }

  function closeDanny() {
    panel.hidden = true;
    bubble.setAttribute("aria-expanded", "false");
  }

  bubble.addEventListener("click", openDanny);
  close.addEventListener("click", closeDanny);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) {
      closeDanny();
    }
  });

  async function initializeDanny() {
    try {
      await loadScript("danny-data.js");
      await loadScript("danny-core.js");
      await loadScript("danny-engine.js");

      if (!window.DannyEngine) {
        throw new Error("Danny Engine did not initialize.");
      }

      console.log("Danny is ready.");

    } catch (error) {
      input.disabled = true;
      status.textContent = "تعذر تشغيل Danny";

      console.error("Danny initialization failed:", error);
    }
  }

  initializeDanny();
})();
