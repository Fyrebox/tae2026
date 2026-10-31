import "dotenv/config";
import express from "express";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import llmExplainer from "./llm-explainer.js";
import sortRouter from "./sort.js";
import { DECK } from "./sort-deck.js";
import { createPickRouter } from "./pick.js";
import { ACTIVITIES } from "./pick-decks.js";
import { createReportRouter } from "./report.js";
import { REPORT } from "./report-form.js";
import { createScheduleStore } from "./schedule-db.js";
import { createScheduleRouter } from "./schedule.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

const read = (...parts) => fs.readFileSync(path.join(__dirname, ...parts), "utf8");
// Content hash of a file, put on asset URLs so Cloudflare and browsers fetch fresh copies after a deploy.
const fileHash = (...parts) =>
  crypto.createHash("md5").update(fs.readFileSync(path.join(__dirname, ...parts))).digest("hex").slice(0, 8);
// Fill {{placeholders}} in an HTML page once at boot.
const fill = (html, vars) =>
  Object.entries(vars).reduce((out, [key, value]) => out.replaceAll(`{{${key}}}`, () => value), html);

// Session 1: "Rule or AI?" swipe activity. The deck is embedded in the page, so it
// keeps working if the Wi-Fi drops after it has loaded. "<" is escaped so no card text can close the script tag.
const sortVars = {
  v: fileHash("public", "sort", "app.js").slice(0, 4) + fileHash("public", "sort", "styles.css").slice(0, 4),
  deck: JSON.stringify(DECK).replaceAll("<", "\\u003c"),
};
const sortPage = fill(read("pages", "sort.html"), sortVars);
const hostPage = fill(read("pages", "host.html"), {
  v: fileHash("public", "sort", "host.js").slice(0, 4) + fileHash("public", "sort", "styles.css").slice(0, 4),
});
// Optional explainer: how an LLM picks its next word (public/llm).
const llmPage = fill(read("public", "llm", "index.html"), {
  cssVersion: fileHash("public", "llm", "styles.css"),
  jsVersion: fileHash("public", "llm", "app.js"),
});

// Session 1 has short addresses learners can type: /ruleorai and /brief (the Session 1 report page, with the /tech activity in section 3).
app.get("/ruleorai", (req, res) => res.type("html").send(sortPage));
app.get("/ruleorai/host", (req, res) => res.type("html").send(hostPage));
const moved = { "/session1": "/ruleorai", "/session1/host": "/ruleorai/host", "/session1/tech": "/tech", "/session1/tech/host": "/tech/host", "/report/1": "/brief", "/host": "/ruleorai/host" };
for (const [from, to] of Object.entries(moved)) app.get(from, (req, res) => res.redirect(301, to));

// Tap-to-choose activities (/tech, /session2), each with a host view at <path>/host. An activity with inPage runs inside that page instead.
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const embed = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const pickV = fileHash("public", "pick", "app.js").slice(0, 3) + fileHash("public", "pick", "host.js").slice(0, 3) + fileHash("public", "pick", "styles.css").slice(0, 3);
for (const [key, a] of Object.entries(ACTIVITIES)) {
  const vars = { v: pickV, title: escHtml(a.title), eyebrow: escHtml(a.eyebrow), lede: escHtml(a.lede), activity: embed({ key, ...a }) };
  const page = fill(read("pages", "pick.html"), vars);
  const host = fill(read("pages", "pick-host.html"), vars);
  if (a.inPage) app.get(a.path, (req, res) => res.redirect(301, a.inPage));
  else app.get(a.path, (req, res) => res.type("html").send(page));
  app.get(a.path + "/host", (req, res) => res.type("html").send(host));
}

// Bellarine Pathology scenario pages and the report form (with its host view for the trainer).
const bellarineV = { v: fileHash("public", "bellarine", "styles.css") };
const bellarinePages = {
  "/bellarine": "bellarine.html",
  "/bellarine/role-card": "bellarine-role-card.html",
  "/bellarine/links": "bellarine-links.html",
};
for (const [route, file] of Object.entries(bellarinePages)) {
  const page = fill(read("pages", file), bellarineV);
  app.get(route, (req, res) => res.type("html").send(page));
}
const reportVars = {
  v: fileHash("public", "report", "app.js").slice(0, 2) + fileHash("public", "report", "host.js").slice(0, 2)
    + fileHash("public", "report", "render.js").slice(0, 2) + fileHash("public", "report", "styles.css").slice(0, 2)
    + fileHash("public", "report", "activity.js").slice(0, 2),
  report: embed(REPORT),
  tech: embed({ key: "tech", ...ACTIVITIES.tech }),
};
const reportPage = fill(read("pages", "report.html"), reportVars);
const reportHostPage = fill(read("pages", "report-host.html"), reportVars);
for (const route of ["/report", "/brief", "/report/2", "/report/3"]) {
  app.get(route, (req, res) => res.type("html").send(reportPage));
}
app.get("/report/host", (req, res) => res.type("html").send(reportHostPage));
const schedulePage = fill(read("pages", "schedule.html"), {
  v: fileHash("public", "schedule", "app.js") + fileHash("public", "schedule", "styles.css"),
});
app.get("/", (req, res) => res.type("html").set("Cache-Control", "no-cache").send(schedulePage));
app.get("/how-ai-writes", (req, res) => res.type("html").send(llmPage));
// Registered before the static middleware, which would serve the raw template with its placeholders.
app.get(["/llm", "/llm/", "/llm/index.html"], (req, res) => res.redirect(301, "/how-ai-writes"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/llm", llmExplainer);
app.use("/api/sort", sortRouter);
app.use("/api/pick", createPickRouter());
app.use("/api/report", createReportRouter());

if (process.env.DATABASE_URL) {
  const scheduleStore = await createScheduleStore(process.env.DATABASE_URL, process.env.NODE_ENV === "test" ? process.env.SCHEDULE_DB_SCHEMA || "class_schedule_test" : "class_schedule");
  app.use("/api/schedule", createScheduleRouter(scheduleStore));
} else {
  console.warn("DATABASE_URL is missing: the class schedule cannot be loaded or saved.");
  app.use("/api/schedule", (req, res) => res.status(503).json({ error: "The schedule database is not configured yet." }));
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
