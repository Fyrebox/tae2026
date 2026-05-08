import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool, initSchema } from '../db.js';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node tasks/import-courses.js <path-to-backup.json>');
    process.exitCode = 1;
    return;
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exitCode = 1;
    return;
  }

  const payload = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  if (!Array.isArray(payload.courses)) {
    console.error('Invalid backup file: missing "courses" array');
    process.exitCode = 1;
    return;
  }

  await initSchema();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      `SELECT (SELECT COUNT(*) FROM courses)::int AS courses,
              (SELECT COUNT(*) FROM attendees)::int AS attendees`
    );
    if (existing[0].courses > 0 || existing[0].attendees > 0) {
      throw new Error(
        `Refusing to import: target DB already has ${existing[0].courses} course(s) and ${existing[0].attendees} attendee(s). ` +
          'Truncate the tables manually first if you really want to overwrite.'
      );
    }

    let courseCount = 0;
    let attendeeCount = 0;

    for (const c of payload.courses) {
      await client.query(
        `INSERT INTO courses
           (id, title, title_2, description, presenter, contact,
            scheduled_at, scheduled_at_2, meeting_link, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          c.id,
          c.title,
          c.title_2 ?? null,
          c.description ?? null,
          c.presenter,
          c.contact ?? null,
          c.scheduled_at ?? null,
          c.scheduled_at_2 ?? null,
          c.meeting_link ?? null,
          c.created_at ?? new Date(),
        ]
      );
      courseCount += 1;

      for (const a of c.attendees || []) {
        await client.query(
          `INSERT INTO attendees (id, course_id, name, joined_at)
           VALUES ($1, $2, $3, $4)`,
          [a.id, c.id, a.name, a.joined_at ?? new Date()]
        );
        attendeeCount += 1;
      }
    }

    // Resync the SERIAL sequences so future inserts don't collide with restored IDs.
    await client.query(`SELECT setval(pg_get_serial_sequence('courses', 'id'),
                                       COALESCE((SELECT MAX(id) FROM courses), 1))`);
    await client.query(`SELECT setval(pg_get_serial_sequence('attendees', 'id'),
                                       COALESCE((SELECT MAX(id) FROM attendees), 1))`);

    await client.query('COMMIT');
    console.log(`Imported ${courseCount} course(s) and ${attendeeCount} attendee(s) from ${absPath}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error('Import failed:', err.message || err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
