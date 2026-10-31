// Learner report form: built from the schema, saved on the device as you type, submitted to the trainer at the end.
(() => {
  const FORM = JSON.parse(document.getElementById("report").textContent);
  const $ = (id) => document.getElementById(id);
  const KEY = "bellarineReport";
  // /report/1, /report/2 and /report/3 show one session's sections; /report shows them all.
  const only = Number((location.pathname.match(/^\/report\/([123])\/?$/) || [])[1]) || 0;

  // Same anonymous id as the activities, so a resubmission replaces the learner's earlier report.
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

  let state = { fields: {}, checklist: FORM.checklist.map(() => false), name: "", submittedAt: null };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.fields) state = { ...state, ...saved, checklist: FORM.checklist.map((_, i) => saved.checklist?.[i] === true) };
  } catch { /* storage blocked or corrupt: start empty */ }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        $("saved").textContent = "Saved on this device";
      } catch {
        $("saved").textContent = "This browser cannot save your work. Use “Download a copy” before you close the page.";
      }
    }, 300);
  }

  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  // Sections, grouped under their session heading.
  const form = $("form");
  form.addEventListener("submit", (e) => e.preventDefault()); // Enter in a text box must not reload the page
  let session = 0;
  FORM.sections.forEach((s) => {
    if (s.session !== session) {
      session = s.session;
      form.append(el("h2", { id: `session${session}`, className: "session", hidden: Boolean(only) }, `Session ${session}`));
    }
    const sec = el("section", { className: "rsec", id: `s${s.n}`, hidden: only && only !== s.session });
    const progress = el("span", { className: "progress" });
    sec.append(el("h3", {}, `${s.n}. ${s.title} `, el("span", { className: "maps" }, s.maps), progress));
    if (s.intro) sec.append(el("p", { className: "small" }, s.intro));
    const ids = [];
    s.groups.forEach((g) => {
      const group = el("fieldset", { className: "group" });
      group.append(el("legend", {}, g.label));
      if (g.hint) group.append(el("p", { className: "small" }, g.hint));
      g.fields.forEach((f) => {
        ids.push(f.id);
        let input;
        if (f.type === "select") {
          input = el("select", { id: f.id }, el("option", { value: "" }, "Choose…"), ...f.options.map((o) => el("option", { value: o }, o)));
        } else if (f.type === "textarea") {
          input = el("textarea", { id: f.id, rows: 3, maxLength: 1500 });
        } else {
          input = el("input", { id: f.id, type: "text", maxLength: 300 });
        }
        if (f.placeholder) input.placeholder = f.placeholder;
        input.value = state.fields[f.id] || "";
        input.addEventListener("input", () => {
          state.fields[f.id] = input.value;
          updateProgress();
          save();
        });
        group.append(f.label ? el("label", { className: "field" }, el("span", {}, f.label), input) : (input.setAttribute("aria-label", g.label), input));
      });
      sec.append(group);
    });
    sec.dataset.ids = ids.join(" ");
    sec.progress = progress;
    form.append(sec);
  });

  // Section 3: copy the learner's answers from /session1/tech into any empty "type" box.
  function copyTechAnswers() {
    let answers = null;
    try { answers = JSON.parse(localStorage.getItem("pickAnswers:tech") || "null"); } catch { /* storage blocked */ }
    if (!answers) return;
    let changed = false;
    for (const [item, label] of Object.entries(answers)) {
      const input = $(`s3_${item}_class`);
      if (input && !state.fields[input.id] && [...input.options].some((o) => o.value === label)) {
        input.value = state.fields[input.id] = label;
        changed = true;
      }
    }
    if (changed) save();
  }
  copyTechAnswers();
  window.addEventListener("storage", (e) => {
    if (e.key === "pickAnswers:tech") {
      copyTechAnswers();
      updateProgress();
    }
  });

  function filled(fid) { return Boolean((state.fields[fid] || "").trim()); }

  function updateProgress() {
    const missing = [];
    form.querySelectorAll("section.rsec").forEach((sec) => {
      const ids = sec.dataset.ids.split(" ");
      const done = ids.filter(filled).length;
      sec.progress.textContent = ` ${done}/${ids.length}`;
      sec.progress.classList.toggle("done", done === ids.length);
      if (done < ids.length) missing.push(sec.id.slice(1));
    });
    $("missing").textContent = missing.length ? `Sections with empty boxes: ${missing.join(", ")}.` : "Every box has an entry.";
    const ready = state.name.trim() && state.checklist.every(Boolean);
    $("send").disabled = !ready;
  }

  // Checklist and name (section 10).
  $("submitTo").textContent = FORM.submitTo;
  FORM.checklist.forEach((c, i) => {
    const box = el("input", { type: "checkbox", checked: state.checklist[i] });
    box.addEventListener("change", () => {
      state.checklist[i] = box.checked;
      updateProgress();
      save();
    });
    $("checklist").append(el("label", { className: "check" }, box, el("span", {}, c)));
  });
  $("name").value = state.name;
  $("name").addEventListener("input", () => {
    state.name = $("name").value;
    updateProgress();
    save();
  });

  function showSubmitted() {
    if (state.submittedAt) {
      $("status").textContent = `Submitted ${new Date(state.submittedAt).toLocaleString("en-AU")}. You can change your report and submit again; the latest version replaces the earlier one.`;
    }
  }

  $("send").addEventListener("click", async () => {
    $("send").disabled = true;
    $("status").textContent = "Sending…";
    try {
      const res = await fetch("/api/report/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: state.name, fields: state.fields, checklist: state.checklist }),
      });
      if (!res.ok) throw new Error("http " + res.status);
      state.submittedAt = (await res.json()).submittedAt;
      save();
      showSubmitted();
    } catch {
      $("status").textContent = "Could not send. Check the Wi-Fi and try again, or use “Download a copy” and show it to your trainer.";
    }
    updateProgress();
  });

  $("download").addEventListener("click", () => {
    const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${FORM.title}</title><style>${window.REPORT_PRINT_CSS}</style></head><body>${window.renderReport(FORM, state)}</body></html>`;
    const a = el("a", { href: URL.createObjectURL(new Blob([html], { type: "text/html" })), download: `Bellarine report ${state.name.trim() || "draft"}.html` });
    document.body.append(a);
    a.click();
    a.remove();
  });

  // Session page: that session's brief on top and its sections below, with nothing from the other sessions.
  // The submission shows only in Session 3. /report (no session) is the whole report, for the trainer.
  if (only) {
    const first = FORM.sections.find((s) => s.session === only).n;
    const last = only === 3 ? 10 : FORM.sections.filter((s) => s.session === only).at(-1).n;
    document.title = `Session ${only} · Bellarine Pathology`;
    $("title").textContent = `Session ${only}`;
    $("lede").textContent = `Read the brief, then fill in sections ${first}–${last} of your report below. Short, clear answers are enough. Your work is saved on this device as you type.`;
    $("sessions").hidden = true;
    document.querySelectorAll("section.brief").forEach((b) => { b.hidden = !b.dataset.sessions.split(" ").includes(String(only)); });
    $("yourReport").hidden = false;
    $("yourReport").textContent = `Your report: sections ${first}–${last}`;
    $("submit").hidden = only !== 3;
  } else {
    document.querySelector('#sessions a[data-session="0"]').setAttribute("aria-current", "page");
  }

  updateProgress();
  showSubmitted();
})();
