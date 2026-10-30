// Tap-to-choose activity: one item at a time, one tap per item. Answers are sent to /api/pick as they are made.
(() => {
  const A = JSON.parse(document.getElementById("activity").textContent);
  const LABEL = Object.fromEntries(A.options.map((o) => [o.id, o.label]));
  const $ = (id) => document.getElementById(id);
  const screens = { intro: $("intro"), play: $("play"), end: $("end") };

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

  let order = [];
  let index = 0;
  let given = [];
  let practice = false;

  const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

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

  // Choice buttons, in the order given, so the same option is always in the same place.
  A.options.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn choice";
    b.textContent = o.label;
    b.dataset.option = o.id;
    b.addEventListener("click", () => commit(o.id));
    $("choices").append(b);
  });
  if (A.options.length > 4) $("choices").classList.add("long");

  function begin(isPractice) {
    practice = isPractice;
    order = shuffle(A.items);
    index = 0;
    given = [];
    show("play");
    renderItem();
    if (!practice) send("join", {});
  }

  function renderItem() {
    const it = order[index];
    $("itemText").textContent = it.text;
    $("count").textContent = `${index + 1} / ${order.length}`;
    $("bar").style.width = `${(index / order.length) * 100}%`;
    $("live").textContent = `Item ${index + 1} of ${order.length}: ${it.text}`;
    $("item").focus({ preventScroll: true });
  }

  function commit(answer) {
    const it = order[index];
    given.push(answer);
    if (!practice) send("answer", { item: it.id, answer });
    index += 1;
    if (index >= order.length) finish();
    else renderItem();
  }

  function finish() {
    $("bar").style.width = "100%";
    // Keep the counted answers on the device, so the report form can copy them (section 3 for /session1/tech).
    if (!practice) {
      try {
        localStorage.setItem(`pickAnswers:${A.key}`, JSON.stringify(Object.fromEntries(order.map((it, i) => [it.id, LABEL[given[i]]]))));
      } catch { /* storage blocked: the learner fills the report by hand */ }
    }
    const score = order.filter((it, i) => given[i] === it.answer).length;
    $("score").textContent = `You got ${score} out of ${order.length}`;
    $("endNote").textContent = practice
      ? "Practice round: this one was not counted."
      : "Watch the main screen for the class results.";
    const list = $("review");
    list.textContent = "";
    order.forEach((it, i) => {
      const right = given[i] === it.answer;
      const li = document.createElement("li");
      li.className = right ? "right" : "wrong";
      const head = document.createElement("p");
      head.className = "rhead";
      head.textContent = `${right ? "✓ Correct" : "✗ Not quite"}: ${it.text}`;
      const ans = document.createElement("p");
      ans.className = "rans";
      ans.textContent = right ? `Answer: ${LABEL[it.answer]}.` : `You said ${LABEL[given[i]]}. Answer: ${LABEL[it.answer]}.`;
      const why = document.createElement("p");
      why.className = "rwhy";
      why.textContent = it.why;
      li.append(head, ans, why);
      list.append(li);
    });
    show("end");
  }

  $("start").addEventListener("click", () => begin(false));
  $("again").addEventListener("click", () => begin(true));
})();
