// API behind the "How an AI writes" explainer on the home page (public/llm/).
// Tokenize → embed → next-token probabilities; the browser does the rest.
import express from "express";
import OpenAI from "openai";
import { getEncoding } from "js-tiktoken";

const CHAT_MODEL = process.env.OPENAI_EXPLAINER_MODEL || "gpt-4.1-mini";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-large";
// gpt-5.x / gpt-6 / o-series are reasoning models: they only return logprobs with
// reasoning switched off, cap top_logprobs at 5, and need a few output tokens.
const IS_REASONING = /^(gpt-[56]|o\d)/.test(CHAT_MODEL);
// How many embedding dimensions we send to the browser. text-embedding-3 models
// put the most important information first, so a prefix is a fair summary.
const EMBED_DIMS_SENT = 256;
const MAX_TEXT_CHARS = 4000;
const MAX_EMBED_BATCH = 300;
// The site is public: cap OpenAI calls per visitor.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_CALLS = 300;

// Chat models answer questions; we want them to behave like autocomplete.
const CONTINUE_PROMPT = `You are a raw text-completion engine, like a phone keyboard's autocomplete. The user message is an unfinished piece of text. Output only the text that comes immediately after it.
Rules:
- If the text ends with a complete word, start your output with a space and the next word.
- Only continue without a space if the last word is clearly cut off mid-word.
- Never repeat the given text, never answer, never comment.
Examples:
"The cat sat on the" -> " mat"
"It was cold and" -> " dark"
"Tokeniz" -> "ation"
"I love my gran" -> "dma"
"Once upon a time" -> ","`;

// o200k_base is the tokenizer of the gpt-4o and later families.
const enc = getEncoding("o200k_base");

let client = null;
function openai() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("The server is missing OPENAI_API_KEY. Add it to .env and restart.");
    err.status = 500;
    throw err;
  }
  if (!client) client = new OpenAI();
  return client;
}

function readText(body) {
  const text = typeof body?.text === "string" ? body.text : "";
  if (!text.trim()) {
    const err = new Error("Please type some text first.");
    err.status = 400;
    throw err;
  }
  if (text.length > MAX_TEXT_CHARS) {
    const err = new Error(`Text is too long (max ${MAX_TEXT_CHARS} characters).`);
    err.status = 400;
    throw err;
  }
  return text;
}

const calls = new Map(); // ip -> timestamps of recent OpenAI calls
function rateLimit(req, res, next) {
  const now = Date.now();
  // Behind Cloudflare every request comes from a Cloudflare IP; use the visitor's.
  const ip = req.get("cf-connecting-ip") || req.ip;
  const recent = (calls.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_CALLS) {
    return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
  }
  recent.push(now);
  calls.set(ip, recent);
  if (calls.size > 5000) {
    for (const [ip, ts] of calls) if (!ts.some((t) => now - t < RATE_WINDOW_MS)) calls.delete(ip);
  }
  next();
}

const router = express.Router();
router.use(express.json({ limit: "200kb" }));

router.post("/tokenize", (req, res) => {
  const text = readText(req.body);
  let offset = 0;
  const tokens = enc.encode(text).map((id) => {
    const piece = enc.decode([id]);
    const token = { id, text: piece, start: offset };
    offset += piece.length;
    return token;
  });
  res.json({ tokens });
});

// Embeddings never change for a given string, so cache them for the life of the process.
const embedCache = new Map();

router.post("/embed", rateLimit, async (req, res) => {
  const pieces = Array.isArray(req.body?.tokens) ? req.body.tokens : [];
  const unique = [...new Set(pieces.filter((p) => typeof p === "string" && p.length > 0 && p.length < 200))];
  if (unique.length > MAX_EMBED_BATCH) {
    return res.status(400).json({ error: "Too many tokens to embed at once." });
  }
  const missing = unique.filter((p) => !embedCache.has(p));
  if (missing.length) {
    const result = await openai().embeddings.create({ model: EMBED_MODEL, input: missing });
    result.data.forEach((row, i) => {
      const head = row.embedding.slice(0, EMBED_DIMS_SENT);
      const norm = Math.hypot(...head) || 1;
      embedCache.set(missing[i], {
        fullDims: row.embedding.length,
        vector: head.map((v) => Math.round((v / norm) * 1e4) / 1e4),
      });
    });
  }
  const vectors = {};
  for (const p of unique) vectors[p] = embedCache.get(p).vector;
  const fullDims = unique.length ? embedCache.get(unique[0]).fullDims : 3072;
  res.json({ model: EMBED_MODEL, fullDims, vectors });
});

router.post("/next", rateLimit, async (req, res) => {
  const text = readText(req.body);
  const completion = await openai().chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: CONTINUE_PROMPT },
      { role: "user", content: text },
    ],
    logprobs: true,
    ...(IS_REASONING
      ? { reasoning_effort: "none", max_completion_tokens: 16, top_logprobs: 5 }
      : { max_tokens: 1, temperature: 1, top_logprobs: 20 }),
  });
  // Only the first generated token matters; the rest (reasoning models) is ignored.
  const first = completion.choices[0]?.logprobs?.content?.[0];
  if (!first) return res.json({ model: CHAT_MODEL, done: true, candidates: [] });

  // The model often lists " mat" and "mat" separately; for students they are the
  // same idea, so merge them. Chat models are shaky about word boundaries, so when
  // both spellings appear, a word gets the spaced one (unless the text already ends in
  // a space) and punctuation gets the unspaced one.
  const endsInSpace = /\s$/.test(text);
  const merged = new Map();
  for (const { token, logprob } of first.top_logprobs) {
    const prob = Math.exp(logprob);
    // Special tokens like <|end|> mean "stop writing here".
    const end = /^<\|[a-z_]+\|>$/.test(token);
    const key = end ? "<end>" : token.trim() || token;
    const prev = merged.get(key);
    if (!prev) merged.set(key, end ? { token: "", end: true, prob } : { token, prob });
    else {
      prev.prob += prob;
      const wantSpace = !endsInSpace && /^[\p{L}\p{N}]/u.test(key);
      if (!end && /^\s/.test(token) === wantSpace) prev.token = token;
    }
  }
  const candidates = [...merged.values()].sort((a, b) => b.prob - a.prob);
  res.json({ model: CHAT_MODEL, done: false, candidates });
});

router.use((err, req, res, next) => {
  const status = err.status && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error("LLM explainer:", err);
  const message =
    err.status === 401
      ? "OpenAI rejected the API key. Check OPENAI_API_KEY in .env."
      : status >= 500 && !err.status
        ? "Something went wrong talking to the AI. Please try again."
        : err.message || "Something went wrong.";
  res.status(status).json({ error: message });
});

export default router;
