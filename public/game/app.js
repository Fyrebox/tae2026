// Player for the workplace games: plays the ink story one line at a time, with the speaker's face, a speech
// bubble and tap-to-reply buttons. Progress is kept on this device (so a reload carries on) and sent to the
// trainer's host view. At 5 pm it builds the learner's recommendation from their answers and sends it.
(() => {
  const G = JSON.parse(document.getElementById("game").textContent);
  const STORY = document.getElementById("story").textContent;
  const $ = (id) => document.getElementById(id);
  const KEY = `game:${G.key}`;
  const card = Object.fromEntries(G.cards.map((c) => [c.id, c]));
  const money = (n) => "$" + n.toLocaleString("en-AU");
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids.filter((k) => k !== null && k !== undefined && k !== false));
    return n;
  };

  // An anonymous id so the host can count learners (shared with the other class activities).
  const learnerId = (() => {
    const make = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    try {
      let id = localStorage.getItem("sortId");
      if (!id) { id = make(); localStorage.setItem("sortId", id); }
      return id;
    } catch { return make(); }
  })();

  function send(path, body, attempt = 0) {
    return fetch(`/api/game/${G.key}/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: learnerId, ...body }), keepalive: true,
    }).then((r) => {
      if (!r.ok && r.status >= 500 && attempt < 3) throw new Error("retry");
      return r.ok;
    }).catch(() => {
      if (attempt < 3) return new Promise((ok) => setTimeout(() => ok(send(path, body, attempt + 1)), 1000 * 2 ** attempt));
      return false;
    });
  }

  let story = new inkjs.Story(STORY);
  // What is on screen, saved with the story so a reload shows the same moment.
  let view = { scene: "desk", clock: "9:00 am", level: "", who: "", face: "happy", text: "", mood: "", show: "", ended: false, sent: false };
  const v = (name) => story.variablesState[name];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ ink: story.state.toJson(), view })); } catch { /* storage blocked */ }
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved) return false;
      story.state.LoadJson(saved.ink);
      view = { ...view, ...saved.view };
      return true;
    } catch { return false; }
  }

  // ---- Drawing ----
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let drawnScene = "";
  function drawScene() {
    if (drawnScene === view.scene) return;
    const s = GameArt.scene(view.scene);
    $("back").innerHTML = s.back;
    $("front").innerHTML = s.front;
    drawnScene = view.scene;
  }
  // Restart a CSS animation class on an element.
  function replay(node, cls) {
    node.classList.remove(cls);
    if (reduced) return;
    void node.getBoundingClientRect();
    node.classList.add(cls);
  }

  // A new speaker slides out the last one first; the same speaker just changes face.
  let shownWho = "";
  let swapTimer = 0;
  function drawActor() {
    const who = G.cast[view.who];
    const actor = $("actor");
    clearTimeout(swapTimer);
    if (!who) { actor.classList.remove("on"); shownWho = ""; return; }
    const paint = () => {
      actor.innerHTML = GameArt.person(who.look, view.face);
      actor.classList.add("on");
      replay(actor, "talking");
    };
    if (!reduced && shownWho && shownWho !== view.who && actor.classList.contains("on")) {
      actor.classList.remove("on");
      swapTimer = setTimeout(paint, 280);
    } else paint();
    shownWho = view.who;
  }
  // A right answer gets a nod, a wrong one a shake of the head.
  function react(mood) {
    const actor = $("actor");
    actor.classList.remove("nod", "shake");
    if (mood) replay(actor, mood === "good" ? "nod" : "shake");
  }

  let shownScore = null;
  function drawHud() {
    $("clock").textContent = view.clock;
    $("level").textContent = view.level;
    const score = v("score");
    $("score").textContent = score;
    if (shownScore !== null && score > shownScore) replay($("score"), "bump");
    shownScore = score;
  }
  function banner(text) {
    if (reduced || !text) return;
    const b = el("div", { className: "banner", textContent: text });
    $("stage").append(b);
    setTimeout(() => b.remove(), 2300);
  }

  // The line types out (a tap shows it all). Screen readers get the whole line at once from a hidden live region.
  let typing = null;
  function finishTyping() {
    if (!typing) return;
    cancelAnimationFrame(typing.raf);
    $("line").textContent = typing.text;
    const done = typing.done;
    typing = null;
    done();
  }
  function typeLine(text, done) {
    if (typing) { cancelAnimationFrame(typing.raf); typing = null; } // a new line replaces one still typing
    const line = $("line");
    if (reduced || !text) { line.textContent = text; done(); return; }
    const shown = el("span");
    const rest = el("span", { className: "rest", textContent: text });
    line.textContent = "";
    line.append(shown, rest);
    const per = Math.min(1000 / 45, 2400 / text.length); // about 45 characters a second, never more than 2.4 s a line
    $("actor").style.setProperty("--talk", String(Math.max(2, Math.round((per * text.length) / 180))));
    const t0 = performance.now();
    typing = { text, done, raf: 0 };
    const tick = () => {
      const n = Math.min(text.length, Math.floor((performance.now() - t0) / per));
      shown.textContent = text.slice(0, n);
      rest.textContent = text.slice(n);
      if (n >= text.length) finishTyping();
      else typing.raf = requestAnimationFrame(tick);
    };
    typing.raf = requestAnimationFrame(tick);
  }
  function drawLine() {
    const who = G.cast[view.who];
    const bubble = $("bubble");
    bubble.className = "bubble" + (who ? " speech " + view.who : " narrator") + (view.mood ? " " + view.mood : "");
    $("who").textContent = who ? who.name : "";
    $("who").hidden = !who;
    $("say").textContent = (who ? who.name + ": " : "") + view.text;
    replay(bubble, "pop");
    $("choices").hidden = true;
    $("choices").textContent = ""; // the replies are added when the line has typed out
    $("next").hidden = false;
    $("next").textContent = "Next ›";
    typeLine(view.text, drawChoices);
  }
  function toast(mood) {
    const t = $("toast");
    t.textContent = mood === "good" ? "✓" : "✗";
    t.className = "toast " + mood;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 900);
  }
  function drawChoices() {
    const box = $("choices");
    box.textContent = "";
    const choices = story.currentChoices;
    choices.forEach((c, i) => {
      const b = el("button", { type: "button", className: "btn choice" + (reduced ? "" : " enter"), textContent: c.text, onclick: () => choose(i) });
      b.style.setProperty("--i", String(i));
      box.append(b);
    });
    box.hidden = !choices.length;
    const atEnd = !story.canContinue && !choices.length;
    $("next").hidden = choices.length > 0;
    $("next").textContent = atEnd ? "See my recommendation ›" : "Next ›";
  }

  // ---- Playing ----
  let lastSent = "";
  function report() {
    const body = { level: view.level, score: v("score"), total: v("total") };
    const key = JSON.stringify(body);
    if (key === lastSent || !view.level) return;
    lastSent = key;
    send("progress", body);
  }

  function applyTags(tags) {
    let speaker = "";
    let mood = "";
    let show = "";
    for (const raw of tags) {
      const [name, value = ""] = raw.split(":").map((s) => s.trim());
      if (G.cast[name]) { speaker = name; view.face = value || "happy"; }
      else if (name === "scene") view.scene = value;
      else if (name === "clock") view.clock = raw.slice(raw.indexOf(":") + 1).trim();
      else if (name === "level") view.level = value;
      else if (name === "good" || name === "bad") mood = name;
      else if (name === "show") show = value;
    }
    view.who = speaker;
    view.mood = mood;
    return show;
  }

  // Show the next line of the story (skipping lines that only carry tags).
  function step() {
    let show = "";
    while (story.canContinue) {
      const text = story.Continue().trim();
      show = applyTags(story.currentTags) || show;
      if (text) { view.text = text; break; }
    }
    view.show = show; // the panel this line opened, so the learner can reopen it
    const newLevel = view.level !== shownLevel;
    render();
    if (newLevel) banner(`${view.clock} · ${view.level}`);
    if (view.mood) { toast(view.mood); react(view.mood); }
    report();
    save();
    if (show) openPanel(show, { story: true });
  }

  let shownLevel = "";
  function render() {
    shownLevel = view.level;
    drawScene();
    drawActor();
    drawHud();
    drawLine(); // shows the replies once the line has typed out
    drawReopen();
  }

  // While the story is on a line that opened a panel, a button under the bubble opens it again.
  function drawReopen() {
    const t = TABS[view.show];
    $("reopen").hidden = !t;
    if (t) $("reopen").textContent = t.again;
  }

  function choose(i) {
    story.ChooseChoiceIndex(i);
    step();
  }

  $("next").addEventListener("click", () => {
    if (typing) { finishTyping(); return; }
    if (story.canContinue) step();
    else if (!story.currentChoices.length) finish();
  });
  $("bubble").addEventListener("click", () => {
    if (typing) { finishTyping(); return; }
    if (story.canContinue && !story.currentChoices.length) step();
  });
  $("stage").addEventListener("click", finishTyping);

  // ---- Notes panel: the rules, the three options, the comparison and the pitch ----
  const TABS = {
    policy: { label: "Rules", title: G.rulesTitle, again: "Read the rules again" },
    cards: { label: "Options", title: "Three ideas", again: "See the three ideas again" },
    compare: { label: "Compare", title: "Your comparison", again: "See the comparison again" },
    pitch: { label: "Pitch", title: "Your one-minute pitch", again: "See my pitch script again" },
  };
  const filled = (s) => s || "?";
  const risk = (id) => v(`${id}_risk`);
  const goal = (id) => v(`${id}_goal`);

  function pitchLines() {
    const c = card[v("start")];
    if (!c) return null;
    return [
      ["The problem", c.problem],
      ["My recommendation and why", `Start with the ${c.title} (${c.product}). ${v("start_why")}`],
      ["The main risk and how we manage it", `${filled(risk(c.id))}. ${v("start_fix")}`],
      ["Ask", "What would you change?"],
    ];
  }

  const RENDER = {
    policy: () => el("div", {},
      el("ol", { className: "rules" }, ...G.rules.map((r) => el("li", { textContent: r }))),
      el("p", { className: "law", textContent: G.laws }),
      el("p", { className: "small", textContent: `Budget: ${money(G.budget.setup)} to set up and ${money(G.budget.monthly)} a month.` })),
    cards: () => el("div", { className: "cards" }, ...G.cards.map((c) => el("article", { className: `card ${c.id}` },
      el("p", { className: "tag", textContent: `${c.type}: ${c.kind}` }),
      el("h3", { textContent: c.title }),
      el("p", { className: "product", textContent: c.product }),
      el("p", { textContent: c.text }),
      el("p", { className: "cost", textContent: `${money(c.setup)} to set up · ${money(c.monthly)} a month · Effort: ${c.effort}` })))),
    compare: () => el("div", { className: "cards" }, ...G.cards.map((c) => el("article", { className: `card ${c.id}` },
      el("p", { className: "tag", textContent: `${c.type}: ${c.kind}` }),
      el("h3", { textContent: c.title }),
      el("dl", {},
        el("dt", { textContent: "Solves" }), el("dd", { textContent: filled(goal(c.id)) }),
        el("dt", { textContent: "Data needed" }), el("dd", { textContent: c.data }),
        el("dt", { textContent: "Cost" }), el("dd", { textContent: `${money(c.setup)} + ${money(c.monthly)} a month` }),
        el("dt", { textContent: "Effort" }), el("dd", { textContent: c.effort }),
        el("dt", { textContent: "Main risk" }), el("dd", { textContent: filled(risk(c.id)) }))))),
    pitch: () => {
      const lines = pitchLines();
      if (!lines) return el("p", { className: "small", textContent: "Your pitch appears here once you pick the option to start with." });
      return el("ol", { className: "pitch" }, ...lines.map(([h, t]) => el("li", {}, el("strong", { textContent: h }), el("span", { textContent: t }))));
    },
  };

  let returnFocus = null;
  // Opened by the story: just that panel, no tabs, and Close below it, so the learner reads it and carries on.
  // Opened with the Notes button: every tab, with Close at the top right.
  function openPanel(name, { story = false } = {}) {
    const tab = TABS[name] ? name : "policy";
    $("panelTitle").textContent = TABS[tab].title;
    const tabs = $("tabs");
    tabs.textContent = "";
    Object.entries(TABS).forEach(([k, t]) => {
      if (k === "pitch" && !v("start")) return;
      tabs.append(el("button", { type: "button", className: "tab" + (k === tab ? " on" : ""), textContent: t.label, onclick: () => openPanel(k) }));
    });
    $("panelBody").textContent = "";
    $("panelBody").append(RENDER[tab]());
    tabs.hidden = story;
    $("panelClose").hidden = story;
    $("panelDone").hidden = !story;
    if ($("panel").hidden) returnFocus = document.activeElement;
    $("panel").hidden = false;
    $("panel").querySelector(".sheet").scrollTop = 0;
    // In story mode, start reading at the title (the Close button is below the content).
    if (story) $("panelTitle").focus({ preventScroll: true });
    else $("panelClose").focus();
  }
  function closePanel() {
    $("panel").hidden = true;
    (returnFocus && document.body.contains(returnFocus) ? returnFocus : $("next")).focus?.();
  }
  $("panelClose").addEventListener("click", closePanel);
  $("panelDone").addEventListener("click", closePanel);
  $("reopen").addEventListener("click", () => { if (TABS[view.show]) openPanel(view.show, { story: true }); });
  $("panel").addEventListener("click", (e) => { if (e.target === $("panel")) closePanel(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("panel").hidden) closePanel(); });
  $("notesBtn").addEventListener("click", () => openPanel("policy"));

  // ---- 5 pm: the recommendation, the checklist and sending it ----
  function memo() {
    const c = card[v("start")];
    const others = G.cards.filter((o) => o.id !== c.id);
    const row = (label, ...text) => el("div", { className: "row" }, el("h3", { textContent: label }), ...text.map((t) => (typeof t === "string" ? el("p", { textContent: t }) : t)));
    const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
    return [
      el("p", { className: "memo-head", textContent: `To: ${G.manager[0].toUpperCase() + G.manager.slice(1)}, ${G.place}` }),
      el("p", { className: "memo-head", id: "memoFrom", textContent: "From: (your first name)" }),
      el("p", { className: "memo-head", textContent: `Date: ${today}` }),
      row("Recommendation", `Start with the ${c.title} (${c.product}): ${c.type}, ${c.kind}. ${c.text}`),
      row("Why", v("start_why")),
      row("Cost", `${money(c.setup)} to set up and ${money(c.monthly)} a month, inside the budget of ${money(G.budget.setup)} and ${money(G.budget.monthly)} a month.`),
      row("Main risk and how we manage it", `${filled(risk(c.id))}. ${v("start_fix")}`),
      row("How it follows our rules", el("ul", {}, ...G.rules.map((r) => el("li", { textContent: r }))), G.laws),
      row("Compared with", el("ul", {}, ...others.map((o) => el("li", { textContent: `${o.title} (${o.type}): ${filled(goal(o.id))}. Main risk: ${filled(risk(o.id))}. ${money(o.setup)} + ${money(o.monthly)} a month, effort ${o.effort.toLowerCase()}.` })))),
      row("Change after the owner's feedback", `The owner said: "${v("feedback")}" What I changed: ${v("change")}`),
    ];
  }

  function finish() {
    view.ended = true;
    save();
    showEnd();
  }

  function showEnd() {
    show("end");
    $("endEyebrow").textContent = `${view.clock} · Send it`;
    $("endScore").textContent = `Right first time: ${v("score")} out of ${v("total")}. Check your recommendation, then send it.`;
    $("memo").textContent = "";
    $("memo").append(...memo());
    const list = $("checklist");
    list.textContent = "";
    G.checklist.forEach((text, i) => {
      list.append(el("label", { className: "tick" }, el("input", { type: "checkbox", id: `tick${i}`, onchange: ready }), el("span", { textContent: text })));
    });
    if (view.sent) sentState(view.sentName);
    ready();
  }

  function ready() {
    const name = $("name").value.trim();
    $("memoFrom").textContent = `From: ${name || "(your first name)"}`;
    const ticked = G.checklist.every((_, i) => $(`tick${i}`).checked);
    $("send").disabled = !(name && ticked);
    if (!view.sent) $("sendNote").textContent = name && ticked ? "" : "Tick every box and add your first name to send.";
  }
  $("name").addEventListener("input", ready);

  function sentState(name) {
    $("sendNote").textContent = `Sent ✓ Thanks, ${name}. Your trainer can see your recommendation.`;
    $("send").textContent = "Send again (replaces the last one)";
  }

  $("sendForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if ($("send").disabled) return;
    const name = $("name").value.trim();
    const answers = Object.fromEntries(["start", "start_why", "start_fix", "feedback", "change", "ai_goal", "ai_risk", "ml_goal", "ml_risk", "dl_goal", "dl_risk"].map((k) => [k, v(k)]));
    $("send").disabled = true;
    $("sendNote").textContent = "Sending…";
    const ok = await send("submit", { name, score: v("score"), total: v("total"), answers });
    if (ok) {
      view.sent = true;
      view.sentName = name;
      save();
      sentState(name);
      celebrate();
    } else {
      $("sendNote").textContent = "Couldn't send. Check the Wi-Fi, then tap Send again.";
    }
    $("send").disabled = false;
  });

  function celebrate() {
    if (reduced) return;
    const burst = el("div", { className: "burst" });
    burst.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const d = 90 + (i % 3) * 40;
      const s = el("span", { textContent: "★" });
      s.style.setProperty("--dx", `${Math.round(Math.cos(a) * d)}px`);
      s.style.setProperty("--dy", `${Math.round(Math.sin(a) * d)}px`);
      burst.append(s);
    }
    document.body.append(burst);
    setTimeout(() => burst.remove(), 1300);
  }

  // ---- Screens ----
  function show(name) {
    ["intro", "play", "end"].forEach((s) => { $(s).hidden = s !== name; });
    window.scrollTo(0, 0);
  }

  function begin(fresh) {
    if (fresh) {
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      story = new inkjs.Story(STORY);
      view = { scene: "desk", clock: "9:00 am", level: "", who: "", face: "happy", text: "", mood: "", show: "", ended: false, sent: false };
      drawnScene = "";
      lastSent = "";
      shownLevel = "";
      shownScore = null;
    }
    show("play");
    if (fresh || !view.text) step();
    else { render(); report(); }
  }

  // Two taps to start again, so nobody loses their day by accident.
  function armRestart(button) {
    button.addEventListener("click", () => {
      if (button.dataset.armed) { begin(true); return; }
      button.dataset.armed = "1";
      const label = button.textContent;
      button.textContent = "Tap again to start again (your answers are cleared)";
      setTimeout(() => { delete button.dataset.armed; button.textContent = label; }, 4000);
    });
  }

  $("introArt").innerHTML = GameArt.person(Object.values(G.cast)[0].look, "happy");
  setTimeout(() => replay($("introArt"), "waving"), 500); // the manager waves hello
  const resumed = load();
  if (resumed) {
    $("start").textContent = view.ended ? "See my recommendation" : `Carry on (${view.clock})`;
    $("restart").hidden = false;
  }
  $("start").addEventListener("click", () => (resumed && view.ended ? showEnd() : begin(!resumed)));
  armRestart($("restart"));
  armRestart($("again"));
})();
