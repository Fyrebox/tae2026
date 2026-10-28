// Shared by the class activities (/session1, /session1/tech, /session2, /report): one host PIN,
// the anonymous learner id check and a per-router rate limit.
import crypto from "crypto";

export const HOST_PIN = process.env.HOST_PIN || String(crypto.randomInt(1000, 10000));
if (!process.env.HOST_PIN) console.log(`Host PIN for the activity host views: ${HOST_PIN} (set HOST_PIN in .env to keep it)`);

export const ID_PATTERN = /^[a-z0-9-]{8,40}$/i;

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();
export function requireHost(req, res, next) {
  if (!crypto.timingSafeEqual(digest(req.get("x-host-pin") || ""), digest(HOST_PIN))) {
    return res.status(401).json({ error: "Wrong PIN." });
  }
  next();
}

// The site is public: cap calls per visitor. Generous, because a whole class can share one school IP.
// Each router gets its own counter so one activity cannot use up another's allowance.
export function createRateLimit({ windowMs = 10 * 60 * 1000, max = 600 } = {}) {
  const calls = new Map(); // ip -> timestamps of recent calls
  return function rateLimit(req, res, next) {
    const now = Date.now();
    // Behind Cloudflare every request comes from a Cloudflare IP; use the visitor's.
    const ip = req.get("cf-connecting-ip") || req.ip;
    const recent = (calls.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return res.status(429).json({ error: "Too many requests." });
    recent.push(now);
    calls.set(ip, recent);
    if (calls.size > 5000) {
      for (const [key, ts] of calls) if (!ts.some((t) => now - t < windowMs)) calls.delete(key);
    }
    next();
  };
}

export function jsonErrors(err, req, res, next) {
  res.status(err.status && err.status < 600 ? err.status : 400).json({ error: "Bad request." });
}
