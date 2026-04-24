import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initSchema } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
  const { title, presenter, contact, description } = req.body;

  if (!title?.trim() || !presenter?.trim() || !contact?.trim()) {
    return res.status(400).send('Missing required fields');
  }

  await pool.query(
    `INSERT INTO courses (title, presenter, contact, description)
     VALUES ($1, $2, $3, $4)`,
    [title.trim(), presenter.trim(), contact.trim(), description?.trim() || null]
  );

  res.redirect('/');
});

app.get('/courses/:id/edit', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).send('Bad id');

  const { rows } = await pool.query(`SELECT * FROM courses WHERE id = $1`, [id]);
  if (rows.length === 0) return res.status(404).send('Course not found');

  res.render('edit', { title: `Edit: ${rows[0].title}`, course: rows[0] });
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

  const { title, presenter, contact, description } = req.body;
  if (!title?.trim() || !presenter?.trim() || !contact?.trim()) {
    return res.status(400).send('Missing required fields');
  }

  const { rowCount } = await pool.query(
    `UPDATE courses SET title = $1, presenter = $2, contact = $3, description = $4 WHERE id = $5`,
    [title.trim(), presenter.trim(), contact.trim(), description?.trim() || null, id]
  );
  if (rowCount === 0) return res.status(404).send('Course not found');

  res.redirect(`/courses/${id}`);
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

  res.render('course', { title: course.title, course, attendees });
});

app.post('/courses/:id/attendees', async (req, res) => {
  const id = Number(req.params.id);
  const name = (req.body.name || '').trim();
  if (!Number.isInteger(id) || !name) return res.status(400).send('Bad request');

  try {
    await pool.query(
      `INSERT INTO attendees (course_id, name) VALUES ($1, $2)`,
      [id, name]
    );
  } catch (err) {
    if (err.code !== '23505') throw err;
  }

  if (req.body.view === 'card') {
    const { rows: courseRows } = await pool.query(
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
    return res.render('_card', { course: courseRows[0] });
  }

  const { rows: attendees } = await pool.query(
    `SELECT id, name FROM attendees WHERE course_id = $1 ORDER BY joined_at ASC`,
    [id]
  );
  res.render('_attendees', { courseId: id, attendees });
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
    const { rows: courseRows } = await pool.query(
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
    return res.render('_card', { course: courseRows[0] });
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
