// A tap-to-choose activity run inside a report section, so learners stay on one page (section 3 runs /tech this way).
// Same server API and host view as the stand-alone activities (/api/pick). Learners can retry the items they got wrong:
// every answer counts, and onDone(latest answers, first-try score) hands them to the report after each round.
window.mountActivity = (root, A, { learnerId, saved, onDone }) => {
  const LABEL = Object.fromEntries(A.options.map((o) => [o.id, o.label]));
  const ID = Object.fromEntries(A.options.map((o) => [o.label, o.id]));
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  // Best-effort send with a few retries, so a patchy connection does not lose an answer.
  function send(path, body, attempt = 0) {
    fetch(`/api/pick/${A.key}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: learnerId, ...body }),
      keepalive: true,
    }).then((r) => {
      if (!r.ok && r.status >= 500 && attempt < 3) throw new Error("retry");
    }).catch(() => {
      if (attempt < 3) setTimeout(() => send(path, body, attempt + 1), 1000 * 2 ** attempt);
    });
  }

  const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Three views: intro (legend and Start), play (one card at a time), end (score and review).
  const start = el("button", { type: "button", className: "btn primary" }, "Start");
  const intro = el("div", { className: "act-intro" },
    el("ul", { className: "act-legend" }, ...A.options.map((o) => el("li", {}, el("strong", {}, `${o.label}: `), o.hint || ""))),
    start);
  const count = el("span", { className: "act-count" });
  const fill = el("i");
  const card = el("p", { className: "act-item", tabIndex: -1 });
  const choices = el("div", { className: "act-choices", role: "group" });
  choices.setAttribute("aria-label", "Choose one");
  const live = el("p", { className: "sr" });
  live.setAttribute("aria-live", "polite");
  const play = el("div", { className: "act-play", hidden: true },
    el("div", { className: "act-head" }, count, el("div", { className: "act-bar" }, fill)), card, choices, live);
  const score = el("p", { className: "act-score" });
  const note = el("p", { className: "small" });
  const review = el("ol", { className: "act-review" });
  const again = el("button", { type: "button", className: "btn primary" }, "Retry the ones you got wrong");
  const end = el("div", { className: "act-end", hidden: true }, score, note, review, again);
  root.append(intro, play, end);

  let order = [];
  let index = 0;
  let retrying = false;
  // item id -> the learner's latest answer (option id), restored from the report on reload.
  let latest = Object.fromEntries(A.items.filter((it) => ID[saved[it.id]]).map((it) => [it.id, ID[saved[it.id]]]));
  const wrong = () => A.items.filter((it) => latest[it.id] !== it.answer);

  A.options.forEach((o) => {
    choices.append(el("button", { type: "button", className: "btn act-choice", onclick: () => commit(o.id) }, o.label));
  });

  function show(view) {
    intro.hidden = view !== intro;
    play.hidden = view !== play;
    end.hidden = view !== end;
    root.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // A retry replays only the items still wrong.
  function begin(retry) {
    retrying = retry;
    if (!retry) latest = {};
    order = shuffle(retry ? wrong() : A.items);
    index = 0;
    show(play);
    renderItem();
    if (!retry) send("join", {});
  }

  function renderItem() {
    const it = order[index];
    card.textContent = it.text;
    count.textContent = `${index + 1} / ${order.length}`;
    fill.style.width = `${(index / order.length) * 100}%`;
    live.textContent = `Item ${index + 1} of ${order.length}: ${it.text}`;
    card.focus({ preventScroll: true });
  }

  function commit(answer) {
    latest[order[index].id] = answer;
    send("answer", { item: order[index].id, answer });
    index += 1;
    if (index >= order.length) finish();
    else renderItem();
  }

  // Score, review list (the learner's answer, the right one and why) and the retry button.
  function showResults() {
    const right = A.items.length - wrong().length;
    score.textContent = `You got ${right} out of ${A.items.length}`;
    note.textContent = right < A.items.length
      ? "Read why, then retry the ones you got wrong: your latest answers count. They are saved in your report."
      : "All correct. Your answers are saved in your report.";
    again.hidden = right === A.items.length;
    const left = A.items.length - right;
    again.textContent = `Retry the ${left === 1 ? "one" : left} you got wrong`;
    review.textContent = "";
    A.items.forEach((it) => {
      const ok = latest[it.id] === it.answer;
      review.append(el("li", { className: ok ? "right" : "wrong" },
        el("p", { className: "rhead" }, `${ok ? "✓" : "✗"} ${it.text}`),
        el("p", { className: "rans" }, ok ? `Answer: ${LABEL[it.answer]}.` : `You said ${LABEL[latest[it.id]] || "nothing"}. Answer: ${LABEL[it.answer]}.`),
        el("p", { className: "rwhy" }, it.why)));
    });
  }

  function finish() {
    fill.style.width = "100%";
    const first = retrying ? null : `${A.items.length - wrong().length} of ${A.items.length}`;
    onDone(Object.fromEntries(Object.entries(latest).map(([item, opt]) => [item, LABEL[opt]])), first);
    showResults();
    show(end);
  }

  start.addEventListener("click", () => begin(false));
  again.addEventListener("click", () => begin(true));

  // Already done on this device: show the saved answers (and any retry) instead of Start.
  if (A.items.every((it) => latest[it.id])) {
    showResults();
    intro.hidden = true;
    end.hidden = false;
  }
};
