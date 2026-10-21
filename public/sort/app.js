// "Rule or AI?": swipe left for Rule, swipe right for AI. Answers are sent to /api/sort as they are made.
(() => {
  const DECK = JSON.parse(document.getElementById("deck").textContent);
  const LABEL = { rule: "Rule", ai: "AI" };
  const $ = (id) => document.getElementById(id);
  const screens = { intro: $("intro"), play: $("play"), end: $("end") };
  const card = $("card");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // An anonymous id so the host can count learners. Nothing personal; kept only to avoid double counting on reload.
  function learnerId() {
    try {
      let id = localStorage.getItem("sortId");
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
        localStorage.setItem("sortId", id);
      }
      return id;
    } catch {
      return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    }
  }
  const id = learnerId();

  // Best-effort send with a few retries, so a patchy connection does not lose an answer.
  function send(path, body, attempt = 0) {
    fetch("/api/sort/" + path, {
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
  let busy = false;

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

  function begin(isPractice) {
    practice = isPractice;
    order = shuffle(DECK);
    index = 0;
    given = [];
    busy = false;
    show("play");
    renderCard();
    if (!practice) send("join", {});
  }

  function renderCard() {
    const c = order[index];
    $("cardText").textContent = c.text;
    $("count").textContent = `${index + 1} / ${order.length}`;
    $("bar").style.width = `${(index / order.length) * 100}%`;
    $("live").textContent = `Card ${index + 1} of ${order.length}: ${c.text}`;
    card.setAttribute("aria-label", `Card ${index + 1} of ${order.length}: ${c.text}`);
    card.style.transition = "none";
    card.style.transform = "";
    card.style.setProperty("--l", 0);
    card.style.setProperty("--r", 0);
    card.classList.remove("enter");
    void card.offsetWidth; // restart the entry animation
    if (!reduceMotion) card.classList.add("enter");
    card.style.transition = "";
  }

  function commit(answer) {
    if (busy) return;
    busy = true;
    const c = order[index];
    given.push(answer);
    if (!practice) send("answer", { card: c.id, answer });
    const dir = answer === "ai" ? 1 : -1;
    card.style.setProperty(answer === "ai" ? "--r" : "--l", 1);
    card.style.transform = `translateX(${dir * window.innerWidth * 1.2}px) rotate(${dir * 18}deg)`;
    setTimeout(() => {
      index += 1;
      busy = false;
      if (index >= order.length) finish();
      else renderCard();
    }, reduceMotion ? 0 : 230);
  }

  function finish() {
    $("bar").style.width = "100%";
    const score = order.filter((c, i) => given[i] === c.answer).length;
    $("score").textContent = `You got ${score} out of ${order.length}`;
    $("endNote").textContent = practice
      ? "Practice round: this one was not counted."
      : "Watch the main screen for the class results.";
    const list = $("review");
    list.textContent = "";
    order.forEach((c, i) => {
      const right = given[i] === c.answer;
      const li = document.createElement("li");
      li.className = right ? "right" : "wrong";
      const head = document.createElement("p");
      head.className = "rhead";
      head.textContent = `${right ? "✓ Correct" : "✗ Not quite"}: ${c.text}`;
      const ans = document.createElement("p");
      ans.className = "rans";
      ans.textContent = right ? `Answer: ${LABEL[c.answer]}.` : `You said ${LABEL[given[i]]}. Answer: ${LABEL[c.answer]}.`;
      const why = document.createElement("p");
      why.className = "rwhy";
      why.textContent = c.why;
      li.append(head, ans, why);
      list.append(li);
    });
    show("end");
  }

  // Dragging the card. Pointer events cover touch and mouse.
  let startX = 0;
  let startT = 0;
  let dx = 0;
  let dragging = false;
  const threshold = () => Math.min(110, window.innerWidth * 0.25);

  card.addEventListener("pointerdown", (e) => {
    if (busy) return;
    dragging = true;
    startX = e.clientX;
    startT = e.timeStamp;
    dx = 0;
    card.setPointerCapture(e.pointerId);
    card.style.transition = "none";
  });
  card.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    const pull = Math.min(1, Math.abs(dx) / threshold());
    card.style.setProperty("--l", dx < 0 ? pull : 0);
    card.style.setProperty("--r", dx > 0 ? pull : 0);
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    card.style.transition = "";
    const speed = Math.abs(dx) / Math.max(1, e.timeStamp - startT);
    if (Math.abs(dx) > threshold() || (Math.abs(dx) > 40 && speed > 0.6)) {
      commit(dx > 0 ? "ai" : "rule");
    } else {
      card.style.transform = "";
      card.style.setProperty("--l", 0);
      card.style.setProperty("--r", 0);
    }
  };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);

  $("btnRule").addEventListener("click", () => commit("rule"));
  $("btnAi").addEventListener("click", () => commit("ai"));
  document.addEventListener("keydown", (e) => {
    if (screens.play.hidden) return;
    if (e.key === "ArrowLeft") commit("rule");
    if (e.key === "ArrowRight") commit("ai");
  });
  $("start").addEventListener("click", () => begin(false));
  $("again").addEventListener("click", () => begin(true));
})();
