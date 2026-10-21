// API behind the "Rule or AI?" swipe activity (pages/sort.html) and the live host view (pages/host.html).
// Answers live in memory only: no names, no database. A restart or a reset starts a fresh class.
import crypto from "crypto";
import express from "express";
import { DECK } from "./sort-deck.js";

const MAX_LEARNERS = 1000;
// The site is public: cap calls per visitor. Generous, because a whole class can share one school IP.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_CALLS = 600;
const ID_PATTERN = /^[a-z0-9-]{8,40}$/i;

const HOST_PIN = process.env.HOST_PIN || String(crypto.randomInt(1000, 10000));
if (!process.env.HOST_PIN) console.log(`Host PIN for /host: ${HOST_PIN} (set HOST_PIN in .env to keep it)`);

const cardById = new Map(DECK.map((c) => [c.id, c]));
const learners = new Map(); // learner id -> { answers: { cardId: "rule" | "ai" } }

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();
function requireHost(req, res, next) {
  if (!crypto.timingSafeEqual(digest(req.get("x-host-pin") || ""), digest(HOST_PIN))) {
    return res.status(401).json({ error: "Wrong PIN." });
  }
  next();
}

const calls = new Map(); // ip -> timestamps of recent calls
function rateLimit(req, res, next) {
  const now = Date.now();
  // Behind Cloudflare every request comes from a Cloudflare IP; use the visitor's.
  const ip = req.get("cf-connecting-ip") || req.ip;
  const recent = (calls.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_CALLS) return res.status(429).json({ error: "Too many requests." });
  recent.push(now);
  calls.set(ip, recent);
  if (calls.size > 5000) {
    for (const [key, ts] of calls) if (!ts.some((t) => now - t < RATE_WINDOW_MS)) calls.delete(key);
  }
  next();
}

function learner(id) {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) return null;
  if (!learners.has(id)) {
    if (learners.size >= MAX_LEARNERS) return null;
    learners.set(id, { answers: {} });
  }
  return learners.get(id);
}

const router = express.Router();
router.use(express.json({ limit: "2kb" }));

router.post("/join", rateLimit, (req, res) => {
  if (!learner(req.body?.id)) return res.status(400).json({ error: "Bad request." });
  res.json({ ok: true });
});

router.post("/answer", rateLimit, (req, res) => {
  const l = learner(req.body?.id);
  const { card, answer } = req.body || {};
  if (!l || !cardById.has(card) || (answer !== "rule" && answer !== "ai")) {
    return res.status(400).json({ error: "Bad request." });
  }
  // The first answer to a card counts; practice rounds on the phone are never sent.
  if (!l.answers[card]) l.answers[card] = answer;
  res.json({ ok: true });
});

router.get("/host/stats", requireHost, (req, res) => {
  const cards = DECK.map((c) => ({ id: c.id, text: c.text, correct: c.answer, rule: 0, ai: 0 }));
  let started = 0;
  let finished = 0;
  let scoreSum = 0;
  for (const l of learners.values()) {
    let answered = 0;
    let score = 0;
    cards.forEach((c) => {
      const a = l.answers[c.id];
      if (!a) return;
      c[a] += 1;
      answered += 1;
      if (a === c.correct) score += 1;
    });
    if (answered) started += 1;
    if (answered === DECK.length) {
      finished += 1;
      scoreSum += score;
    }
  }
  res.json({
    joined: learners.size,
    started,
    finished,
    total: DECK.length,
    avgScore: finished ? scoreSum / finished : null,
    cards,
  });
});

router.post("/host/reset", requireHost, (req, res) => {
  learners.clear();
  res.json({ ok: true });
});

router.use((err, req, res, next) => {
  res.status(err.status && err.status < 600 ? err.status : 400).json({ error: "Bad request." });
});

export default router;
