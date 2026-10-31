// A tap-to-choose activity run inside a report section, so learners stay on one page (section 3 runs /tech this way).
// Same server API and host view as the stand-alone activities (/api/pick); the counted answers go into the report.
window.mountActivity = (root, A, { learnerId, saved, onDone }) => {
  const LABEL = Object.fromEntries(A.options.map((o) => [o.id, o.label]));
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
  const again = el("button", { type: "button", className: "btn" }, "Try again (practice, not counted)");
  const end = el("div", { className: "act-end", hidden: true }, score, note, review, again);
  root.append(intro, play, end);

  let order = [];
  let index = 0;
  let given = [];
  let practice = false;

  A.options.forEach((o) => {
    choices.append(el("button", { type: "button", className: "btn act-choice", onclick: () => commit(o.id) }, o.label));
  });

  function show(view) {
    intro.hidden = view !== intro;
    play.hidden = view !== play;
    end.hidden = view !== end;
    root.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function begin(isPractice) {
    practice = isPractice;
    order = shuffle(A.items);
    index = 0;
    given = [];
    show(play);
    renderItem();
    if (!practice) send("join", {});
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
    given.push(answer);
    if (!practice) send("answer", { item: order[index].id, answer });
    index += 1;
    if (index >= order.length) finish();
    else renderItem();
  }

  // Review list: the learner's answer, the right one and why, item by item.
  function showResults(items, answerOf, noteText) {
    const right = items.filter((it) => answerOf(it) === it.answer).length;
    score.textContent = `You got ${right} out of ${items.length}`;
    note.textContent = noteText;
    review.textContent = "";
    items.forEach((it) => {
      const ok = answerOf(it) === it.answer;
      review.append(el("li", { className: ok ? "right" : "wrong" },
        el("p", { className: "rhead" }, `${ok ? "✓" : "✗"} ${it.text}`),
        el("p", { className: "rans" }, ok ? `Answer: ${LABEL[it.answer]}.` : `You said ${LABEL[answerOf(it)] || "nothing"}. Answer: ${LABEL[it.answer]}.`),
        el("p", { className: "rwhy" }, it.why)));
    });
  }

  function finish() {
    fill.style.width = "100%";
    const answers = Object.fromEntries(order.map((it, i) => [it.id, given[i]]));
    if (!practice) onDone(Object.fromEntries(Object.entries(answers).map(([item, opt]) => [item, LABEL[opt]])));
    showResults(order, (it) => answers[it.id], practice
      ? "Practice round: not counted. Your report keeps your first answers."
      : "Your answers are saved in your report. Watch the main screen for the class results.");
    show(end);
  }

  start.addEventListener("click", () => begin(false));
  again.addEventListener("click", () => begin(true));

  // Already done on this device: show the saved answers instead of Start.
  const ID = Object.fromEntries(A.options.map((o) => [o.label, o.id]));
  if (A.items.every((it) => ID[saved[it.id]])) {
    showResults(A.items, (it) => ID[saved[it.id]], "Your answers are saved in your report.");
    intro.hidden = true;
    end.hidden = false;
  }
};
