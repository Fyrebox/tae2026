import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

async function main() {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  const { rows: courses } = await pool.query(
    `SELECT id, title, title_2, description, presenter, contact,
            scheduled_at, scheduled_at_2, meeting_link, created_at
     FROM courses
     ORDER BY id ASC`
  );

  const { rows: attendees } = await pool.query(
    `SELECT id, course_id, name, joined_at
     FROM attendees
     ORDER BY course_id ASC, joined_at ASC, id ASC`
  );

  const attendeesByCourse = new Map();
  for (const a of attendees) {
    if (!attendeesByCourse.has(a.course_id)) attendeesByCourse.set(a.course_id, []);
    attendeesByCourse.get(a.course_id).push({
      id: a.id,
      name: a.name,
      joined_at: a.joined_at,
    });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    schema_version: 1,
    counts: { courses: courses.length, attendees: attendees.length },
    courses: courses.map((c) => ({ ...c, attendees: attendeesByCourse.get(c.id) || [] })),
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(BACKUPS_DIR, `courses-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

  console.log(`Exported ${courses.length} course(s) and ${attendees.length} attendee(s)`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), outPath)}`);
}

main()
  .catch((err) => {
    console.error('Export failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
