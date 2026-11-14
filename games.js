// Session 3 workplace games (/hairdresser): an ink story (games/<key>.ink) compiled at boot, plus the API that
// lets the trainer's host view follow each learner's level and read the recommendation they send.
// Same rules as the other activities: memory only, an anonymous id, a first name only when submitting.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { Compiler, CompilerOptions } from "inkjs/full";
import { ID_PATTERN, createRateLimit, jsonErrors, requireHost } from "./activity-common.js";
import { GAME as hairdresser } from "./games/hairdresser.js";
import { GAME as cardiacnurse } from "./games/cardiacnurse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const GAMES = { hairdresser, cardiacnurse };

const MAX_LEARNERS = 200;
const TEXT_MAX = 300;
// What a learner sends with "Send it": their first name, score and the story's answers (all chosen by tapping).
const ANSWER_KEYS = ["start", "start_why", "start_fix", "feedback", "change", "ai_goal", "ai_risk", "ml_goal", "ml_risk", "dl_goal", "dl_risk"];

export const storySource = (key) => fs.readFileSync(path.join(__dirname, "games", `${key}.ink`), "utf8");

// Compile the ink source to the JSON the browser runtime plays. Any error or warning stops the server starting.
export function compileStory(source) {
  const messages = [];
  const compiler = new Compiler(source, new CompilerOptions(null, [], false, (m) => messages.push(m)));
  let json;
  try {
    json = compiler.Compile().ToJson();
  } catch {
    throw new Error(`Ink story failed to compile:\n${messages.join("\n")}`);
  }
  if (messages.length) throw new Error(`Ink story has warnings:\n${messages.join("\n")}`);
  return json;
}

// Level names, in story order, from the "# level:" tags.
export const levelsOf = (source) => [...new Set([...source.matchAll(/#\s*level:([^#\n]+)/g)].map((m) => m[1].trim()))];

const fail = (status) => Object.assign(new Error("bad"), { status });
const isInt = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
const cleanText = (s) => (typeof s === "string" ? s.trim().slice(0, TEXT_MAX) : "");

export function createGameRouter(games = GAMES) {
  const rateLimit = createRateLimit();
  const state = new Map(Object.entries(games).map(([key, game]) => [key, {
    game,
    levels: levelsOf(storySource(key)),
    learners: new Map(), // learner id -> { n, level, score, total, name, answers, submittedAt, updatedAt }
  }]));

  const router = express.Router();
  router.use(express.json({ limit: "8kb" }));
  router.param("game", (req, res, next, key) => {
    req.g = state.get(key);
    if (!req.g) return res.status(404).json({ error: "Not found." });
    next();
  });

  function learner(g, id) {
    if (typeof id !== "string" || !ID_PATTERN.test(id)) throw fail(400);
    if (!g.learners.has(id)) {
      if (g.learners.size >= MAX_LEARNERS) throw fail(400);
      g.learners.set(id, { n: g.learners.size + 1, level: g.levels[0], score: 0, total: 0, name: "", answers: null, submittedAt: null, updatedAt: Date.now() });
    }
    return g.learners.get(id);
  }

  router.post("/:game/progress", rateLimit, (req, res) => {
    const { id, level, score, total } = req.body || {};
    if (!req.g.levels.includes(level) || !isInt(score, 100) || !isInt(total, 100) || score > total) throw fail(400);
    const l = learner(req.g, id);
    Object.assign(l, { level, score, total, updatedAt: Date.now() });
    res.json({ ok: true });
  });

  router.post("/:game/submit", rateLimit, (req, res) => {
    const { id, name, score, total, answers } = req.body || {};
    const first = cleanText(name).slice(0, 40);
    if (!first || !isInt(score, 100) || !isInt(total, 100) || score > total || !answers || typeof answers !== "object") throw fail(400);
    if (!req.g.game.startable.includes(answers.start)) throw fail(400);
    const l = learner(req.g, id);
    Object.assign(l, {
      // The score as sent stays with the recommendation, even if the learner plays again afterwards.
      name: first, score, total, sentScore: score, sentTotal: total, level: req.g.levels.at(-1),
      answers: Object.fromEntries(ANSWER_KEYS.map((k) => [k, cleanText(answers[k])])),
      submittedAt: Date.now(), updatedAt: Date.now(),
    });
    res.json({ ok: true });
  });

  router.get("/:game/host", requireHost, (req, res) => {
    res.json({
      levels: req.g.levels,
      learners: [...req.g.learners.values()].sort((a, b) => a.n - b.n),
    });
  });

  router.post("/:game/host/reset", requireHost, (req, res) => {
    req.g.learners.clear();
    res.json({ ok: true });
  });

  router.use(jsonErrors);
  return router;
}
