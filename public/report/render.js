// Read-only view of a Bellarine report, shared by the learner's "Download a copy" and the host view.
// Returns an HTML string; every value is escaped.
window.renderReport = (form, report) => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const when = report.submittedAt ? new Date(report.submittedAt).toLocaleString("en-AU") : "Not submitted yet";
  const out = [
    `<header class="rhead"><p class="eyebrow">Bellarine Pathology · ICT Services</p><h1>${esc(form.title)}</h1>`,
    `<p>Prepared by <strong>${esc(report.name || "—")}</strong> for ${esc(form.submitTo)}</p></header>`,
  ];
  form.sections.forEach((s) => {
    out.push(`<section class="rsec"><h2>${s.n}. ${esc(s.title)}</h2><p class="maps">${esc(s.maps)}</p>`);
    s.groups.forEach((g) => {
      out.push(`<div class="rgroup"><h3>${esc(g.label)}</h3>`);
      g.fields.forEach((f) => {
        const v = report.fields[f.id];
        out.push(`<p>${f.label ? `<span class="flabel">${esc(f.label)}:</span> ` : ""}${v ? esc(v).replace(/\n/g, "<br>") : '<span class="empty">(empty)</span>'}</p>`);
      });
      out.push("</div>");
    });
    out.push("</section>");
  });
  // The good-and-bad test result travels with the report (PC 2.2); show it even when missing, so the assessor sees that.
  const gb = form.goodbad;
  if (gb) {
    out.push(`<section class="rsec"><h2>${esc(gb.title)}</h2><p class="maps">${esc(gb.maps)}</p><div class="rgroup">`);
    gb.fields.forEach((f) => {
      const v = report.fields[f.id];
      out.push(`<p><span class="flabel">${esc(f.label)}:</span> ${v ? esc(v) : '<span class="empty">(not done on this device)</span>'}</p>`);
    });
    out.push("</div></section>");
  }
  out.push(`<section class="rsec"><h2>9. Submission</h2><p>Submitted to ${esc(form.submitTo)} · ${esc(when)}</p><ul>`);
  form.checklist.forEach((c, i) => out.push(`<li>${report.checklist?.[i] ? "☑" : "☐"} ${esc(c)}</li>`));
  out.push("</ul></section>");
  return out.join("");
};

window.REPORT_PRINT_CSS = `
body{font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1b2a41;max-width:760px;margin:24px auto;padding:0 16px}
.eyebrow{margin:0;color:#5b6b7d;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}
h1{margin:.2rem 0}h2{font-size:1.2rem;border-bottom:2px solid #d3dde5;padding-bottom:4px;margin:1.4rem 0 .3rem}
h3{font-size:1rem;margin:.8rem 0 .2rem}.maps{color:#c9650f;font-size:.85rem;margin:0}
.rgroup p{margin:.15rem 0}.flabel{font-weight:600}.empty{color:#9aa8b6;font-style:italic}ul{list-style:none;padding:0}
@media print{h2{break-after:avoid}.rgroup{break-inside:avoid}}`;
