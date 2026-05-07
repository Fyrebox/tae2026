import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initSchema } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COURSE_DURATION_MIN = 30;

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function parseScheduledAt(raw) {
  if (!raw || !raw.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function findStudentConflicts(client, courseId, scheduledAt, name) {
  if (!scheduledAt) return [];
  const { rows } = await client.query(
    `SELECT c2.id, c2.title, c2.scheduled_at
     FROM attendees a
     JOIN courses c2 ON c2.id = a.course_id
     WHERE LOWER(TRIM(a.name)) = LOWER(TRIM($1))
       AND a.course_id <> $2
       AND c2.scheduled_at IS NOT NULL
       AND c2.scheduled_at <  ($3::timestamptz + ($4 || ' minutes')::interval)
       AND c2.scheduled_at + ($4 || ' minutes')::interval > $3::timestamptz`,
    [name, courseId, scheduledAt, COURSE_DURATION_MIN]
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
    [id]
  );
  return rows[0];
}

app.get('/', async (req, res) => {
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
  res.render('index', { title: 'TAE Assignment Sign-Up Sheet', courses: rows });
});

app.get('/courses/new', (req, res) => {
  res.render('new', { title: 'Post a mini course' });
});

app.post('/courses', async (req, res) => {
  const { title, presenter, contact, description, scheduled_at } = req.body;

  if (!title?.trim() || !presenter?.trim() || !contact?.trim()) {
    return res.status(400).send('Missing required fields');
  }

  await pool.query(
    `INSERT INTO courses (title, presenter, contact, description, scheduled_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      title.trim(),
      presenter.trim(),
      contact.trim(),
      description?.trim() || null,
      parseScheduledAt(scheduled_at),
    ]
  );

  res.redirect('/');
});

app.get('/courses/:id/edit', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send('Bad id');

  const { rows } = await pool.query(`SELECT * FROM courses WHERE id = $1`, [id]);
  if (rows.length === 0) return res.status(404).send('Course not found');

  res.render('edit', { title: `Edit: ${rows[0].title}`, course: rows[0], warnings: [] });
});

app.post('/courses/:id/delete', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send('Bad id');

  await pool.query(`DELETE FROM courses WHERE id = $1`, [id]);
  res.redirect('/');
});

app.post('/courses/:id/edit', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send('Bad id');

  const { title, presenter, contact, description, scheduled_at } = req.body;
  if (!title?.trim() || !presenter?.trim() || !contact?.trim()) {
    return res.status(400).send('Missing required fields');
  }

  const newScheduledAt = parseScheduledAt(scheduled_at);

  const { rowCount } = await pool.query(
    `UPDATE courses
     SET title = $1, presenter = $2, contact = $3, description = $4, scheduled_at = $5
     WHERE id = $6`,
    [title.trim(), presenter.trim(), contact.trim(), description?.trim() || null, newScheduledAt, id]
  );
  if (rowCount === 0) return res.status(404).send('Course not found');

  // Warn (don't block) about students now in conflict because of this time change.
  const warnings = [];
  if (newScheduledAt) {
    const { rows } = await pool.query(
      `SELECT a1.name,
              c2.id   AS other_id,
              c2.title AS other_title,
              c2.scheduled_at AS other_scheduled_at
       FROM attendees a1
       JOIN attendees a2
         ON LOWER(TRIM(a2.name)) = LOWER(TRIM(a1.name))
        AND a2.course_id <> a1.course_id
       JOIN courses c2 ON c2.id = a2.course_id
       WHERE a1.course_id = $1
         AND c2.scheduled_at IS NOT NULL
         AND c2.scheduled_at <  ($2::timestamptz + ($3 || ' minutes')::interval)
         AND c2.scheduled_at + ($3 || ' minutes')::interval > $2::timestamptz`,
      [id, newScheduledAt, COURSE_DURATION_MIN]
    );
    for (const r of rows) {
      warnings.push(
        `${r.name} is also enrolled in "${r.other_title}" at ${new Date(r.other_scheduled_at).toLocaleString()}`
      );
    }
  }

  if (warnings.length) {
    const course = await loadCardCourse(id);
    const { rows: attendees } = await pool.query(
      `SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`,
      [id]
    );
    return res.render('course', { title: course.title, course, attendees, warnings });
  }

  res.redirect(`/courses/${id}`);
});

app.get('/calendar', async (req, res) => {
  // Month query param: YYYY-MM. Default to current month.
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (typeof req.query.month === 'string') {
    const m = req.query.month.match(/^(\d{4})-(\d{1,2})$/);
    if (m) {
      year = Number(m[1]);
      month = Number(m[2]) - 1;
    }
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const { rows: courses } = await pool.query(
    `SELECT id, title, presenter, scheduled_at
     FROM courses
     WHERE scheduled_at >= $1 AND scheduled_at < $2
     ORDER BY scheduled_at ASC`,
    [monthStart, monthEnd]
  );

  // Conflict pairs across the whole DB (cheap; small table).
  const { rows: conflictRows } = await pool.query(
    `SELECT a1.name,
            c1.id AS course_a,
            c2.id AS course_b
     FROM attendees a1
     JOIN attendees a2
       ON LOWER(TRIM(a2.name)) = LOWER(TRIM(a1.name))
      AND a2.course_id > a1.course_id
     JOIN courses c1 ON c1.id = a1.course_id
     JOIN courses c2 ON c2.id = a2.course_id
     WHERE c1.scheduled_at IS NOT NULL
       AND c2.scheduled_at IS NOT NULL
       AND c1.scheduled_at <  c2.scheduled_at + ($1 || ' minutes')::interval
       AND c1.scheduled_at + ($1 || ' minutes')::interval > c2.scheduled_at`,
    [COURSE_DURATION_MIN]
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
  const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  res.render('calendar', {
    title: 'Course calendar',
    year,
    month, // 0-indexed
    monthLabel: monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    prevMonth: fmtMonth(prevDate),
    nextMonth: fmtMonth(nextDate),
    courses,
    conflictsByCourse,
    titleById,
    durationMin: COURSE_DURATION_MIN,
  });
});

app.get('/courses/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send('Bad id');

  const { rows: courseRows } = await pool.query(`SELECT * FROM courses WHERE id = $1`, [id]);
  if (courseRows.length === 0) return res.status(404).send('Course not found');
  const course = courseRows[0];

  const { rows: attendees } = await pool.query(
    `SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`,
    [id]
  );

  res.render('course', { title: course.title, course, attendees, warnings: [] });
});

app.post('/courses/:id/attendees', async (req, res) => {
  const id = Number(req.params.id);
  const name = (req.body.name || '').trim();
  if (!Number.isInteger(id) || !name) return res.status(400).send('Bad request');

  const { rows: courseRows } = await pool.query(
    `SELECT id, scheduled_at FROM courses WHERE id = $1`,
    [id]
  );
  if (courseRows.length === 0) return res.status(404).send('Course not found');
  const target = courseRows[0];

  let conflictMessage = null;
  if (target.scheduled_at) {
    const conflicts = await findStudentConflicts(pool, id, target.scheduled_at, name);
    if (conflicts.length) {
      const c = conflicts[0];
      conflictMessage = `${name} is already enrolled in "${c.title}" at ${new Date(c.scheduled_at).toLocaleString()}.`;
    }
  }

  if (!conflictMessage) {
    try {
      await pool.query(
        `INSERT INTO attendees (course_id, name) VALUES ($1, $2)`,
        [id, name]
      );
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }

  if (req.body.view === 'card') {
    const course = await loadCardCourse(id);
    return res.render('_card', { course, errorMessage: conflictMessage });
  }

  const { rows: attendees } = await pool.query(
    `SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`,
    [id]
  );
  res.render('_attendees', { courseId: id, attendees, errorMessage: conflictMessage });
});

app.delete('/courses/:id/attendees/:attendeeId', async (req, res) => {
  const id = Number(req.params.id);
  const attendeeId = Number(req.params.attendeeId);
  if (!Number.isInteger(id) || !Number.isInteger(attendeeId)) return res.status(400).send('Bad request');

  await pool.query(
    `DELETE FROM attendees WHERE id = $1 AND course_id = $2`,
    [attendeeId, id]
  );

  const view = req.body.view || req.query.view;
  if (view === 'card') {
    const course = await loadCardCourse(id);
    return res.render('_card', { course });
  }

  const { rows: attendees } = await pool.query(
    `SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`,
    [id]
  );
  res.render('_attendees', { courseId: id, attendees });
});

initSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialise schema:', err);
    process.exit(1);
  });
