// API behind /report (learners submit the Bellarine report) and /report/host (the trainer reads and prints them).
// Reports live in memory only, like the activities: learners keep their own copy on the device and can download it.
import express from "express";
import { FIELDS, FIELD_LIMITS, REPORT } from "./report-form.js";
import { ID_PATTERN, createRateLimit, jsonErrors, requireHost } from "./activity-common.js";

const MAX_REPORTS = 200;
const NAME_MAX = 60;

// Returns clean { name, fields, checklist } or null if anything is malformed.
export function cleanSubmission(body) {
  const { name, fields, checklist } = body || {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > NAME_MAX) return null;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return null;
  if (!Array.isArray(checklist) || checklist.length !== REPORT.checklist.length || !checklist.every((c) => c === true)) return null;
  const clean = {};
  for (const [id, value] of Object.entries(fields)) {
    const field = FIELDS.get(id);
    if (!field || typeof value !== "string" || value.length > FIELD_LIMITS[field.type]) return null;
    if (field.type === "select" && value && !field.options.includes(value)) return null;
    if (value.trim()) clean[id] = value;
  }
  return { name: name.trim(), fields: clean, checklist };
}

export function createReportRouter() {
  const rateLimit = createRateLimit({ max: 120 });
  const reports = new Map(); // learner id -> { name, fields, checklist, submittedAt, count }

  const router = express.Router();
  router.use(express.json({ limit: "64kb" }));

  router.post("/submit", rateLimit, (req, res) => {
    const id = req.body?.id;
    const clean = cleanSubmission(req.body);
    if (typeof id !== "string" || !ID_PATTERN.test(id) || !clean) return res.status(400).json({ error: "Bad request." });
    const previous = reports.get(id);
    if (!previous && reports.size >= MAX_REPORTS) return res.status(503).json({ error: "Too many reports." });
    const submittedAt = new Date().toISOString();
    // Resubmitting replaces the earlier version, so the trainer always sees the latest.
    reports.set(id, { ...clean, submittedAt, count: (previous?.count || 0) + 1 });
    res.json({ ok: true, submittedAt });
  });

  router.get("/host/list", requireHost, (req, res) => {
    const list = [...reports.entries()]
      .map(([id, r]) => ({ id, name: r.name, submittedAt: r.submittedAt, count: r.count, filled: Object.keys(r.fields).length, total: FIELDS.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ reports: list });
  });

  router.get("/host/report/:id", requireHost, (req, res) => {
    const r = reports.get(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found." });
    res.json(r);
  });

  router.post("/host/reset", requireHost, (req, res) => {
    reports.clear();
    res.json({ ok: true });
  });

  router.use(jsonErrors);
  return router;
}
