// Tap-to-choose activity: one item at a time, one tap per item. Answers are sent to /api/pick as they are made.
// An item can have its own choices (shuffled on screen); otherwise every item uses the activity's options.
// With A.retries, learners retry the items they got wrong and the latest answer counts. With A.saveAs, the result
// is kept on the device so the report form can copy it (the good-and-bad test).
(() => {
  const A = JSON.parse(document.getElementById("activity").textContent);
  const $ = (id) => document.getElementById(id);
  const screens = { intro: $("intro"), play: $("play"), end: $("end") };
  const choicesOf = (it) => it.options || A.options;
  const labelOf = (it, opt) => (choicesOf(it).find((o) => o.id === opt) || {}).label;

  // An anonymous id so the host can count learners. Nothing personal; kept only to avoid double counting on reload.
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

  // Best-effort send with a few retries, so a patchy connection does not lose an answer.
  function send(path, body, attempt = 0) {
    fetch(`/api/pick/${A.key}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
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

  let order = [];
  let index = 0;
  let latest = {}; // item id -> latest answer (option id)
  let retrying = false;
  let firstTry = null;
  let practice = false; // a second full run in an activity without retries is never counted

  function show(name) {
    Object.entries(screens).forEach(([key, el]) => { el.hidden = key !== name; });
    window.scrollTo(0, 0);
  }

  // Legend on the intro screen: only for short option sets that carry a hint.
  A.options.filter((o) => o.hint).forEach((o) => {
    const li = document.createElement("li");
    li.innerHTML = "<strong></strong> <span></span>";
    li.firstChild.textContent = o.label + ":";
    li.lastChild.textContent = o.hint;
    $("legend").append(li);
  });

  // Shared choice buttons stay in the same place; items with their own choices get fresh, shuffled buttons.
  function drawChoices(it) {
    const box = $("choices");
    box.textContent = "";
    const opts = it.options ? shuffle(it.options) : A.options;
    opts.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn choice";
      b.textContent = o.label;
      b.dataset.option = o.id;
      b.addEventListener("click", () => commit(o.id));
      box.append(b);
    });
    box.classList.toggle("long", opts.length > 4 || opts.some((o) => o.label.length > 24));
  }

  const wrong = () => A.items.filter((it) => latest[it.id] !== it.answer);

  function begin(mode) {
    retrying = mode === "retry";
    practice = mode === "practice";
    if (mode === "start") latest = {};
    const items = retrying ? wrong() : A.items;
    order = A.ordered ? items : shuffle(items);
    index = 0;
    show("play");
    renderItem();
    if (mode === "start") send("join", {});
  }

  function renderItem() {
    const it = order[index];
    $("itemText").textContent = it.text;
    $("count").textContent = `${index + 1} / ${order.length}`;
    $("bar").style.width = `${(index / order.length) * 100}%`;
    $("live").textContent = `Item ${index + 1} of ${order.length}: ${it.text}`;
    drawChoices(it);
    $("item").focus({ preventScroll: true });
  }

  function commit(answer) {
    const it = order[index];
    if (!practice) {
      latest[it.id] = answer;
      send("answer", { item: it.id, answer });
    }
    index += 1;
    if (index >= order.length) finish();
    else renderItem();
  }

  function save(score) {
    if (!A.saveAs) return;
    try {
      const answers = Object.fromEntries(A.items.map((it) => [it.id, labelOf(it, latest[it.id]) || ""]));
      localStorage.setItem(A.saveAs, JSON.stringify({ answers, score, total: A.items.length, firstTry }));
    } catch { /* storage blocked: the report just won't show the result */ }
  }

  function finish() {
    $("bar").style.width = "100%";
    const score = A.items.length - wrong().length;
    if (!retrying && !practice) firstTry = score;
    save(score);
    const left = A.items.length - score;
    $("score").textContent = `You got ${score} out of ${A.items.length}`;
    $("endNote").textContent = practice ? "Practice round: this one was not counted."
      : A.retries && left ? "Read why, then retry the ones you got wrong: your latest answers count. Watch the main screen for the class results."
        : "Watch the main screen for the class results.";
    if (A.retries) {
      $("again").hidden = !left;
      $("again").textContent = `Retry the ${left === 1 ? "one" : left} you got wrong`;
    }
    const list = $("review");
    list.textContent = "";
    A.items.forEach((it) => {
      const right = latest[it.id] === it.answer;
      const li = document.createElement("li");
      li.className = right ? "right" : "wrong";
      const head = document.createElement("p");
      head.className = "rhead";
      head.textContent = `${right ? "✓ Correct" : "✗ Not quite"}: ${it.text}`;
      const ans = document.createElement("p");
      ans.className = "rans";
      ans.textContent = right ? `Answer: ${labelOf(it, it.answer)}.` : `You said ${labelOf(it, latest[it.id]) || "nothing"}. Answer: ${labelOf(it, it.answer)}.`;
      const why = document.createElement("p");
      why.className = "rwhy";
      why.textContent = it.why;
      li.append(head, ans, why);
      list.append(li);
    });
    show("end");
  }

  $("start").addEventListener("click", () => begin("start"));
  $("again").addEventListener("click", () => begin(A.retries ? "retry" : "practice"));
})();
