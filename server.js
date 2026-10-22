import "dotenv/config";
import express from "express";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import llmExplainer from "./llm-explainer.js";
import sortRouter from "./sort.js";
import { DECK } from "./sort-deck.js";

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

app.get("/session1", (req, res) => res.type("html").send(sortPage));
app.get("/session1/host", (req, res) => res.type("html").send(hostPage));
app.get("/", (req, res) => res.redirect(302, "/session1"));
app.get("/host", (req, res) => res.redirect(301, "/session1/host"));
app.get("/how-ai-writes", (req, res) => res.type("html").send(llmPage));
// Registered before the static middleware, which would serve the raw template with its placeholders.
app.get(["/llm", "/llm/", "/llm/index.html"], (req, res) => res.redirect(301, "/how-ai-writes"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/llm", llmExplainer);
app.use("/api/sort", sortRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
