// Learner report form: built from the schema, saved on the device as you type, submitted to the trainer at the end.
(() => {
  const FORM = JSON.parse(document.getElementById("report").textContent);
  const CARDS = JSON.parse(document.getElementById("optionCards").textContent);
  const $ = (id) => document.getElementById(id);
  const KEY = "bellarineReport";
  // /brief (Session 1), /brief2 (Session 2) and /report/3 show one session's sections; /report shows them all.
  const only = { "/brief": 1, "/brief2": 2, "/report/3": 3 }[location.pathname.replace(/\/$/, "")] || 0;

  // Same anonymous id as the activities, so a resubmission replaces the learner's earlier report.
  function learnerId() {
    const make = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    try {
      let id = localStorage.getItem("sortId");
      if (!id) {
        id = make();
        localStorage.setItem("sortId", id);
      }
      return id;
    } catch {
      return make();
    }
  }
  const id = learnerId();

  let state = { fields: {}, checklist: FORM.checklist.map(() => false), name: "", submittedAt: null };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.fields) state = { ...state, ...saved, checklist: FORM.checklist.map((_, i) => saved.checklist?.[i] === true) };
  } catch { /* storage blocked or corrupt: start empty */ }
  // Drop answers the server would reject: boxes that no longer exist, and choices no longer offered (e.g. an old option card).
  const known = new Map(FORM.sections.flatMap((s) => s.groups.flatMap((g) => g.fields.map((f) => [f.id, f]))));
  state.fields = Object.fromEntries(Object.entries(state.fields).filter(([fid, v]) => {
    const f = known.get(fid);
    return f && (f.type !== "select" || !v || f.options.includes(v));
  }));

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        $("saved").textContent = "Saved on this device";
      } catch {
        $("saved").textContent = "This browser cannot save your work. Use “Download a copy” before you close the page.";
      }
    }, 300);
  }

  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  const money = (n) => "$" + n.toLocaleString("en-AU");
  function copyButton(text) {
    const b = el("button", { type: "button", className: "btn" }, "Copy question");
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; } catch { b.textContent = "Select the question and copy it"; }
    });
    return b;
  }

  // "Ask AI": a chat box under the chosen card, so learners on phones never switch tabs. Questions go to /api/chat
  // and nothing is stored; each card keeps its conversation while the page is open.
  const chats = new Map(); // card value -> { open, history: [{ role, content }] }
  function chatBox(c, chat) {
    const log = el("div", { className: "chatlog" });
    const input = el("textarea", { rows: 3, maxLength: 1000, value: chat.history.length ? "" : c.question, placeholder: "Ask a follow-up question" });
    input.setAttribute("aria-label", "Your question for the AI");
    const send = el("button", { type: "button", className: "btn primary" }, "Send");
    const status = el("p", { className: "small" });
    status.setAttribute("aria-live", "polite");
    const show = () => {
      log.textContent = "";
      chat.history.forEach((m) => log.append(el("p", { className: `msg ${m.role}` }, m.content)));
    };
    send.addEventListener("click", async () => {
      const question = input.value.trim();
      if (!question) return;
      const messages = [...chat.history, { role: "user", content: question }].slice(-7);
      if (messages[0].role !== "user") messages.shift();
      send.disabled = true;
      status.textContent = "Thinking…";
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, messages }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw Object.assign(new Error(data.error || "The AI chat is not working right now."), { fallback: res.status >= 500 });
        chat.history.push({ role: "user", content: question }, { role: "assistant", content: data.answer });
        input.value = "";
        status.textContent = "";
        show();
      } catch (err) {
        const offline = err instanceof TypeError; // fetch could not reach the server
        status.textContent = offline ? "Could not reach the AI. Check the Wi-Fi and try again." : err.message;
        if (offline || err.fallback) status.append(" ", el("a", { href: "https://chatgpt.com/", target: "_blank", rel: "noopener" }, "Open ChatGPT instead"));
      } finally {
        send.disabled = false;
      }
    });
    show();
    return el("div", { className: "chat" }, el("p", { className: "small" }, "Never type personal information."), log, input, el("p", { className: "buttons" }, send), status);
  }

  // Session 2 option cards: tap one card of this type. All three show, each tagged with the goal it helps.
  function cardPicker(f) {
    const wrap = el("div", { className: "optcards", role: "radiogroup" });
    wrap.setAttribute("aria-label", "Option cards");
    const render = () => {
      wrap.textContent = "";
      CARDS.filter((c) => c.type === f.cards).forEach((c) => {
        const on = state.fields[f.id] === c.value;
        const card = el("button", { type: "button", className: "optcard" + (on ? " on" : "") }, el("strong", {}, c.title), el("span", {}, c.text),
          el("span", { className: "optgoal" }, `Helps: ${c.goal}`),
          el("span", { className: "optmeta" }, `${c.product} · ${money(c.setup)} to set up + ${money(c.monthly)} a month`));
        card.setAttribute("role", "radio");
        card.setAttribute("aria-checked", String(on));
        card.addEventListener("click", () => { state.fields[f.id] = c.value; updateProgress(); save(); render(); });
        wrap.append(card);
        if (on) {
          const chat = chats.get(c.value) || { open: false, history: [] };
          chats.set(c.value, chat);
          const toggle = el("button", { type: "button", className: "btn primary" }, chat.open ? "Hide AI chat" : "Ask AI");
          toggle.addEventListener("click", () => { chat.open = !chat.open; render(); });
          const ask = el("div", { className: "ask" }, el("p", {}, el("strong", {}, "Question for the AI: "), c.question),
            el("p", { className: "buttons" }, copyButton(c.question), toggle));
          if (chat.open) ask.append(chatBox(c, chat));
          wrap.append(ask);
        }
      });
    };
    render();
    return wrap;
  }

  // Sections, grouped under their session heading.
  const form = $("form");
  form.addEventListener("submit", (e) => e.preventDefault()); // Enter in a text box must not reload the page
  let session = 0;
  FORM.sections.forEach((s) => {
    if (s.session !== session) {
      session = s.session;
      form.append(el("h2", { id: `session${session}`, className: "session", hidden: Boolean(only) }, `Session ${session}`));
    }
    const sec = el("section", { className: "rsec", id: `s${s.n}`, hidden: only && only !== s.session });
    const progress = el("span", { className: "progress" });
    sec.append(el("h3", {}, `${s.n}. ${s.title} `, el("span", { className: "maps" }, s.maps), progress));
    if (s.intro) sec.append(el("p", { className: "small" }, s.intro));
    const ids = [];
    s.groups.forEach((g) => {
      const group = el("fieldset", { className: "group" });
      group.append(el("legend", {}, g.label));
      if (g.hint) group.append(el("p", { className: "small" }, g.hint));
      // Answered through an activity on the page (section 3): its answers fill the group's fields.
      if (g.activity) {
        ids.push(...g.fields.map((f) => f.id));
        window.mountActivity(group, JSON.parse($(`${g.activity}Activity`).textContent), {
          learnerId: id,
          saved: Object.fromEntries(g.fields.filter((f) => f.item).map((f) => [f.item, state.fields[f.id]])),
          onDone: (answers, firstTry) => {
            g.fields.forEach((f) => {
              if (f.item && answers[f.item]) state.fields[f.id] = answers[f.item];
              if (f.firstTry && firstTry && !state.fields[f.id]) state.fields[f.id] = firstTry;
            });
            updateProgress();
            save();
          },
        });
        sec.append(group);
        return;
      }
      g.fields.forEach((f) => {
        ids.push(f.id);
        if (f.cards) return group.append(cardPicker(f));
        let input;
        if (f.type === "select") {
          input = el("select", { id: f.id }, el("option", { value: "" }, "Choose…"), ...f.options.map((o) => el("option", { value: o }, o)));
        } else if (f.type === "textarea") {
          input = el("textarea", { id: f.id, rows: 3, maxLength: 1500 });
        } else {
          input = el("input", { id: f.id, type: "text", maxLength: 300 });
        }
        if (f.placeholder) input.placeholder = f.placeholder;
        input.value = state.fields[f.id] || "";
        input.addEventListener("input", () => {
          state.fields[f.id] = input.value;
          updateProgress();
          save();
        });
        group.append(f.label ? el("label", { className: "field" }, el("span", {}, f.label), input) : (input.setAttribute("aria-label", g.label), input));
      });
      sec.append(group);
    });
    sec.dataset.ids = ids.join(" ");
    sec.progress = progress;
    form.append(sec);
  });

  function filled(fid) { return Boolean((state.fields[fid] || "").trim()); }

  function updateProgress() {
    const missing = [];
    form.querySelectorAll("section.rsec").forEach((sec) => {
      const ids = sec.dataset.ids.split(" ");
      const done = ids.filter(filled).length;
      sec.progress.textContent = ` ${done}/${ids.length}`;
      sec.progress.classList.toggle("done", done === ids.length);
      if (done < ids.length) missing.push(sec.id.slice(1));
    });
    $("missing").textContent = missing.length ? `Sections with empty boxes: ${missing.join(", ")}.` : "Every box has an entry.";
    const ready = state.name.trim() && state.checklist.every(Boolean);
    $("send").disabled = !ready;
  }

  // Checklist and name (section 10).
  $("submitTo").textContent = FORM.submitTo;
  FORM.checklist.forEach((c, i) => {
    const box = el("input", { type: "checkbox", checked: state.checklist[i] });
    box.addEventListener("change", () => {
      state.checklist[i] = box.checked;
      updateProgress();
      save();
    });
    $("checklist").append(el("label", { className: "check" }, box, el("span", {}, c)));
  });
  $("name").value = state.name;
  $("name").addEventListener("input", () => {
    state.name = $("name").value;
    updateProgress();
    save();
  });

  function showSubmitted() {
    if (state.submittedAt) {
      $("status").textContent = `Submitted ${new Date(state.submittedAt).toLocaleString("en-AU")}. You can change your report and submit again; the latest version replaces the earlier one.`;
    }
  }

  $("send").addEventListener("click", async () => {
    $("send").disabled = true;
    $("status").textContent = "Sending…";
    try {
      const res = await fetch("/api/report/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: state.name, fields: state.fields, checklist: state.checklist }),
      });
      if (!res.ok) throw new Error("http " + res.status);
      state.submittedAt = (await res.json()).submittedAt;
      save();
      showSubmitted();
    } catch {
      $("status").textContent = "Could not send. Check the Wi-Fi and try again, or use “Download a copy” and show it to your trainer.";
    }
    updateProgress();
  });

  $("download").addEventListener("click", () => {
    const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${FORM.title}</title><style>${window.REPORT_PRINT_CSS}</style></head><body>${window.renderReport(FORM, state)}</body></html>`;
    const a = el("a", { href: URL.createObjectURL(new Blob([html], { type: "text/html" })), download: `Bellarine report ${state.name.trim() || "draft"}.html` });
    document.body.append(a);
    a.click();
    a.remove();
  });

  // Session page: that session's brief on top and its sections below, with nothing from the other sessions.
  // The submission shows only in Session 3. /report (no session) is the whole report, for the trainer.
  if (only) {
    const first = FORM.sections.find((s) => s.session === only).n;
    const last = only === 3 ? 10 : FORM.sections.filter((s) => s.session === only).at(-1).n;
    document.title = `Session ${only} · Bellarine Pathology`;
    $("title").textContent = `Session ${only}`;
    const hasBrief = $("briefHead").closest("section").dataset.sessions.split(" ").includes(String(only));
    $("lede").textContent = `${hasBrief ? `Read the brief, then fill in sections ${first}–${last} of your report below.` : `Fill in sections ${first}–${last} of your report below.`} Short, clear answers are enough. Your work is saved on this device as you type.`;
    $("sessions").hidden = true;
    document.querySelectorAll("section.brief").forEach((b) => { b.hidden = !b.dataset.sessions.split(" ").includes(String(only)); });
    $("yourReport").hidden = false;
    $("yourReport").textContent = `Your report: sections ${first}–${last}`;
    $("submit").hidden = only !== 3;
    // Feedback in Session 3 can change an earlier section, so section 9 links back to the earlier pages, and they link back here.
    if (only === 3) {
      $("s9").append(el("p", { className: "small" }, "Need to change an earlier section? Go to ",
        el("a", { href: "/brief?from=3" }, "sections 1–3"), " or ", el("a", { href: "/brief2?from=3#s4" }, "sections 4–6"), "."));
    } else if (new URLSearchParams(location.search).get("from") === "3") {
      $("lede").after(el("p", {}, el("a", { href: "/report/3#s9" }, "← Back to Session 3")));
    }
  } else {
    document.querySelector('#sessions a[data-session="0"]').setAttribute("aria-current", "page");
  }

  updateProgress();
  showSubmitted();
  // Sections are built here, after the browser has looked for the #section in the address.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  // The Back button can restore this page from memory with an old copy of the report: reload so a later save cannot undo newer work.
  window.addEventListener("pageshow", (e) => { if (e.persisted) location.reload(); });
})();
