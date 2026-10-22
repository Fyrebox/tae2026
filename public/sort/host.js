// Host view: live counts, with per-card results hidden until the host reveals them.
(() => {
  const $ = (id) => document.getElementById(id);
  let pin = "";
  try { pin = sessionStorage.getItem("hostPin") || ""; } catch { /* storage blocked */ }
  let revealed = false;
  let timer = null;

  $("joinUrl").textContent = location.host + "/session1";

  async function api(path, options = {}) {
    const res = await fetch("/api/sort/" + path, { ...options, headers: { "x-host-pin": pin } });
    if (res.status === 401) throw Object.assign(new Error("pin"), { code: 401 });
    if (!res.ok) throw new Error("http " + res.status);
    return res.json();
  }

  function pct(n, total) { return total ? Math.round((n / total) * 100) : 0; }

  function render(s) {
    $("joined").textContent = s.joined;
    $("finished").textContent = s.finished;
    $("avg").textContent = s.avgScore === null ? "–" : `${s.avgScore.toFixed(1)} / ${s.total}`;
    $("finishBar").style.width = `${pct(s.finished, s.joined)}%`;
    $("hidden").hidden = revealed;
    $("results").hidden = !revealed;
    if (!revealed) return;

    // Flag the card the class got wrong most often, once at least 3 people have answered it.
    const stats = s.cards.map((c) => {
      const n = c.rule + c.ai;
      return { ...c, n, correctPct: pct(c[c.correct], n) };
    });
    const pool = stats.filter((c) => c.n >= 3);
    const hardest = pool.length ? pool.reduce((a, b) => (b.correctPct < a.correctPct ? b : a)) : null;

    const list = $("results");
    list.textContent = "";
    stats.forEach((c) => {
      const li = document.createElement("li");
      const head = document.createElement("div");
      head.className = "rowhead";
      const name = document.createElement("span");
      name.className = "rname";
      name.textContent = c.text;
      const meta = document.createElement("span");
      meta.className = "rmeta";
      meta.textContent = `${c.correctPct}% correct (${c.n} answered)` + (hardest && hardest.id === c.id && hardest.correctPct < 100 ? " · most debated" : "");
      head.append(name, meta);

      const bar = document.createElement("div");
      bar.className = "split";
      ["rule", "ai"].forEach((side) => {
        const part = document.createElement("div");
        part.className = "part " + side + (c.correct === side ? " is-correct" : "");
        part.style.flexGrow = Math.max(c[side], c.n ? 0 : 1);
        if (!c[side]) part.style.padding = "0";
        const p = pct(c[side], c.n);
        part.textContent = c[side] ? `${side === "rule" ? "Rule" : "AI"} ${p}%${c.correct === side ? " ✓" : ""}` : "";
        bar.append(part);
      });
      li.append(head, bar);
      list.append(li);
    });
  }

  async function poll() {
    try {
      render(await api("host/stats"));
      $("offline").hidden = true;
    } catch (err) {
      if (err.code === 401) return lock();
      $("offline").hidden = false;
    }
  }

  function unlock() {
    $("gate").hidden = true;
    $("dash").hidden = false;
    poll();
    timer = setInterval(poll, 2000);
  }
  function lock() {
    clearInterval(timer);
    try { sessionStorage.removeItem("hostPin"); } catch { /* storage blocked */ }
    $("dash").hidden = true;
    $("gate").hidden = false;
  }

  $("pinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    pin = $("pin").value.trim();
    try {
      await api("host/stats");
      try { sessionStorage.setItem("hostPin", pin); } catch { /* storage blocked */ }
      $("pinError").hidden = true;
      unlock();
    } catch {
      $("pinError").hidden = false;
    }
  });

  $("toggle").addEventListener("click", () => {
    revealed = !revealed;
    $("toggle").textContent = revealed ? "Hide results" : "Show results";
    poll();
  });
  $("reset").addEventListener("click", async () => {
    if (!confirm("Clear all answers and start a new class?")) return;
    try { await api("host/reset", { method: "POST" }); } catch { /* shown by the next poll */ }
    revealed = false;
    $("toggle").textContent = "Show results";
    poll();
  });

  if (pin) api("host/stats").then(unlock).catch(() => {});
})();
