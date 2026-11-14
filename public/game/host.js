// Host view for a workplace game: each learner's level, their right-first-time score, and the recommendation
// they sent (names appear only once sent). Refreshes every 3 seconds.
(() => {
  const G = JSON.parse(document.getElementById("game").textContent);
  const $ = (id) => document.getElementById(id);
  const card = Object.fromEntries(G.cards.map((c) => [c.id, c]));
  let pin = "";
  try { pin = sessionStorage.getItem("hostPin") || ""; } catch { /* storage blocked */ }
  let timer = null;
  $("joinUrl").textContent = location.host + G.path;

  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids.filter(Boolean));
    return n;
  };

  async function api(path, options = {}) {
    const res = await fetch(`/api/game/${G.key}/${path}`, { ...options, headers: { "x-host-pin": pin } });
    if (res.status === 401) throw Object.assign(new Error("pin"), { code: 401 });
    if (!res.ok) throw new Error("http " + res.status);
    return res.json();
  }

  function render({ levels, learners }) {
    const pitchAt = levels.indexOf("Pitch the owner");
    $("joined").textContent = learners.length;
    $("pitching").textContent = learners.filter((l) => !l.submittedAt && levels.indexOf(l.level) >= pitchAt).length;
    $("sent").textContent = learners.filter((l) => l.submittedAt).length;
    const list = $("learners");
    list.textContent = "";
    learners.forEach((l) => {
      const at = levels.indexOf(l.level);
      const steps = el("div", { className: "steps", title: l.level }, ...levels.map((_, i) => el("i", { className: i <= at ? "done" : "" })));
      const li = el("li", { className: "learner" + (l.submittedAt ? " sent" : "") },
        el("div", { className: "lhead" },
          el("span", { className: "lname", textContent: l.name || `Learner ${l.n}` }),
          el("span", { className: "llevel", textContent: l.submittedAt ? "Sent ✓" : l.level }),
          el("span", { className: "lscore", textContent: `★ ${l.score} / ${l.total}` })),
        steps);
      if (l.answers) {
        const a = l.answers;
        const c = card[a.start];
        const rows = [
          ["Recommendation", c ? `${c.title} (${c.type}, ${c.product})` : a.start],
          ["Why", a.start_why],
          ["Main risk and how managed", `${a[`${a.start}_risk`] || ""}. ${a.start_fix}`],
          ["Owner's feedback", a.feedback],
          ["Change made", a.change],
        ];
        li.append(el("details", {}, el("summary", { textContent: "Read the recommendation" }),
          el("dl", {}, ...rows.flatMap(([k, val]) => [el("dt", { textContent: k }), el("dd", { textContent: val || "–" })]))));
      }
      list.append(li);
    });
  }

  async function poll() {
    try {
      render(await api("host"));
      $("offline").hidden = true;
    } catch (err) {
      if (err.code === 401) return lock();
      $("offline").hidden = false;
    }
    timer = setTimeout(poll, 3000);
  }

  function lock() {
    clearTimeout(timer);
    $("dash").hidden = true;
    $("gate").hidden = false;
    $("pinError").hidden = !pin;
  }

  $("pinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    pin = $("pin").value.trim();
    try { sessionStorage.setItem("hostPin", pin); } catch { /* ignore */ }
    $("gate").hidden = true;
    $("dash").hidden = false;
    clearTimeout(timer);
    poll();
  });

  // Two taps to reset, so a stray click does not wipe the class.
  $("reset").addEventListener("click", async () => {
    const b = $("reset");
    if (!b.dataset.armed) {
      b.dataset.armed = "1";
      b.textContent = "Tap again to clear every learner";
      setTimeout(() => { delete b.dataset.armed; b.textContent = "Reset for a new class"; }, 4000);
      return;
    }
    delete b.dataset.armed;
    b.textContent = "Reset for a new class";
    try { await api("host/reset", { method: "POST" }); } catch { /* the next poll shows the state */ }
  });

  if (pin) {
    $("gate").hidden = true;
    $("dash").hidden = false;
    poll();
  }
})();
