// Static pictures for story cards. Each returns an HTML string.
window.RTN = window.RTN || {};
RTN.icons = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  replay: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
  down: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M5 12l7 7 7-7"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  soundOn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
  tick: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  person: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--note-ink)" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6"/><path d="M8.6 5.6h6.8"/></svg>',
};

const face = (mouth) =>
  `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="18" r="15"/><circle cx="12.5" cy="15" r="1.4" fill="currentColor"/><circle cx="23.5" cy="15" r="1.4" fill="currentColor"/><path d="${mouth}"/></svg>`;
RTN.faces = [
  face("M11 25c4-4 10-4 14 0"),
  face("M11.5 24.5c4-2 9-2 13 0"),
  face("M12 23.5h12"),
  face("M11.5 22.5c4 2 9 2 13 0"),
  face("M11 21.5c4 4.5 10 4.5 14 0"),
];

RTN.visuals = {
  "noticeboard-sheet"() {
    const c = productionData.columns;
    const keys = ["week", "unitsProduced", "target", "downtimeHrs", "faultCalls", "scrapPct"];
    const n = (k, v) => (k === "scrapPct" ? v.toFixed(1) : v.toLocaleString("en-AU"));
    return `<div class="sheet" role="img" aria-label="The weekly sheet for Line 3, weeks 1 to 12">
      <h3>${productionData.line}, weeks 1 to 12</h3>
      <div class="sheet-scroll"><table>
        <thead><tr>${keys.map((k) => `<th>${c[k].label}</th>`).join("")}</tr></thead>
        <tbody>${productionData.timeline.map((r) => `<tr>${keys.map((k) => `<td>${n(k, r[k])}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div></div>`;
  },
  "how-to-tap"() {
    return `<div class="howto" aria-hidden="true"><div>Go back</div><div>Hear again</div><div>Keep going</div></div>
      <p class="howto-arrow" aria-hidden="true">Your buttons are down here<br>${RTN.icons.down}</p>`;
  },
  "chapter-title"(card, chapter) {
    return `<div class="title-card"><span class="eyebrow">Chapter ${chapter.number}</span><h2>${chapter.title}</h2></div>`;
  },
  "supervisor-note-week7"() {
    const ev = supervisorEvents.events.find((e) => e.week === 7);
    return `<div class="sticky"><small>${supervisorEvents.source}</small><p>Week ${ev.week}: ${ev.text}</p></div>`;
  },
  "week7-figures"() {
    const r = productionData.timeline.find((x) => x.week === 7);
    return `<div class="tiles">
      <div class="tile"><b>${r.downtimeHrs}</b><span>hours the line was stopped</span></div>
      <div class="tile"><b>${r.unitsProduced.toLocaleString("en-AU")}</b><span>housings made</span></div></div>`;
  },
  "boss-at-noticeboard"(card) {
    return `<div class="boss"><div class="avatar">${RTN.icons.person}</div>
      <p class="bubble"><small>The boss</small>${card.caption.replace(/^"|"$/g, "")}</p></div>`;
  },
  // Someone on the floor talking: the boss, or a mate on the line
  speech(card) {
    const mate = card.speaker === "guide";
    return `<div class="boss"><div class="avatar${mate ? " mate" : ""}">${RTN.icons.person}</div>
      <p class="bubble"><small>${card.who || "The boss"}</small>${card.caption.replace(/^"|"$/g, "")}</p></div>`;
  },
  // Every note under the table, word for word, grouped by week
  "supervisor-notes"() {
    const byWeek = {};
    supervisorEvents.events.forEach((e) => (byWeek[e.week] = (byWeek[e.week] ? byWeek[e.week] + " " : "") + e.text));
    return `<div class="sticky notes-sticky"><small>${supervisorEvents.source}</small>${Object.entries(byWeek)
      .map(([w, t]) => `<p>Week ${w}: ${t}</p>`).join("")}</div>`;
  },
  "three-tricks"() {
    const ico = (inner) => `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--bar)" stroke-width="2.5" stroke-linecap="round">${inner}</svg>`;
    return `<ul class="tricks">
      <li>${ico('<path d="M8 36V20M16 36V18M24 36V30M32 36V19"/><path d="M5 22h34" stroke="var(--ink)" stroke-width="2"/>')}One odd week drags the average</li>
      <li>${ico('<path d="M8 36V28M18 36V14M28 36V8"/><path d="M4 36h36" stroke="var(--ink)" stroke-width="2"/><path d="M2 31l5-2M2 34l5-2" stroke="var(--hivis)"/>')}A scale not starting at zero makes small changes look big</li>
      <li>${ico('<text x="5" y="28" font-size="17" font-weight="700" fill="var(--bar)" stroke="none">%</text><path d="M24 22h14M33 17l5 5-5 5"/>')}A percent can hide the real count</li>
    </ul>`;
  },
};

// The weekly sheet as an interactive table, with the brief's own column labels
RTN.tableValue = (col, v) => (col === "scrapPct" ? v.toFixed(1) : v.toLocaleString("en-AU"));
RTN.table = function (host, opts = {}) {
  const keys = ["week", "unitsProduced", "target", "downtimeHrs", "faultCalls", "scrapPct"];
  const c = productionData.columns;
  const wrap = document.createElement("div");
  wrap.className = "sheet rt" + (opts.onTap ? " tappable" : "");
  wrap.innerHTML = `<h3>${productionData.line}, weeks 1 to 12</h3>
    <div class="sheet-scroll"><table>
      <thead><tr>${keys.map((k) => `<th data-col="${k}">${c[k].label}</th>`).join("")}</tr></thead>
      <tbody>${productionData.timeline.map((r) => `<tr data-week="${r.week}">${keys
        .map((k) => `<td data-col="${k}"${opts.onTap ? ` tabindex="0" role="button" aria-label="Week ${r.week}, ${c[k].label}: ${RTN.tableValue(k, r[k])}"` : ""}>${RTN.tableValue(k, r[k])}</td>`)
        .join("")}</tr>`).join("")}</tbody>
    </table></div>`;
  host.appendChild(wrap);
  if (opts.onTap) {
    const fire = (td) => opts.onTap(+td.parentElement.dataset.week, td.dataset.col);
    wrap.addEventListener("click", (e) => { const td = e.target.closest("td"); if (td) fire(td); });
    wrap.addEventListener("keydown", (e) => {
      const td = e.target.closest("td");
      if (td && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); fire(td); }
    });
  }
  const all = (sel) => wrap.querySelectorAll(sel);
  return {
    clear() { all(".hl-row, .hl-col, .found, .tried").forEach((n) => n.classList.remove("hl-row", "hl-col", "found", "tried")); },
    row(w) { all(`tr[data-week="${w}"]`).forEach((n) => n.classList.add("hl-row")); },
    column(col) { all(`[data-col="${col}"]`).forEach((n) => n.classList.add("hl-col")); },
    cell(w, col, kind) {
      const td = wrap.querySelector(`tr[data-week="${w}"] td[data-col="${col}"]`);
      td.classList.add(kind);
      td.scrollIntoView({ block: "nearest", inline: "nearest" });
    },
  };
};
