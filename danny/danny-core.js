/* SMART COOKING™ — DANNY CORE */

(function () {
  "use strict";

  const data = window.DannyData;

  if (!data) {
    console.error("Danny: Knowledge base is missing.");
    return;
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[ًٌٍَُِّْـ]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .trim();
  }

  function includesAny(text, words) {
    return words.some(word => text.includes(normalize(word)));
  }

  function teamAnswer(text) {
    if (includesAny(text, ["الفريق", "فريق التطوير", "اعضاء الفريق"])) {
      return data.team.map(member =>
        `${member.name}: ${member.role}`
      ).join("\n\n");
    }

    if (includesAny(text, ["من هو claude", "كلود"])) {
      const member = data.team.find(item => item.name === "Claude");
      return member.role;
    }

    if (includesAny(text, ["من هو chatgpt", "شات جي بي تي"])) {
      const member = data.team.find(item => item.name === "ChatGPT");
      return member.role;
    }

    if (includesAny(text, ["من هو creator", "من هو المؤسس", "المؤسس"])) {
      return `${data.studio.founder} هو Creator، مؤسس ${data.studio.name} وصاحب القرار النهائي.`;
    }

    return null;
  }

  function websiteAnswer(text) {
    if (includesAny(text, ["العاب", "الالعاب", "الالعاب الموجوده"])) {
      return data.website.pages
        .filter(page => page.file !== "index.html")
        .map(page => `${page.title}: ${page.description}`)
        .join("\n\n");
    }

    if (includesAny(text, ["crazy rules", "كريزي رولز"])) {
      const page = data.website.pages.find(
        item => item.name === "Crazy Rules"
      );
      return `${page.title}: ${page.description}\nالملف: ${page.file}`;
    }

    if (includesAny(text, ["dead circuit", "ديد سيركت"])) {
      const page = data.website.pages.find(
        item => item.name === "Dead Circuit"
      );
      return `${page.title}: ${page.description}\nالملف: ${page.file}`;
    }

    if (includesAny(text, ["الخلفيه", "تخصيص الخلفيه", "الثيم"])) {
      return "يمكنك الوصول إلى إعدادات الثيم والخلفية من زر الإعدادات أعلى الصفحة.";
    }

    return null;
  }

  function studioAnswer(text) {
    if (includesAny(text, ["smart cooking", "الاستوديو", "ما هو الاستوديو"])) {
      return `${data.studio.name}\n${data.studio.slogan}`;
    }

    if (includesAny(text, ["شعار", "السلوغان"])) {
      return data.studio.slogan;
    }

    return null;
  }

  function reply(message, options = {}) {
    const text = normalize(message);
    const isCreator = options.isCreator === true;

    let answer = null;

    if (!text) {
      answer = "لم تصلني رسالة واضحة. ماذا تريد أن تعرف؟";
    } else {
      answer =
        teamAnswer(text) ||
        websiteAnswer(text) ||
        studioAnswer(text);
    }

    if (!answer) {
      answer = "لم أجد إجابة مؤكدة في قاعدة معلوماتي الحالية. أحتاج إلى تطوير قدراتي أو الاتصال بنموذج الذكاء الاصطناعي للإجابة عن هذا السؤال.";
    }

    if (isCreator) {
      answer = `Creator، ${answer}`;
    }

    return answer;
  }

  window.DannyCore = Object.freeze({
    reply,
    version: "0.1.0"
  });

  console.log("Danny Core initialized. Version 0.1.0");
})();
