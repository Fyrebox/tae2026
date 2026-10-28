// Host view for submitted reports: list, open, print. Refreshes the list every 5 seconds.
(() => {
  const FORM = JSON.parse(document.getElementById("report").textContent);
  const $ = (id) => document.getElementById(id);
  let pin = "";
  try { pin = sessionStorage.getItem("hostPin") || ""; } catch { /* storage blocked */ }
  let timer = null;

  $("formUrl").textContent = location.host + "/report";

  async function api(path, options = {}) {
    const res = await fetch("/api/report/" + path, { ...options, headers: { "x-host-pin": pin } });
    if (res.status === 401) throw Object.assign(new Error("pin"), { code: 401 });
    if (!res.ok) throw new Error("http " + res.status);
    return res.json();
  }

  function render({ reports }) {
    $("empty").hidden = reports.length > 0;
    const list = $("reports");
    list.textContent = "";
    reports.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = `${r.name} · ${new Date(r.submittedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} · ${r.filled}/${r.total} boxes` + (r.count > 1 ? ` · version ${r.count}` : "");
      b.addEventListener("click", () => open(r.id));
      const li = document.createElement("li");
      li.append(b);
      list.append(li);
    });
  }

  async function open(id) {
    try {
      $("reportBody").innerHTML = window.renderReport(FORM, await api("host/report/" + encodeURIComponent(id)));
      $("viewer").hidden = false;
      $("viewer").scrollIntoView();
    } catch (err) {
      if (err.code === 401) lock();
    }
  }

  async function poll() {
    try {
      render(await api("host/list"));
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
    timer = setInterval(poll, 5000);
  }
  function lock() {
    clearInterval(timer);
    try { sessionStorage.removeItem("hostPin"); } catch { /* storage blocked */ }
    $("dash").hidden = true;
    $("viewer").hidden = true;
    $("gate").hidden = false;
  }

  $("pinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    pin = $("pin").value.trim();
    try {
      await api("host/list");
      try { sessionStorage.setItem("hostPin", pin); } catch { /* storage blocked */ }
      $("pinError").hidden = true;
      unlock();
    } catch {
      $("pinError").hidden = false;
    }
  });

  $("refresh").addEventListener("click", poll);
  $("print").addEventListener("click", () => window.print());
  $("close").addEventListener("click", () => { $("viewer").hidden = true; });
  $("reset").addEventListener("click", async () => {
    if (!confirm("Delete every submitted report and start a new class?")) return;
    try { await api("host/reset", { method: "POST" }); } catch { /* shown by the next poll */ }
    $("viewer").hidden = true;
    poll();
  });

  if (pin) api("host/list").then(unlock).catch(() => {});
})();
