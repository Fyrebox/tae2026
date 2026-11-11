// API behind the tap-to-choose activities (/tech, /session2) and their host views.
// Same rules as /ruleorai: answers live in memory only, no names, and a reset starts a fresh class.
import express from "express";
import { ACTIVITIES } from "./pick-decks.js";
import { ID_PATTERN, createRateLimit, jsonErrors, requireHost } from "./activity-common.js";

const MAX_LEARNERS = 1000;

export function createPickRouter(activities = ACTIVITIES) {
  const rateLimit = createRateLimit();
  // activity id -> { items: Map, options: Set, learners: Map(learner id -> { answers }) }
  const state = new Map(Object.entries(activities).map(([key, a]) => [key, {
    activity: a,
    items: new Map(a.items.map((i) => [i.id, i])),
    options: new Set(a.options.map((o) => o.id)),
    learners: new Map(),
  }]));

  const router = express.Router();
  router.use(express.json({ limit: "2kb" }));
  router.param("activity", (req, res, next, key) => {
    req.act = state.get(key);
    if (!req.act) return res.status(404).json({ error: "Not found." });
    next();
  });

  function learner(act, id) {
    if (typeof id !== "string" || !ID_PATTERN.test(id)) return null;
    if (!act.learners.has(id)) {
      if (act.learners.size >= MAX_LEARNERS) return null;
      act.learners.set(id, { answers: {} });
    }
    return act.learners.get(id);
  }

  router.post("/:activity/join", rateLimit, (req, res) => {
    if (!learner(req.act, req.body?.id)) return res.status(400).json({ error: "Bad request." });
    res.json({ ok: true });
  });

  router.post("/:activity/answer", rateLimit, (req, res) => {
    const l = learner(req.act, req.body?.id);
    const { item, answer } = req.body || {};
    if (!l || !req.act.items.has(item) || (!req.act.items.get(item).options && !req.act.options.has(answer))) {
      return res.status(400).json({ error: "Bad request." });
    }
    // An item can have its own choices (the good-and-bad test); otherwise it uses the activity's options.
    const own = req.act.items.get(item)?.options;
    if (own && !own.some((o) => o.id === answer)) return res.status(400).json({ error: "Bad request." });
    // The first answer to an item counts, unless the activity allows retries: then the latest answer counts.
    if (req.act.activity.retries || !l.answers[item]) l.answers[item] = answer;
    res.json({ ok: true });
  });

  router.get("/:activity/host/stats", requireHost, (req, res) => {
    const { activity, learners } = req.act;
    const items = activity.items.map((i) => ({
      id: i.id, text: i.text, correct: i.answer, ...(i.options ? { options: i.options } : {}),
      counts: Object.fromEntries((i.options || activity.options).map((o) => [o.id, 0])),
    }));
    let started = 0;
    let finished = 0;
    let scoreSum = 0;
    for (const l of learners.values()) {
      let answered = 0;
      let score = 0;
      items.forEach((i) => {
        const a = l.answers[i.id];
        if (!a) return;
        i.counts[a] += 1;
        answered += 1;
        if (a === i.correct) score += 1;
      });
      if (answered) started += 1;
      if (answered === items.length) {
        finished += 1;
        scoreSum += score;
      }
    }
    res.json({
      joined: learners.size,
      started,
      finished,
      total: items.length,
      avgScore: finished ? scoreSum / finished : null,
      options: activity.options,
      items,
    });
  });

  router.post("/:activity/host/reset", requireHost, (req, res) => {
    req.act.learners.clear();
    res.json({ ok: true });
  });

  router.use(jsonErrors);
  return router;
}
