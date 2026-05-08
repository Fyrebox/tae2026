import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { pool, initSchema } from "./db.js";

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

const COURSE_DURATION_MIN = 30;

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function parseScheduledAt(raw) {
  if (!raw || !raw.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function findStudentConflicts(client, courseId, targetTimes, name) {
  const times = (targetTimes || []).filter(Boolean);
  if (times.length === 0) return [];
  const { rows } = await client.query(
    `SELECT c2.id, c2.title, c2.scheduled_at, c2.scheduled_at_2
     FROM attendees a
     JOIN courses c2 ON c2.id = a.course_id
     WHERE LOWER(TRIM(a.name)) = LOWER(TRIM($1))
       AND a.course_id <> $2
       AND EXISTS (
         SELECT 1 FROM unnest($3::timestamptz[]) t
         WHERE (c2.scheduled_at IS NOT NULL
                AND c2.scheduled_at <  t + ($4 || ' minutes')::interval
                AND c2.scheduled_at + ($4 || ' minutes')::interval > t)
            OR (c2.scheduled_at_2 IS NOT NULL
                AND c2.scheduled_at_2 <  t + ($4 || ' minutes')::interval
                AND c2.scheduled_at_2 + ($4 || ' minutes')::interval > t)
       )`,
    [name, courseId, times, COURSE_DURATION_MIN],
  );
  return rows;
}

async function loadCardCourse(id) {
  const { rows } = await pool.query(
    `SELECT c.*,
            COALESCE(COUNT(a.id), 0)::int AS attendee_count,
            COALESCE(
              json_agg(json_build_object('id', a.id, 'name', a.name) ORDER BY a.joined_at) FILTER (WHERE a.id IS NOT NULL),
              '[]'
            ) AS attendees
     FROM courses c
     LEFT JOIN attendees a ON a.course_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [id],
  );
  return rows[0];
}

app.get("/", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*,
           COALESCE(COUNT(a.id), 0)::int AS attendee_count,
           COALESCE(
             json_agg(json_build_object('id', a.id, 'name', a.name) ORDER BY a.joined_at) FILTER (WHERE a.id IS NOT NULL),
             '[]'
           ) AS attendees
    FROM courses c
    LEFT JOIN attendees a ON a.course_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  res.render("index", { title: "TAE Assignment Sign-Up Sheet", courses: rows });
});

app.get("/courses/new", (req, res) => {
  res.render("new", { title: "Post a mini course" });
});

app.post("/courses", async (req, res) => {
  const { title, title_2, presenter, contact, description, scheduled_at, scheduled_at_2, meeting_link } = req.body;

  if (!title?.trim() || !presenter?.trim() || !contact?.trim()) {
    return res.status(400).send("Missing required fields");
  }

  await pool.query(
    `INSERT INTO courses (title, title_2, presenter, contact, description, scheduled_at, scheduled_at_2, meeting_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      title.trim(),
      title_2?.trim() || null,
      presenter.trim(),
      contact.trim(),
      description?.trim() || null,
      parseScheduledAt(scheduled_at),
      parseScheduledAt(scheduled_at_2),
      meeting_link?.trim() || null,
    ],
  );

  res.redirect("/");
});

app.get("/courses/:id/edit", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send("Bad id");

  const { rows } = await pool.query(`SELECT * FROM courses WHERE id = $1`, [id]);
  if (rows.length === 0) return res.status(404).send("Course not found");

  res.render("edit", { title: `Edit: ${rows[0].title}`, course: rows[0], warnings: [] });
});

app.post("/courses/:id/delete", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send("Bad id");

  await pool.query(`DELETE FROM courses WHERE id = $1`, [id]);
  res.redirect("/");
});

app.post("/courses/:id/edit", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send("Bad id");

  const { title, title_2, presenter, contact, description, scheduled_at, scheduled_at_2, meeting_link } = req.body;
  if (!title?.trim() || !presenter?.trim() || !contact?.trim()) {
    return res.status(400).send("Missing required fields");
  }

  const newScheduledAt = parseScheduledAt(scheduled_at);
  const newScheduledAt2 = parseScheduledAt(scheduled_at_2);
  const newMeetingLink = meeting_link?.trim() || null;

  const { rowCount } = await pool.query(
    `UPDATE courses
     SET title = $1, title_2 = $2, presenter = $3, contact = $4, description = $5,
         scheduled_at = $6, scheduled_at_2 = $7, meeting_link = $8
     WHERE id = $9`,
    [
      title.trim(),
      title_2?.trim() || null,
      presenter.trim(),
      contact.trim(),
      description?.trim() || null,
      newScheduledAt,
      newScheduledAt2,
      newMeetingLink,
      id,
    ],
  );
  if (rowCount === 0) return res.status(404).send("Course not found");

  // Warn (don't block) about students now in conflict because of this time change.
  const warnings = [];
  const newTimes = [newScheduledAt, newScheduledAt2].filter(Boolean);
  if (newTimes.length) {
    const { rows } = await pool.query(
      `SELECT a1.name,
              c2.id   AS other_id,
              c2.title AS other_title,
              c2.scheduled_at AS other_scheduled_at,
              c2.scheduled_at_2 AS other_scheduled_at_2
       FROM attendees a1
       JOIN attendees a2
         ON LOWER(TRIM(a2.name)) = LOWER(TRIM(a1.name))
        AND a2.course_id <> a1.course_id
       JOIN courses c2 ON c2.id = a2.course_id
       WHERE a1.course_id = $1
         AND EXISTS (
           SELECT 1 FROM unnest($2::timestamptz[]) t
           WHERE (c2.scheduled_at IS NOT NULL
                  AND c2.scheduled_at <  t + ($3 || ' minutes')::interval
                  AND c2.scheduled_at + ($3 || ' minutes')::interval > t)
              OR (c2.scheduled_at_2 IS NOT NULL
                  AND c2.scheduled_at_2 <  t + ($3 || ' minutes')::interval
                  AND c2.scheduled_at_2 + ($3 || ' minutes')::interval > t)
         )`,
      [id, newTimes, COURSE_DURATION_MIN],
    );
    for (const r of rows) {
      const otherTime = r.other_scheduled_at || r.other_scheduled_at_2;
      warnings.push(`${r.name} is also enrolled in "${r.other_title}" at ${new Date(otherTime).toLocaleString()}`);
    }
  }

  if (warnings.length) {
    const course = await loadCardCourse(id);
    const { rows: attendees } = await pool.query(`SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`, [id]);
    return res.render("course", { title: course.title, course, attendees, warnings });
  }

  res.redirect("/");
});

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

app.get("/calendar", async (req, res) => {
  // Month query param: YYYY-MM. Default to current month.
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (typeof req.query.month === "string") {
    const m = req.query.month.match(/^(\d{4})-(\d{1,2})$/);
    if (m) {
      year = Number(m[1]);
      month = Number(m[2]) - 1;
    }
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const { rows: courses } = await pool.query(
    `SELECT id, title, presenter, scheduled_at, scheduled_at_2
     FROM courses
     WHERE (scheduled_at   >= $1 AND scheduled_at   < $2)
        OR (scheduled_at_2 >= $1 AND scheduled_at_2 < $2)
     ORDER BY COALESCE(scheduled_at, scheduled_at_2) ASC`,
    [monthStart, monthEnd],
  );

  // Conflict pairs across the whole DB (cheap; small table).
  // Two courses conflict if any session of one overlaps with any session of the other.
  const { rows: conflictRows } = await pool.query(
    `SELECT DISTINCT a1.name,
            c1.id AS course_a,
            c2.id AS course_b
     FROM attendees a1
     JOIN attendees a2
       ON LOWER(TRIM(a2.name)) = LOWER(TRIM(a1.name))
      AND a2.course_id > a1.course_id
     JOIN courses c1 ON c1.id = a1.course_id
     JOIN courses c2 ON c2.id = a2.course_id
     CROSS JOIN LATERAL (VALUES (c1.scheduled_at), (c1.scheduled_at_2)) AS s1(t)
     CROSS JOIN LATERAL (VALUES (c2.scheduled_at), (c2.scheduled_at_2)) AS s2(t)
     WHERE s1.t IS NOT NULL
       AND s2.t IS NOT NULL
       AND s1.t <  s2.t + ($1 || ' minutes')::interval
       AND s1.t + ($1 || ' minutes')::interval > s2.t`,
    [COURSE_DURATION_MIN],
  );

  // Build conflict map: courseId -> [{ name, otherCourseId }]
  const conflictsByCourse = new Map();
  const titleById = new Map(courses.map((c) => [c.id, c.title]));
  for (const r of conflictRows) {
    for (const [self, other] of [
      [r.course_a, r.course_b],
      [r.course_b, r.course_a],
    ]) {
      if (!conflictsByCourse.has(self)) conflictsByCourse.set(self, []);
      conflictsByCourse.get(self).push({ name: r.name, otherCourseId: other });
    }
  }

  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);
  const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  res.render("calendar", {
    title: "Course calendar",
    year,
    month, // 0-indexed
    monthLabel: monthStart.toLocaleString(undefined, { month: "long", year: "numeric" }),
    prevMonth: fmtMonth(prevDate),
    nextMonth: fmtMonth(nextDate),
    courses,
    conflictsByCourse,
    titleById,
    durationMin: COURSE_DURATION_MIN,
  });
});

app.get("/courses/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send("Bad id");

  const { rows: courseRows } = await pool.query(`SELECT * FROM courses WHERE id = $1`, [id]);
  if (courseRows.length === 0) return res.status(404).send("Course not found");
  const course = courseRows[0];

  const { rows: attendees } = await pool.query(`SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`, [id]);

  res.render("course", { title: course.title, course, attendees, warnings: [] });
});

app.post("/courses/:id/attendees", async (req, res) => {
  const id = Number(req.params.id);
  const name = (req.body.name || "").trim();
  if (!Number.isInteger(id) || !name) return res.status(400).send("Bad request");

  const { rows: courseRows } = await pool.query(`SELECT id, scheduled_at, scheduled_at_2 FROM courses WHERE id = $1`, [id]);
  if (courseRows.length === 0) return res.status(404).send("Course not found");
  const target = courseRows[0];

  let conflictMessage = null;
  const targetTimes = [target.scheduled_at, target.scheduled_at_2].filter(Boolean);
  if (targetTimes.length) {
    const conflicts = await findStudentConflicts(pool, id, targetTimes, name);
    if (conflicts.length) {
      const c = conflicts[0];
      const otherTime = c.scheduled_at || c.scheduled_at_2;
      conflictMessage = `${name} is already enrolled in "${c.title}" at ${new Date(otherTime).toLocaleString()}.`;
    }
  }

  if (!conflictMessage) {
    try {
      await pool.query(`INSERT INTO attendees (course_id, name) VALUES ($1, $2)`, [id, name]);
    } catch (err) {
      if (err.code !== "23505") throw err;
    }
  }

  if (req.body.view === "card") {
    const course = await loadCardCourse(id);
    return res.render("_card", { course, errorMessage: conflictMessage });
  }

  const { rows: attendees } = await pool.query(`SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`, [id]);
  res.render("_attendees", { courseId: id, attendees, errorMessage: conflictMessage });
});

app.delete("/courses/:id/attendees/:attendeeId", async (req, res) => {
  const id = Number(req.params.id);
  const attendeeId = Number(req.params.attendeeId);
  if (!Number.isInteger(id) || !Number.isInteger(attendeeId)) return res.status(400).send("Bad request");

  await pool.query(`DELETE FROM attendees WHERE id = $1 AND course_id = $2`, [attendeeId, id]);

  const view = req.body.view || req.query.view;
  if (view === "card") {
    const course = await loadCardCourse(id);
    return res.render("_card", { course });
  }

  const { rows: attendees } = await pool.query(`SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`, [id]);
  res.render("_attendees", { courseId: id, attendees });
});

initSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialise schema:", err);
    process.exit(1);
  });
