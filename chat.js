// API behind the "Ask AI" chat on the Session 2 page (/brief2): learners research how an option card would be
// applied, without leaving the page. Nothing is stored; questions with an email address or phone number are refused.
import express from "express";
import OpenAI from "openai";
import { ID_PATTERN, createRateLimit } from "./activity-common.js";

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-5.6-luna";
// gpt-5.x / gpt-6 / o-series are reasoning models: switch reasoning off for quick answers on phones.
const IS_REASONING = /^(gpt-[56]|o\d)/.test(CHAT_MODEL);
const MAX_CHARS = 1000; // per learner message
const MAX_ANSWER_CHARS = 4000; // per earlier answer sent back as context
const MAX_MESSAGES = 7; // the question plus three earlier exchanges
const PER_LEARNER = { windowMs: 10 * 60 * 1000, max: 10 };
const DAILY_MAX = 600; // whole site, so a mistake cannot run up a bill

const SYSTEM = `You help beginner ICT students research how a small Australian pathology company (Bellarine Pathology, fictional) could use a technology.
Answer in plain English for someone new to IT, in under 150 words, with no markdown: short lines, and lines starting with "- " for lists.
When asked how to start using a product, say what the company would need (data, licences, skills) and the first two steps.
Mention privacy where it matters (patient data, the Privacy Act 1988). Never ask for or repeat personal information.`;

const PERSONAL = /[\w.+-]+@[\w-]+\.[\w.-]+|(?:\+?61[ -]?|\(?\b0)[2-478]\)?(?:[ -]?\d){8}\b/; // email, or Australian phone number

function openaiAsk() {
  let client = null;
  return async (messages) => {
    if (!process.env.OPENAI_API_KEY) throw Object.assign(new Error("OPENAI_API_KEY is not set"), { status: 503 });
    client ||= new OpenAI();
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
      ...(IS_REASONING ? { reasoning_effort: "none", max_completion_tokens: 600 } : { max_completion_tokens: 400 }),
    });
    return completion.choices[0]?.message?.content?.trim() || "";
  };
}

const fail = (status, error) => Object.assign(new Error(error), { status, expose: true });

// ask(messages) -> answer text; tests pass a stand-in so no real AI is called.
export function createChatRouter({ ask = openaiAsk(), now = Date.now } = {}) {
  const learners = new Map(); // learner id -> timestamps of recent questions
  let day = "", today = 0;

  function checkLimits(id) {
    const t = now();
    const recent = (learners.get(id) || []).filter((x) => t - x < PER_LEARNER.windowMs);
    if (recent.length >= PER_LEARNER.max) throw fail(429, "That's a lot of questions. Wait a few minutes, then try again.");
    const d = new Date(t).toISOString().slice(0, 10);
    if (d !== day) { day = d; today = 0; }
    if (today >= DAILY_MAX) throw fail(429, "The AI chat has reached today's limit. Ask your trainer.");
    recent.push(t); today += 1;
    learners.set(id, recent);
    if (learners.size > 5000) learners.clear();
  }

  function readMessages(body) {
    const { id, messages } = body || {};
    if (typeof id !== "string" || !ID_PATTERN.test(id)) throw fail(400, "Bad request.");
    if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) throw fail(400, "Bad request.");
    const clean = messages.map((m, i) => {
      const role = i % 2 === messages.length % 2 ? "assistant" : "user"; // alternating, ending with the learner's question
      if (m?.role !== role || typeof m.content !== "string" || !m.content.trim()) throw fail(400, "Bad request.");
      const limit = role === "user" ? MAX_CHARS : MAX_ANSWER_CHARS;
      if (m.content.length > limit) throw fail(400, `Please keep your question under ${MAX_CHARS} characters.`);
      if (role === "user" && PERSONAL.test(m.content)) throw fail(400, "Please remove the email address or phone number first: never type personal information.");
      return { role, content: m.content };
    });
    return { id, messages: clean };
  }

  const router = express.Router();
  router.use(express.json({ limit: "16kb" }));
  router.post("/", createRateLimit({ max: 300 }), async (req, res, next) => {
    try {
      const { id, messages } = readMessages(req.body);
      checkLimits(id);
      const answer = await ask(messages);
      if (!answer) throw fail(502, "The AI did not answer. Please try again.");
      res.json({ answer });
    } catch (err) {
      next(err);
    }
  });
  router.use((err, req, res, next) => {
    if (err.expose) return res.status(err.status).json({ error: err.message });
    if (err.type === "entity.parse.failed" || err.type === "entity.too.large") return res.status(400).json({ error: "Bad request." });
    console.error("AI chat:", err.status || "", err.message);
    res.status(503).json({ error: "The AI chat is not working right now.", fallback: true });
  });
  return router;
}
