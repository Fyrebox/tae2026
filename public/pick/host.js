// Host view for a tap-to-choose activity: live counts, with per-item results hidden until the host reveals them.
(() => {
  const A = JSON.parse(document.getElementById("activity").textContent);
  const $ = (id) => document.getElementById(id);
  let pin = "";
  try { pin = sessionStorage.getItem("hostPin") || ""; } catch { /* storage blocked */ }
  let revealed = false;
  let timer = null;

  $("joinUrl").textContent = location.host + (A.inPage ? A.inPage.split("#")[0] : A.path);
  const colour = Object.fromEntries(A.options.map((o, i) => [o.id, "o" + (i + 1)]));
  const label = Object.fromEntries(A.options.map((o) => [o.id, o.label]));
  A.options.forEach((o) => {
    const li = document.createElement("li");
    const sw = document.createElement("i");
    sw.className = "part " + colour[o.id];
    li.append(sw, o.label);
    $("key").append(li);
  });

  async function api(path, options = {}) {
    const res = await fetch(`/api/pick/${A.key}/${path}`, { ...options, headers: { "x-host-pin": pin } });
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
    $("key").hidden = !revealed;
    if (!revealed) return;

    // Flag the item the class got wrong most often, once at least 3 people have answered it.
    const stats = s.items.map((it) => {
      const n = Object.values(it.counts).reduce((a, b) => a + b, 0);
      return { ...it, n, correctPct: pct(it.counts[it.correct], n) };
    });
    const pool = stats.filter((it) => it.n >= 3);
    const hardest = pool.length ? pool.reduce((a, b) => (b.correctPct < a.correctPct ? b : a)) : null;

    const list = $("results");
    list.textContent = "";
    stats.forEach((it) => {
      const li = document.createElement("li");
      const head = document.createElement("div");
      head.className = "rowhead";
      const name = document.createElement("span");
      name.className = "rname";
      name.textContent = it.text;
      const meta = document.createElement("span");
      meta.className = "rmeta";
      meta.textContent = `${it.correctPct}% correct (${it.n} answered)` + (hardest && hardest.id === it.id && hardest.correctPct < 100 ? " · most debated" : "");
      head.append(name, meta);

      const answer = document.createElement("p");
      answer.className = "small";
      answer.innerHTML = 'Answer: <span class="rcorrect"></span>';
      answer.lastChild.textContent = label[it.correct];

      const bar = document.createElement("div");
      bar.className = "split";
      s.options.forEach((o) => {
        const count = it.counts[o.id];
        const part = document.createElement("div");
        part.className = "part " + colour[o.id] + (it.correct === o.id ? " is-correct" : "");
        part.style.flexGrow = count;
        if (!count) part.style.padding = "0";
        part.textContent = count ? `${pct(count, it.n)}%${it.correct === o.id ? " ✓" : ""}` : "";
        part.title = o.label;
        bar.append(part);
      });
      if (!it.n) bar.style.opacity = ".4";
      li.append(head, bar, answer);
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
