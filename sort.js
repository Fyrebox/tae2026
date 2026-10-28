// API behind the /session1 swipe activity and the /session1/host live host view.
// Answers live in memory only: no names, no database. A restart or a reset starts a fresh class.
import express from "express";
import { DECK } from "./sort-deck.js";
import { ID_PATTERN, createRateLimit, jsonErrors, requireHost } from "./activity-common.js";

const MAX_LEARNERS = 1000;
const rateLimit = createRateLimit();

const cardById = new Map(DECK.map((c) => [c.id, c]));
const learners = new Map(); // learner id -> { answers: { cardId: "rule" | "ai" } }

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

router.use(jsonErrors);

export default router;
