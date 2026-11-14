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
  let view = { scene: "desk", clock: "9:00 am", level: "", who: "", face: "happy", text: "", mood: "", ended: false, sent: false };
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
  function drawActor() {
    const who = G.cast[view.who];
    const actor = $("actor");
    if (!who) { actor.classList.remove("on"); return; }
    actor.innerHTML = GameArt.person(who.look, view.face);
    actor.classList.add("on");
    actor.classList.remove("talking");
    if (!reduced) { void actor.offsetWidth; actor.classList.add("talking"); }
  }
  function drawHud() {
    $("clock").textContent = view.clock;
    $("level").textContent = view.level;
    $("score").textContent = v("score");
  }
  function drawLine() {
    const who = G.cast[view.who];
    const bubble = $("bubble");
    bubble.className = "bubble" + (who ? " speech " + view.who : " narrator") + (view.mood ? " " + view.mood : "");
    $("who").textContent = who ? who.name : "";
    $("who").hidden = !who;
    $("line").textContent = view.text;
    if (!reduced) { bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop"); }
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
      box.append(el("button", { type: "button", className: "btn choice", textContent: c.text, onclick: () => choose(i) }));
    });
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
    render();
    if (view.mood) toast(view.mood);
    report();
    save();
    if (show) openPanel(show);
  }

  function render() {
    drawScene();
    drawActor();
    drawHud();
    drawLine();
    drawChoices();
  }

  function choose(i) {
    story.ChooseChoiceIndex(i);
    step();
  }

  $("next").addEventListener("click", () => {
    if (story.canContinue) step();
    else if (!story.currentChoices.length) finish();
  });
  $("bubble").addEventListener("click", () => { if (story.canContinue && !story.currentChoices.length) step(); });

  // ---- Notes panel: the rules, the three options, the comparison and the pitch ----
  const TABS = {
    policy: { label: "Rules", title: "The salon's AI rules" },
    cards: { label: "Options", title: "Three ideas" },
    compare: { label: "Compare", title: "Your comparison" },
    pitch: { label: "Pitch", title: "Your one-minute pitch" },
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
  function openPanel(name) {
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
    if ($("panel").hidden) returnFocus = document.activeElement;
    $("panel").hidden = false;
    $("panelClose").focus();
  }
  function closePanel() {
    $("panel").hidden = true;
    (returnFocus && document.body.contains(returnFocus) ? returnFocus : $("next")).focus?.();
  }
  $("panelClose").addEventListener("click", closePanel);
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
    } else {
      $("sendNote").textContent = "Couldn't send. Check the Wi-Fi, then tap Send again.";
    }
    $("send").disabled = false;
  });

  // ---- Screens ----
  function show(name) {
    ["intro", "play", "end"].forEach((s) => { $(s).hidden = s !== name; });
    window.scrollTo(0, 0);
  }

  function begin(fresh) {
    if (fresh) {
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      story = new inkjs.Story(STORY);
      view = { scene: "desk", clock: "9:00 am", level: "", who: "", face: "happy", text: "", mood: "", ended: false, sent: false };
      drawnScene = "";
      lastSent = "";
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

  $("introArt").innerHTML = GameArt.person("owner", "happy");
  const resumed = load();
  if (resumed) {
    $("start").textContent = view.ended ? "See my recommendation" : `Carry on (${view.clock})`;
    $("restart").hidden = false;
  }
  $("start").addEventListener("click", () => (resumed && view.ended ? showEnd() : begin(!resumed)));
  armRestart($("restart"));
  armRestart($("again"));
})();
