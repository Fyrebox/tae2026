// LLM Explainer: walks through tokenize → embed → transformer → probabilities → pick,
// one stage per "Next step", looping until enough tokens have been written.

const $ = (s) => document.querySelector(s);
const STAGES = ["tokens", "embed", "transformer", "probs", "pick"];
const SPEEDS = {
  slow: { pause: 2600, anim: 1.6 },
  normal: { pause: 1300, anim: 1 },
  fast: { pause: 250, anim: 0.4 },
};
const TOP_K = 12; // choices shown and sampled from
const STRIP_CELLS = 40; // embedding numbers drawn per token
const EMBED_ROWS = 8; // tokens listed in the embedding panel
const MAP_POINTS = 40; // tokens on the meaning map
const TF_COLUMNS = 7; // tokens drawn in the transformer

const el = {
  prompt: $("#prompt"),
  btnStep: $("#btnStep"),
  btnPlay: $("#btnPlay"),
  btnReset: $("#btnReset"),
  temp: $("#temp"),
  tempOut: $("#tempOut"),
  maxTokens: $("#maxTokens"),
  speed: $("#speed"),
  error: $("#error"),
  output: $(".output"),
  outputText: $("#outputText"),
  status: $("#status"),
  narration: $("#narration"),
  tokens: $("#tokens"),
  tokenCount: $("#tokenCount"),
  embedRows: $("#embedRows"),
  embedMeta: $("#embedMeta"),
  map: $("#meaningMap"),
  tf: $("#transformer"),
  probs: $("#probs"),
  probMeta: $("#probMeta"),
  modelInfo: $("#modelInfo"),
};

const state = {
  prompt: "",
  text: "",
  round: 0,
  stage: -1, // index of the last completed stage
  tokens: [],
  prevTokens: [],
  vectors: {},
  fullDims: 3072,
  candidates: null,
  pickedIndex: null,
  done: false,
  embedP: null,
  nextP: null,
  playing: false,
  busy: false,
  speed: "normal",
  mapPrev: new Map(),
  models: {},
  runId: 0,
};

// ---------- helpers ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const anim = () => SPEEDS[state.speed].anim;
const temperature = () => Number(el.temp.value);
const maxTokens = () => Math.min(100, Math.max(1, Number(el.maxTokens.value) || 15));

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Token text with invisible characters made visible.
function showTok(s) {
  return esc(s)
    .replace(/ /g, '<span class="sp">·</span>')
    .replace(/\n/g, '<span class="sp">↵</span>')
    .replace(/\t/g, '<span class="sp">⇥</span>');
}

// Token text for sentences in the narration.
function sayTok(s) {
  const t = s.trim();
  if (!t) return s.includes("\n") ? "a new line" : "a space";
  return `<q>${esc(t)}</q>`;
}

// A candidate's label: special "end" tokens get a readable name.
const candHTML = (c) => (c.end ? '<span class="end">⏹ end of text</span>' : showTok(c.token));
const sayCand = (c) => (c.end ? "<q>end of text</q>" : sayTok(c.token));

const pct = (p) => (p >= 0.1 ? Math.round(p * 100) : p >= 0.001 ? (p * 100).toFixed(1) : "<0.1") + "%";
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const isGen = (t) => t.start >= state.prompt.length;

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function narrate(html) {
  el.narration.innerHTML = html;
}

function showError(msg) {
  el.error.textContent = msg;
  el.error.hidden = false;
}

function setActive(stage) {
  const idx = STAGES.indexOf(stage);
  document.querySelectorAll(".pipeline li").forEach((li, i) => {
    li.classList.toggle("active", i === idx);
    li.classList.toggle("done", idx >= 0 && i < idx);
  });
  const panel = stage === "pick" ? "probs" : stage;
  document.querySelectorAll(".panel").forEach((p) => {
    const on = p.dataset.panel === panel;
    p.classList.toggle("active", on);
    if (on) p.classList.add("seen");
  });
  el.output.classList.toggle("active", stage === "pick");
  const active = document.querySelector(`.panel[data-panel="${panel}"]`);
  if (active) {
    document.documentElement.style.setProperty("--dock-h", `${$(".dock").offsetHeight}px`);
    active.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function updateStatus() {
  if (state.done) el.status.textContent = `Finished · the AI wrote ${state.round} token${state.round === 1 ? "" : "s"}`;
  else if (state.stage < 0 && state.round === 0) el.status.textContent = "Press “Next step” to begin";
  else el.status.textContent = `Writing token ${state.round + 1} of ${maxTokens()}`;
}

function updateButtons() {
  const fresh = state.stage < 0 && state.round === 0;
  el.btnStep.textContent = fresh ? "Start ▸" : "Next step ▸";
  el.btnStep.disabled = state.busy || state.playing || state.done;
  el.btnPlay.textContent = state.playing ? "⏸ Pause" : "▶ Play";
  el.btnPlay.disabled = state.done;
}

function updateModelInfo() {
  const parts = [];
  if (state.models.chat) parts.push(`Next-token model: ${state.models.chat}`);
  if (state.models.embed) parts.push(`Embeddings: ${state.models.embed}`);
  el.modelInfo.textContent = parts.join(" · ");
}

// ---------- rendering ----------

function renderOutput() {
  const gen = state.text.slice(state.prompt.length);
  el.outputText.innerHTML = `${esc(state.prompt)}<span class="gen">${esc(gen)}</span><span class="caret"></span>`;
}

function renderTokens() {
  const { tokens, prevTokens } = state;
  el.tokenCount.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
  let fresh = 0;
  el.tokens.innerHTML = "";
  tokens.forEach((t, i) => {
    const chip = document.createElement("span");
    chip.className = `tok c${i % 6}${isGen(t) ? " gen" : ""}`;
    chip.innerHTML = `<span>${showTok(t.text)}</span><span class="id">${t.id}</span>`;
    chip.title = `Token ID ${t.id}`;
    if (prevTokens[i]?.id !== t.id) {
      chip.classList.add("pop");
      chip.style.animationDelay = `${Math.min(fresh++ * 70, 900) * anim()}ms`;
    }
    el.tokens.append(chip);
  });
  el.tokens.scrollTop = el.tokens.scrollHeight;
}

function stripHTML(vec) {
  let cells = "";
  for (let k = 0; k < STRIP_CELLS; k++) {
    const v = vec[k];
    const a = Math.min(1, Math.abs(v) / 0.16).toFixed(2);
    cells += `<i style="background: rgba(var(${v < 0 ? "--neg" : "--pos"}), ${a})" title="${v.toFixed(3)}"></i>`;
  }
  return `<div class="strip">${cells}</div>`;
}

function renderEmbedRows() {
  const { tokens, prevTokens } = state;
  const start = Math.max(0, tokens.length - EMBED_ROWS);
  el.embedMeta.textContent = `${state.fullDims.toLocaleString()} numbers per token · first ${STRIP_CELLS} shown`;
  el.embedRows.innerHTML = "";
  if (start > 0) {
    el.embedRows.insertAdjacentHTML("beforeend", `<div class="empty">…${start} earlier token${start === 1 ? "" : "s"}</div>`);
  }
  let fresh = 0;
  tokens.slice(start).forEach((t, j) => {
    const i = start + j;
    const vec = state.vectors[t.text];
    if (!vec) return;
    const row = document.createElement("div");
    row.className = "erow";
    row.innerHTML = `<span class="tok c${i % 6}${isGen(t) ? " gen" : ""}"><span>${showTok(t.text)}</span></span>${stripHTML(vec)}`;
    if (prevTokens[i]?.id !== t.id) {
      row.classList.add("pop");
      row.style.animationDelay = `${fresh++ * 90 * anim()}ms`;
    }
    el.embedRows.append(row);
  });
}

// Principal component analysis via the Gram matrix: fine for a few dozen points.
function pca2(vecs) {
  const n = vecs.length;
  if (n === 1) return [[0, 0]];
  const d = vecs[0].length;
  const mean = new Array(d).fill(0);
  for (const v of vecs) for (let k = 0; k < d; k++) mean[k] += v[k] / n;
  const X = vecs.map((v) => v.map((x, k) => x - mean[k]));
  const G = X.map((a) => X.map((b) => dot(a, b)));
  const comps = [];
  for (let c = 0; c < 2; c++) {
    let u = Array.from({ length: n }, (_, i) => Math.sin(i * 1.7 + c + 1));
    let lambda = 0;
    for (let it = 0; it < 150; it++) {
      const w = G.map((row) => dot(row, u));
      lambda = Math.hypot(...w);
      if (lambda < 1e-9) break;
      u = w.map((x) => x / lambda);
    }
    comps.push(u.map((x) => x * Math.sqrt(lambda)));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) G[i][j] -= lambda * u[i] * u[j];
  }
  return vecs.map((_, i) => [comps[0][i], comps[1][i]]);
}

function renderMap() {
  const seen = new Map(); // text -> isGen, keeping the latest occurrence
  for (const t of state.tokens) {
    if (!state.vectors[t.text]) continue;
    seen.delete(t.text);
    seen.set(t.text, isGen(t));
  }
  const words = [...seen.keys()].slice(-MAP_POINTS);
  const raw = pca2(words.map((w) => state.vectors[w]));

  // Keep the map from flipping between rounds: PCA axes have no fixed sign.
  for (let a = 0; a < 2; a++) {
    let s = 0;
    words.forEach((w, i) => {
      const p = state.mapPrev.get(w);
      if (p) s += p[a] * raw[i][a];
    });
    if (s < 0) raw.forEach((r) => (r[a] = -r[a]));
  }
  state.mapPrev = new Map(words.map((w, i) => [w, raw[i]]));

  const W = 320, H = 240, padX = 30, padY = 22;
  const xs = raw.map((r) => r[0]), ys = raw.map((r) => r[1]);
  const fit = (v, lo, hi, a, b) => (hi - lo < 1e-9 ? (a + b) / 2 : a + ((v - lo) / (hi - lo)) * (b - a));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  const pos = words.map((w, i) => [fit(raw[i][0], x0, x1, padX, W - padX - 40), fit(raw[i][1], y0, y1, padY, H - padY)]);
  // Nudge points apart so their labels don't sit on top of each other.
  for (let pass = 0; pass < 20; pass++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1];
        if (Math.abs(dx) < 42 && Math.abs(dy) < 13) {
          const push = (13 - Math.abs(dy)) / 2 + 0.5;
          const dir = dy >= 0 ? 1 : -1;
          pos[i][1] = Math.max(8, Math.min(H - 8, pos[i][1] - dir * push));
          pos[j][1] = Math.max(8, Math.min(H - 8, pos[j][1] + dir * push));
          moved = true;
        }
      }
    if (!moved) break;
  }

  const existing = new Map([...el.map.querySelectorAll(".pt")].map((g) => [g.dataset.w, g]));
  const keep = new Set();
  words.forEach((w, i) => {
    const [x, y] = pos[i];
    let g = existing.get(w);
    if (!g) {
      g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.dataset.w = w;
      g.innerHTML = `<circle r="5"></circle><text x="8" y="4"></text>`;
      g.querySelector("text").textContent = w.trim() || (w.includes("\n") ? "↵" : "·");
      g.style.transition = "none";
      g.style.transform = `translate(${x}px, ${y}px)`;
      g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 * anim(), fill: "backwards", delay: i * 30 * anim() });
      el.map.append(g);
    }
    g.setAttribute("class", `pt${seen.get(w) ? " gen" : ""}`);
    requestAnimationFrame(() => {
      g.style.transition = "";
      g.style.transform = `translate(${x}px, ${y}px)`;
    });
    keep.add(w);
  });
  for (const [w, g] of existing) if (!keep.has(w)) g.remove();
}

// Illustrative attention: the last token attends to earlier ones by embedding
// similarity, with early layers favouring nearby tokens. Real attention weights
// are not available from the API.
function attentionWeights(cols) {
  const last = state.vectors[cols[cols.length - 1].text];
  const layers = [
    { sharp: 5, recency: 0.9 },
    { sharp: 8, recency: 0.35 },
    { sharp: 12, recency: 0 },
  ];
  return layers.map(({ sharp, recency }) => {
    const scores = cols.slice(0, -1).map((t, j) => sharp * dot(last, state.vectors[t.text]) - recency * (cols.length - 1 - j));
    const m = Math.max(...scores);
    const e = scores.map((s) => Math.exp(s - m));
    const sum = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / sum);
  });
}

function svg(tag, attrs, text) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

const TF = { input: 298, rows: [228, 162, 72], gap: 120, left: 44, right: 470 };

function drawTransformerFrame() {
  el.tf.innerHTML = "";
  const labels = [["Layer 1", "attention + network"], ["Layer 2", "attention + network"], ["Last layer", "attention + network"]];
  TF.rows.forEach((y, i) => {
    el.tf.append(svg("rect", { class: "band", x: 8, y: y - 24, width: 624, height: 48, rx: 10 }));
    el.tf.append(svg("text", { class: "band-label", x: 496, y: y - 3 }, labels[i][0]));
    const sub = svg("text", { class: "band-label", x: 496, y: y + 13, style: "font-weight:400" }, labels[i][1]);
    el.tf.append(sub);
  });
  el.tf.append(svg("text", { class: "band-label", x: 496, y: TF.gap + 4, style: "font-weight:400" }, "… dozens more layers"));
}

async function renderTransformer() {
  drawTransformerFrame();
  const cols = state.tokens.slice(-TF_COLUMNS);
  const n = cols.length;
  const X = (j) => (n === 1 ? (TF.left + TF.right) / 2 : TF.left + (j * (TF.right - TF.left)) / (n - 1));
  const a = anim();
  const layerTime = 0.75 * a;

  // Input token boxes.
  cols.forEach((t, j) => {
    const label = t.text.trim() || (t.text.includes("\n") ? "↵" : "·");
    el.tf.append(svg("rect", { class: `inbox${isGen(t) ? " gen" : ""}`, x: X(j) - 30, y: TF.input - 14, width: 60, height: 26, rx: 6 }));
    el.tf.append(svg("text", { class: "intext", x: X(j), y: TF.input + 4 }, label.length > 7 ? label.slice(0, 6) + "…" : label));
  });
  if (state.tokens.length > n) {
    el.tf.append(svg("text", { class: "gap", x: 16, y: TF.input + 5 }, "…"));
  }

  const weights = n > 1 ? attentionWeights(cols) : [];
  const nodes = [];
  let prevY = TF.input - 14;

  TF.rows.forEach((y, layer) => {
    const delay = layer * layerTime;
    const g = svg("g", {});
    // Each token's own path upwards.
    cols.forEach((_, j) => {
      const line = svg("path", { class: "self", d: `M${X(j)} ${prevY} L${X(j)} ${y}`, pathLength: 1 });
      if (layer === 2) {
        // Dashed: stands in for the many layers we don't draw.
        line.setAttribute("stroke-dasharray", "0.04 0.05");
        line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: layerTime * 1000, delay: delay * 1000, fill: "backwards" });
      } else {
        line.classList.add("draw");
        line.style.setProperty("--dur", `${layerTime}s`);
        line.style.animationDelay = `${delay}s`;
      }
      g.append(line);
    });
    // Attention from earlier tokens into the last token.
    if (weights.length) {
      const w = weights[layer];
      const wMax = Math.max(...w);
      w.forEach((wj, j) => {
        const rel = wj / wMax;
        const xl = X(n - 1);
        const path = svg("path", {
          class: "attn draw",
          d: `M${X(j)} ${prevY} C${X(j)} ${prevY - 40}, ${xl} ${y + 40}, ${xl} ${y}`,
          pathLength: 1,
          "stroke-width": (1.2 + 9 * rel).toFixed(1),
          opacity: (0.15 + 0.85 * rel).toFixed(2),
        });
        path.style.setProperty("--dur", `${layerTime}s`);
        path.style.animationDelay = `${delay}s`;
        g.append(path);
      });
    }
    el.tf.append(g);
    cols.forEach((_, j) => {
      const c = svg("circle", { class: "node", cx: X(j), cy: y, r: j === n - 1 ? 10 : 7 });
      el.tf.append(c);
      nodes.push({ c, at: delay + layerTime * 0.9 });
    });
    if (layer === 1) {
      cols.forEach((_, j) => el.tf.append(svg("text", { class: "gap", x: X(j), y: TF.gap + 6 }, "⋮")));
    }
    prevY = y;
  });

  // Last node feeds the prediction.
  const xl = X(n - 1);
  const outAt = TF.rows.length * layerTime;
  const up = svg("path", { class: "attn draw", d: `M${xl} ${TF.rows[2] - 10} L${xl} 36`, pathLength: 1, "stroke-width": 3 });
  up.style.setProperty("--dur", `${0.4 * a}s`);
  up.style.animationDelay = `${outAt}s`;
  el.tf.append(up);
  const box = svg("g", {});
  const bx = Math.min(xl, 640 - 90);
  box.append(svg("rect", { class: "outbox", x: bx - 80, y: 6, width: 160, height: 30, rx: 8 }));
  box.append(svg("text", { class: "outtext", x: bx, y: 26 }, "What comes next?"));
  box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 * a, delay: (outAt + 0.3 * a) * 1000, fill: "backwards" });
  el.tf.append(box);

  for (const { c, at } of nodes) setTimeout(() => c.classList.add("lit"), at * 1000);
  await sleep((outAt + 0.7 * a) * 1000);

  if (!weights.length) return null;
  const final = weights[2];
  const best = final.indexOf(Math.max(...final));
  return { last: cols[n - 1], focus: cols[best], weight: final[best] };
}

function adjustedProbs(cands, T) {
  if (T < 0.05) return cands.map((_, i) => (i === 0 ? 1 : 0));
  const w = cands.map((c) => Math.pow(c.prob, 1 / T));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}

function renderProbs(animateIn) {
  const cands = state.candidates;
  if (!cands) {
    el.probs.innerHTML = `<div class="empty">Waiting for the model…</div>`;
    el.probMeta.textContent = "";
    return;
  }
  const probs = adjustedProbs(cands, temperature());
  el.probMeta.textContent = `top ${cands.length} of ~200,000 tokens · creativity ${temperature().toFixed(1)}`;
  const max = Math.max(...probs);
  if (animateIn || el.probs.children.length !== cands.length) {
    el.probs.innerHTML = cands
      .map((c) => `<div class="prow"><span class="ptok">${candHTML(c)}</span><span class="bar"><i></i></span><span class="pv"></span></div>`)
      .join("");
  }
  const rows = [...el.probs.children];
  rows.forEach((row, i) => {
    row.querySelector(".pv").textContent = pct(probs[i]);
    row.title = `Model's raw probability: ${pct(cands[i].prob)}`;
    row.classList.toggle("picked", i === state.pickedIndex);
  });
  const setWidths = () => rows.forEach((row, i) => (row.querySelector(".bar i").style.width = `${(probs[i] / max) * 100}%`));
  if (animateIn) requestAnimationFrame(() => requestAnimationFrame(setWidths));
  else setWidths();
  return probs;
}

async function spinWheel(target, rows) {
  const m = rows.length;
  const hops = m > 1 ? 2 * m + target : 0;
  for (let k = 0; k <= hops; k++) {
    const i = (k + (m > 1 ? 0 : target)) % m;
    rows.forEach((r, j) => r.classList.toggle("spin", j === i));
    const t = k / Math.max(1, hops);
    await sleep((35 + 260 * t * t) * anim());
  }
  rows.forEach((r) => r.classList.remove("spin"));
}

async function flyToken(fromEl, token) {
  const caret = el.outputText.querySelector(".caret");
  if (!caret) return;
  const a = fromEl.getBoundingClientRect();
  const b = caret.getBoundingClientRect();
  const flyer = document.createElement("div");
  flyer.className = "flyer";
  flyer.innerHTML = showTok(token);
  flyer.style.left = `${a.left}px`;
  flyer.style.top = `${a.top}px`;
  document.body.append(flyer);
  const dx = b.left - a.left, dy = b.top - a.top;
  await flyer.animate(
    [{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.25)`, offset: 0.45 }, { transform: `translate(${dx}px, ${dy}px) scale(1)` }],
    { duration: 900 * anim(), easing: "cubic-bezier(.4,0,.2,1)" }
  ).finished;
  flyer.remove();
}

// ---------- stages ----------

const stageFns = {
  async tokens() {
    setActive("tokens");
    state.candidates = null;
    state.pickedIndex = null;
    renderProbs();
    const { tokens } = await api("/api/llm/tokenize", { text: state.text });
    state.prevTokens = state.tokens;
    state.tokens = tokens;
    // Start the slow calls now so they are ready by the time we need them.
    state.embedP = api("/api/llm/embed", { tokens: [...new Set(tokens.map((t) => t.text))] });
    state.nextP = api("/api/llm/next", { text: state.text });
    state.embedP.catch(() => {});
    state.nextP.catch(() => {});
    renderTokens();
    if (state.round === 0) {
      const sample = tokens.find((t) => t.text.trim().length > 2) || tokens[0];
      narrate(
        `The AI can’t read words, so the text is chopped into <b>${tokens.length} token${tokens.length === 1 ? "" : "s"}</b>. ` +
          `Each token has an ID number: ${sayTok(sample.text)} is token <b>#${sample.id}</b>.`
      );
    } else {
      narrate(`The new token is now part of the text, so the whole text is split into tokens again: <b>${tokens.length}</b> this time. The AI always re-reads everything.`);
    }
  },

  async embed() {
    setActive("embed");
    const { vectors, fullDims, model } = await state.embedP;
    Object.assign(state.vectors, vectors);
    state.fullDims = fullDims;
    state.models.embed = model;
    updateModelInfo();
    renderEmbedRows();
    renderMap();

    // Point out the two most similar distinct words, if there are any.
    const words = [...new Set(state.tokens.map((t) => t.text))].filter((w) => /[a-z]{2,}/i.test(w));
    let best = null;
    for (let i = 0; i < words.length; i++)
      for (let j = i + 1; j < words.length; j++) {
        if (words[i].trim().toLowerCase() === words[j].trim().toLowerCase()) continue;
        const s = dot(state.vectors[words[i]], state.vectors[words[j]]);
        if (!best || s > best.s) best = { s, a: words[i], b: words[j] };
      }
    narrate(
      `Each token becomes a list of <b>${fullDims.toLocaleString()} numbers</b>, its “embedding”. The numbers capture meaning: ` +
        (best ? `${sayTok(best.a)} and ${sayTok(best.b)} have the most similar numbers here, so they sit close on the map.` : "similar tokens get similar numbers.")
    );
  },

  async transformer() {
    setActive("transformer");
    await state.embedP;
    const info = await renderTransformer();
    narrate(
      info
        ? `The numbers flow up through the layers. In each one, the last token ${sayTok(info.last.text)} looks back at the earlier tokens: that’s <b>attention</b>. ` +
            `Here it pays most attention to ${sayTok(info.focus.text)}. A <b>neural network</b> then updates its meaning, layer after layer.`
        : `The numbers flow up through the layers. With only one token there’s nothing to pay attention to yet, so the <b>neural network</b> works on that token alone.`
    );
  },

  async probs() {
    setActive("probs");
    const res = await state.nextP;
    state.models.chat = res.model;
    updateModelInfo();
    if (res.done || !res.candidates.length) {
      state.done = true;
      narrate("The model’s top prediction is “the end”: it thinks the text is complete, so it stops writing.");
      return;
    }
    state.candidates = res.candidates.slice(0, TOP_K);
    const probs = renderProbs(true);
    const [a, b] = state.candidates;
    narrate(
      `The model gives every one of its ~200,000 tokens a chance of coming next. Top choice: ${sayCand(a)} at <b>${pct(probs[0])}</b>` +
        (b ? `, then ${sayCand(b)} at <b>${pct(probs[1])}</b>.` : ".")
    );
    await sleep(700 * anim());
  },

  async pick() {
    setActive("pick");
    const T = temperature();
    const probs = adjustedProbs(state.candidates, T);
    let idx = 0;
    if (T >= 0.05) {
      let r = Math.random();
      idx = probs.findIndex((p) => (r -= p) <= 0);
      if (idx < 0) idx = probs.length - 1;
    }
    const rows = [...el.probs.children];
    if (T >= 0.05) {
      narrate("Now it picks one, like spinning a wheel where likelier tokens get bigger slices…");
      await spinWheel(idx, rows);
    }
    state.pickedIndex = idx;
    renderProbs();
    const chosen = state.candidates[idx];
    if (chosen.end) {
      state.done = true;
      narrate(`It picked ${sayCand(chosen)}: the AI thinks the text is finished, so it stops writing.`);
      return;
    }
    await flyToken(rows[idx].querySelector(".ptok"), chosen.token);

    state.text += chosen.token;
    state.round += 1;
    renderOutput();
    let msg =
      T < 0.05
        ? `Creativity is 0, so it always takes the top choice: ${sayTok(chosen.token)}.`
        : idx === 0
          ? `The wheel landed on ${sayTok(chosen.token)}, the most likely choice (${pct(probs[idx])}).`
          : `The wheel landed on ${sayTok(chosen.token)}, which had only a ${pct(probs[idx])} chance. Not the top choice: that’s creativity at work!`;
    if (state.round >= maxTokens()) {
      state.done = true;
      msg += ` That’s ${state.round} tokens written, so we stop here.`;
    } else {
      msg += " It’s added to the text, and everything starts again from step 1.";
    }
    narrate(msg);
  },
};

// ---------- control flow ----------

async function step() {
  if (state.busy || state.done) return;
  if (!state.text.trim()) {
    showError("Please type some text first.");
    return;
  }
  el.error.hidden = true;
  state.busy = true;
  updateButtons();
  const next = (state.stage + 1) % STAGES.length;
  const run = state.runId;
  try {
    await stageFns[STAGES[next]]();
    if (run === state.runId) state.stage = next;
  } catch (err) {
    if (run === state.runId) showError(err.message);
    state.playing = false;
  } finally {
    state.busy = false;
    // Reset was pressed mid-stage: wipe whatever the stale stage drew.
    if (run !== state.runId) reset();
    updateStatus();
    updateButtons();
  }
}

async function play() {
  if (state.playing || state.done) return;
  state.playing = true;
  updateButtons();
  while (state.playing && !state.done) {
    while (state.busy) await sleep(50);
    await step();
    if (!state.playing || state.done) break;
    await sleep(SPEEDS[state.speed].pause);
  }
  state.playing = false;
  updateButtons();
}

function reset() {
  Object.assign(state, {
    prompt: el.prompt.value,
    text: el.prompt.value,
    round: 0,
    stage: -1,
    tokens: [],
    prevTokens: [],
    candidates: null,
    pickedIndex: null,
    done: false,
    embedP: null,
    nextP: null,
    playing: false,
    mapPrev: new Map(),
  });
  if (state.busy) state.runId += 1;
  el.error.hidden = true;
  setActive(null);
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("seen"));
  renderOutput();
  el.tokens.innerHTML = `<div class="empty">Tokens will appear here.</div>`;
  el.tokenCount.textContent = "";
  el.embedRows.innerHTML = `<div class="empty">Each token’s numbers will appear here.</div>`;
  el.embedMeta.textContent = "";
  el.map.innerHTML = "";
  drawTransformerFrame();
  renderProbs();
  narrate("An AI language model writes by predicting the next small piece of text, again and again. Let’s watch it happen.");
  updateStatus();
  updateButtons();
}

function tempLabel(T) {
  if (T < 0.05) return "0 · always top pick";
  if (T < 0.7) return `${T.toFixed(1)} · careful`;
  if (T <= 1.3) return `${T.toFixed(1)} · normal`;
  return `${T.toFixed(1)} · wild`;
}

// ---------- wiring ----------

el.btnStep.addEventListener("click", step);
el.btnPlay.addEventListener("click", () => (state.playing ? ((state.playing = false), updateButtons()) : play()));
el.btnReset.addEventListener("click", reset);
el.prompt.addEventListener("input", reset);
document.querySelectorAll(".examples .chip-btn").forEach((b) =>
  b.addEventListener("click", () => {
    el.prompt.value = b.textContent;
    reset();
  })
);
el.temp.addEventListener("input", () => {
  el.tempOut.textContent = tempLabel(temperature());
  if (state.candidates) renderProbs();
});
el.maxTokens.addEventListener("change", updateStatus);
el.speed.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  state.speed = b.dataset.speed;
  el.speed.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("textarea, input") || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "ArrowRight") step();
  else if (e.key === "p" || e.key === "P") el.btnPlay.click();
  else if (e.key === "r" || e.key === "R") reset();
});

el.tempOut.textContent = tempLabel(temperature());
reset();
