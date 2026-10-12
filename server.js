import "dotenv/config";
import express from "express";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import llmExplainer from "./llm-explainer.js";

// Toggle which LLM powers /ideas. Either 'anthropic' or 'openai'.
const IDEAS_PROVIDER = "openai";
const ANTHROPIC_MODEL = "claude-opus-4-7";
const OPENAI_MODEL = "gpt-5.4-mini";

let anthropicClient = null;
function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error("ANTHROPIC_API_KEY is not set");
    err.code = "NO_API_KEY";
    throw err;
  }
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

let openaiClient = null;
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("OPENAI_API_KEY is not set");
    err.code = "NO_API_KEY";
    throw err;
  }
  if (!openaiClient) openaiClient = new OpenAI();
  return openaiClient;
}

async function generateIdeasAnthropic(skills) {
  const response = await getAnthropic().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: [{ type: "text", text: IDEAS_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `Skills: ${skills}` }],
    output_config: {
      format: { type: "json_schema", schema: IDEAS_SCHEMA },
    },
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return JSON.parse(textBlock.text);
}

async function generateIdeasOpenAI(skills) {
  const response = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: IDEAS_SYSTEM_PROMPT },
      { role: "user", content: `Skills: ${skills}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "course_ideas", strict: true, schema: IDEAS_SCHEMA },
    },
  });
  return JSON.parse(response.choices[0].message.content);
}

async function generateIdeas(skills) {
  if (IDEAS_PROVIDER === "openai") return generateIdeasOpenAI(skills);
  return generateIdeasAnthropic(skills);
}

const IDEAS_SYSTEM_PROMPT = `You suggest beginner-friendly 30-minute online mini-course ideas for a TAFE assignment where students teach a small group remotely.

Audience: complete beginners on the topic. Each idea must be simple enough that someone with no prior knowledge can follow along in a single 30-minute session.

Every idea must include at least one concrete hands-on task the participants perform during the session, so the presenter can check whether the concept landed. The task should be doable in a few minutes with no special equipment beyond a typical laptop or whatever the topic naturally requires, and it should test the specific concept just taught — not generic engagement.

For each idea provide:
- title: short, specific course title (under 80 chars)
- blurb: one or two sentences describing what learners will be able to do by the end
- participant_task: one or two sentences describing the task each participant performs during the session to demonstrate understanding (e.g. "Each participant takes a sample profit & loss statement and identifies the three highest expense lines, then explains in one sentence what the net profit figure means.")
- why_30_min: one sentence explaining why this scope, including the participant task, fits a 30-minute session

Return 3 to 5 ideas. Output JSON only, matching the supplied schema. No prose outside the JSON.`;

const IDEAS_SCHEMA = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          blurb: { type: "string" },
          participant_task: { type: "string" },
          why_30_min: { type: "string" },
        },
        required: ["title", "blurb", "participant_task", "why_30_min"],
        additionalProperties: false,
      },
    },
  },
  required: ["ideas"],
  additionalProperties: false,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// "Read the Numbers" learning module (public/submission). One hash of its styles, engine and content
// goes on every asset URL, so Cloudflare serves fresh copies after a deploy. Registered before the
// static middleware, which would otherwise serve index.html with the placeholder still in it.
const submissionDir = path.join(__dirname, "public", "submission");
const submissionHash = crypto.createHash("md5");
for (const dir of ["css", "js", "content"]) {
  for (const file of fs.readdirSync(path.join(submissionDir, dir)).sort()) {
    submissionHash.update(fs.readFileSync(path.join(submissionDir, dir, file)));
  }
}
const submissionPage = fs
  .readFileSync(path.join(submissionDir, "index.html"), "utf8")
  .replaceAll("{{version}}", submissionHash.digest("hex").slice(0, 8));
app.get(["/submission", "/submission/"], (req, res) => res.type("html").send(submissionPage));

app.use(express.static(path.join(__dirname, "public")));

// Hash styles.css at boot so the URL changes whenever the file does, busting Cloudflare/browser caches.
const cssPath = path.join(__dirname, "public", "styles.css");
const cssVersion = crypto
  .createHash("md5")
  .update(fs.readFileSync(cssPath))
  .digest("hex")
  .slice(0, 8);
app.locals.cssVersion = cssVersion;

// Home page: the "How an AI writes" explainer (public/llm). Its assets get the same
// content-hash cache busting as styles.css.
const fileHash = (...parts) =>
  crypto.createHash("md5").update(fs.readFileSync(path.join(__dirname, ...parts))).digest("hex").slice(0, 8);
const llmHome = fs
  .readFileSync(path.join(__dirname, "public", "llm", "index.html"), "utf8")
  .replace("{{cssVersion}}", fileHash("public", "llm", "styles.css"))
  .replace("{{jsVersion}}", fileHash("public", "llm", "app.js"));

app.get("/", (req, res) => res.type("html").send(llmHome));
app.use("/api/llm", llmExplainer);

app.get("/seo-game", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "seo-game", "index.html"));
});

app.get("/ideas", (req, res) => {
  res.render("ideas", { title: "Need ideas?", skills: "", ideas: null, errorMessage: null });
});

app.post("/ideas", async (req, res) => {
  const skills = (req.body.skills || "").trim();
  const isHtmx = req.get("HX-Request") === "true";

  if (!skills) {
    const payload = { title: "Need ideas?", skills: "", ideas: null, errorMessage: "Please enter at least one skill." };
    return isHtmx ? res.render("_ideas_output", payload) : res.render("ideas", payload);
  }

  try {
    const parsed = await generateIdeas(skills);
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];
    const payload = { title: "Need ideas?", skills, ideas, errorMessage: null };
    return isHtmx ? res.render("_ideas_output", payload) : res.render("ideas", payload);
  } catch (err) {
    console.error("Ideas generation failed:", err);
    const isAuth = err.code === "NO_API_KEY" || err instanceof Anthropic.AuthenticationError || err?.status === 401;
    const keyName = IDEAS_PROVIDER === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
    const errorMessage = isAuth
      ? `The server is missing a valid ${keyName}. Add it to your .env and restart.`
      : "Could not generate ideas right now. Please try again.";
    const payload = { title: "Need ideas?", skills, ideas: null, errorMessage };
    return isHtmx ? res.render("_ideas_output", payload) : res.render("ideas", payload);
  }
});

app.get("/chatgpt", (req, res) => {
  res.render("chatgpt", { title: "Ask ChatGPT", prompt: "", answer: null, errorMessage: null });
});

app.post("/chatgpt", async (req, res) => {
  const prompt = (req.body.prompt || "").trim();
  const isHtmx = req.get("HX-Request") === "true";

  if (!prompt) {
    const payload = { title: "Ask ChatGPT", prompt: "", answer: null, errorMessage: "Please enter a prompt." };
    return isHtmx ? res.render("_chatgpt_output", payload) : res.render("chatgpt", payload);
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    const answer = response.choices[0]?.message?.content?.trim() || "";
    const payload = { title: "Ask ChatGPT", prompt, answer, errorMessage: null };
    return isHtmx ? res.render("_chatgpt_output", payload) : res.render("chatgpt", payload);
  } catch (err) {
    console.error("ChatGPT request failed:", err);
    const isAuth = err.code === "NO_API_KEY" || err?.status === 401;
    const errorMessage = isAuth
      ? "The server is missing a valid OPENAI_API_KEY. Add it to your .env and restart."
      : "Could not get an answer right now. Please try again.";
    const payload = { title: "Ask ChatGPT", prompt, answer: null, errorMessage };
    return isHtmx ? res.render("_chatgpt_output", payload) : res.render("chatgpt", payload);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
