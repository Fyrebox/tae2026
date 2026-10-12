// Weekly bar chart in SVG. One measure at a time, any set of weeks, adjustable scale start.
// Figures come straight from productionData; scrap can be shown as an approximate count.
window.RTN = window.RTN || {};
RTN.Chart = function (host, options) {
  const NS = "http://www.w3.org/2000/svg";
  const rows = productionData.timeline;
  const cols = productionData.columns;
  const W = 360, H = 250, M = { l: 54, r: 12, t: 30, b: 40 };
  const PW = W - M.l - M.r, PH = H - M.t - M.b;

  const s = Object.assign(
    { measure: "unitsProduced", weeks: "all", axisFrom: 0, averageLine: false, hidden: [], highlight: null, mode: "pct" },
    options
  );
  s.hidden = new Set(s.hidden);
  s.fade = {}; // week -> 0..1 (1 = fully shown)
  s.avgShown = null; // animated average value; null = compute

  const wrap = document.createElement("div");
  wrap.className = "chart";
  host.appendChild(wrap);
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "group");
  wrap.appendChild(svg);

  const weekList = () => (s.weeks === "all" ? rows.map((r) => r.week) : s.weeks);
  const row = (w) => rows.find((r) => r.week === w);
  const value = (w) => {
    const r = row(w);
    if (s.measure === "scrapPct" && s.mode === "count") return Math.round((r.unitsProduced * r.scrapPct) / 100);
    return r[s.measure];
  };
  const fmt = (v) => {
    if (s.measure === "scrapPct") return s.mode === "count" ? "about " + v : v.toFixed(1) + "%";
    if (s.measure === "downtimeHrs") return (Math.round(v * 10) / 10).toLocaleString("en-AU") + " hrs";
    return Math.round(v).toLocaleString("en-AU");
  };
  const tickFmt = (v) => (s.measure === "scrapPct" && s.mode !== "count" ? +v.toFixed(1) + "%" : Math.round(v).toLocaleString("en-AU"));
  const title = () =>
    s.heading || (s.measure === "scrapPct" && s.mode === "count" ? "Scrap (housings, about)" : cols[s.measure].plainLabel);
  const shown = (w) => (s.fade[w] != null ? s.fade[w] : s.hidden.has(w) ? 0 : 1);
  const average = () => {
    if (s.avgShown != null) return s.avgShown;
    const ws = weekList().filter((w) => !s.hidden.has(w));
    return ws.reduce((a, w) => a + value(w), 0) / ws.length;
  };
  const niceStep = (range) => {
    const raw = range / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  };
  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  };
  const barPath = (x, y, w, h) => {
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  };

  let axisLabelBox = null;
  function render() {
    svg.textContent = "";
    const ws = weekList();
    const max = Math.max(...ws.map(value));
    const from = s.axisFrom;
    const step = niceStep(Math.max(max - from, 1));
    const top = from + Math.ceil((max - from) / step) * step;
    const y = (v) => M.t + PH - (Math.max(v, from) - from) / (top - from) * PH;

    el("text", { x: 4, y: 14, class: s.heading ? "t-ink t-head" : "t-ink2" }).textContent = title();
    for (let t = from; t <= top + 1e-9; t += step) {
      el("line", { x1: M.l, x2: W - M.r, y1: y(t), y2: y(t), stroke: t === from ? "var(--axis)" : "var(--line)", "stroke-width": 1 });
      const lbl = el("text", { x: M.l - 8, y: y(t) + 4, "text-anchor": "end", class: t === from && s.axisMark ? "t-ink" : "" });
      lbl.textContent = tickFmt(t);
    }
    // Bottom-of-scale marker (find-it and drag cards)
    if (s.axisMark) {
      const bx = 2, by = y(from) - 13, bw = M.l - 4, bh = 26;
      el("rect", { x: bx, y: by, width: bw, height: bh, rx: 8, fill: "var(--hivis-wash)", stroke: "var(--hivis)", "stroke-width": 1.5, class: s.axisMark === "pulse" ? "pulse" : "" });
      axisLabelBox = { x: bx, y: by, w: bw, h: bh };
      if (s.drag) {
        // chevrons say "this moves up and down"
        el("path", { d: `M${bx + bw / 2 - 5},${by - 4}l5,-5l5,5`, stroke: "var(--hivis)", "stroke-width": 2, fill: "none", "stroke-linecap": "round" });
        el("path", { d: `M${bx + bw / 2 - 5},${by + bh + 4}l5,5l5,-5`, stroke: "var(--hivis)", "stroke-width": 2, fill: "none", "stroke-linecap": "round" });
      }
    } else axisLabelBox = null;

    const band = PW / ws.length;
    const bw = Math.min(24, band * 0.62);
    ws.forEach((w, i) => {
      const v = value(w), x = M.l + band * i + (band - bw) / 2, yy = y(v), h = y(from) - yy;
      const op = shown(w);
      const isHi = s.highlight === w || (s.highlights || []).includes(w);
      const bar = el("path", {
        d: barPath(x, yy, bw, Math.max(h, 0)),
        fill: isHi ? "var(--bar-hi)" : "var(--bar)",
        opacity: 0.35 + 0.65 * op,
        class: s.pulse === w ? "pulse" : "",
      });
      if (op < 0.5) {
        bar.setAttribute("stroke", "var(--muted)");
        bar.setAttribute("stroke-dasharray", "4 3");
        bar.setAttribute("stroke-width", 1.5);
        bar.setAttribute("fill-opacity", 0.15);
      }
      el("text", { x: M.l + band * i + band / 2, y: H - M.b + 18, "text-anchor": "middle", class: isHi ? "t-ink" : "" }).textContent = w;
      if (isHi && s.highlight === w) {
        // keep the value label inside the drawing near the right edge
        const cx = x + bw / 2, right = cx > W - M.r - 30;
        el("text", { x: right ? W - 2 : cx, y: yy - 7, "text-anchor": right ? "end" : "middle", class: "t-ink" }).textContent = fmt(v);
      }
      if (s.onBarTap) {
        const hit = el("rect", { x: M.l + band * i, y: M.t, width: band, height: PH + 26, class: "hit", tabindex: 0, role: "button", "aria-label": `Week ${w}: ${fmt(v)}` });
        const fire = (e) => { e.stopPropagation(); s.onBarTap(w); };
        hit.addEventListener("click", fire);
        hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(e); } });
      }
    });
    el("text", { x: M.l + PW / 2, y: H - 4, "text-anchor": "middle" }).textContent = "Week";

    if (s.targetLine && s.measure === "unitsProduced") {
      const t = productionData.timeline[0].target;
      el("line", { x1: M.l, x2: W - M.r, y1: y(t), y2: y(t), stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "6 4" });
      // key sits in the title row, clear of the bars and their labels
      el("line", { x1: W - M.r - 104, x2: W - M.r - 84, y1: 10, y2: 10, stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "6 4" });
      el("text", { x: W - M.r, y: 14, "text-anchor": "end", class: "t-ink" }).textContent = "Target " + t.toLocaleString("en-AU");
    }

    if (s.averageLine) {
      const a = average();
      el("line", { x1: M.l, x2: W - M.r, y1: y(a), y2: y(a), stroke: "var(--ink)", "stroke-width": 2 });
      const label = "Average: " + fmt(a), lw = label.length * 6.6 + 12;
      el("rect", { x: W - M.r - lw, y: y(a) - 22, width: lw, height: 18, rx: 5, fill: "var(--surface)", opacity: 0.92 });
      el("text", { x: W - M.r - 6, y: y(a) - 9, "text-anchor": "end", class: "t-ink" }).textContent = label;
    }
    // Rings around parts of the chart the learner has spotted
    const ring = (x, y0, w, hh) => el("rect", { x, y: y0, width: w, height: hh, rx: 7, fill: "var(--hivis-wash)", stroke: "var(--hivis)", "stroke-width": 2 });
    (s.marks || []).forEach((m) => {
      if (m === "heading") ring(1, 0, W - 2, 21);
      if (m === "axis") ring(1, M.t - 8, M.l - 4, PH + 16);
      if (m === "weeks") ring(M.l, H - M.b + 4, PW, 20);
    });
    svg.setAttribute("aria-label", `${title()} by week. ` + ws.map((w) => `Week ${w}: ${fmt(value(w))}`).join(". "));
  }

  // Tap on the bottom-of-scale label, or anywhere else
  svg.addEventListener("click", (e) => {
    if (!s.onAxisTap && !s.onMiss && !s.onRegionTap) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (s.onRegionTap) {
      const region = p.y < 24 ? "heading" : p.y > H - M.b + 2 ? "weeks" : p.x < M.l ? "axis" : "plot";
      return s.onRegionTap(region);
    }
    const b = axisLabelBox;
    if (b && p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 10 && p.y <= b.y + b.h + 10) s.onAxisTap && s.onAxisTap();
    else s.onMiss && s.onMiss();
  });

  // Sliding a finger along the chart reports the week under it
  if (s.onScrub) {
    wrap.classList.add("drag");
    let down = false;
    const weekAt = (e) => {
      const r = svg.getBoundingClientRect(), ws = weekList();
      const x = ((e.clientX - r.left) / r.width) * W;
      const i = Math.floor(((x - M.l) / PW) * ws.length);
      return ws[Math.max(0, Math.min(ws.length - 1, i))];
    };
    svg.addEventListener("pointerdown", (e) => { down = true; svg.setPointerCapture(e.pointerId); s.onScrub(weekAt(e)); });
    svg.addEventListener("pointermove", (e) => { if (down) s.onScrub(weekAt(e)); });
    const up = () => { down = false; };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
  }

  // Vertical drag moves the start of the scale
  if (s.drag) {
    wrap.classList.add("drag");
    let startY = null, startVal = 0;
    svg.addEventListener("pointerdown", (e) => { startY = e.clientY; startVal = s.axisFrom; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener("pointermove", (e) => {
      if (startY == null) return;
      const scale = svg.getBoundingClientRect().height / H;
      const dv = ((startY - e.clientY) / (PH * scale)) * (s.drag.max - s.drag.min);
      const v = Math.max(s.drag.min, Math.min(s.drag.max, Math.round((startVal + dv) / s.drag.step) * s.drag.step));
      if (v !== s.axisFrom) { s.axisFrom = v; render(); s.drag.onChange && s.drag.onChange(v); }
    });
    const end = () => { startY = null; };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }

  let raf = null;
  const api = {
    el: wrap,
    get state() { return s; },
    set(patch) {
      if (patch.hidden) patch.hidden = new Set(patch.hidden);
      Object.assign(s, patch);
      s.fade = {}; s.avgShown = null;
      render();
    },
    // Smoothly move the scale start, average line and faded weeks
    animate(patch, ms = 900) {
      cancelAnimationFrame(raf);
      const fromAxis = s.axisFrom, fromAvg = average();
      const fromFade = {};
      weekList().forEach((w) => (fromFade[w] = shown(w)));
      if (patch.hidden) patch.hidden = new Set(patch.hidden);
      Object.assign(s, patch);
      s.fade = {}; s.avgShown = null;
      const toAxis = s.axisFrom, toAvg = average();
      const toFade = {};
      weekList().forEach((w) => (toFade[w] = shown(w)));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const frame = (now) => {
        const k = reduce ? 1 : ease(Math.min(1, (now - t0) / ms));
        s.axisFrom = Math.round(fromAxis + (toAxis - fromAxis) * k);
        s.avgShown = fromAvg + (toAvg - fromAvg) * k;
        weekList().forEach((w) => (s.fade[w] = fromFade[w] + (toFade[w] - fromFade[w]) * k));
        render();
        if (k < 1) raf = requestAnimationFrame(frame);
        else { s.axisFrom = toAxis; s.fade = {}; s.avgShown = null; render(); }
      };
      raf = requestAnimationFrame(frame);
    },
    pulse(week) { s.pulse = week; render(); setTimeout(() => { if (s.pulse === week) { s.pulse = null; render(); } }, 2800); },
    render,
  };
  render();
  return api;
};
