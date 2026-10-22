import { SCHEDULE_STUDENTS } from './schedule-data.js';
import { BALANCED_PRESENTATIONS } from './schedule-plan.js';

export const REBALANCE_ID = 'balanced-three-deliveries-november-2026-v1';
const fields = `id, student_id AS "studentId", day::text AS date,
  to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime", version`;
const key = p => p.studentId + '-' + p.date;

// Run inside the startup transaction. The import marker prevents any subsequent
// deployment from undoing an organiser's changes. Existing unit names are untouched.
export async function rebalanceSchedule(query) {
  if ((await query('SELECT id FROM schedule.imports WHERE id=$1', [REBALANCE_ID])).rowCount) return;
  const existing = (await query(`SELECT ${fields} FROM schedule.presentations`)).rows;
  const original = SCHEDULE_STUDENTS.flatMap(s => s.dates.map(date => ({ studentId: s.id, date })));
  const expectedKeys = new Set(original.map(key));
  if (existing.length !== original.length || existing.some(p => !expectedKeys.has(key(p)))) {
    throw new Error('Schedule assignments changed since the rebalance was prepared; review before applying it.');
  }
  const planned = new Map(BALANCED_PRESENTATIONS.map(p => [key(p), p]));
  const old = new Map(existing.map(p => [key(p), p]));
  const record = (action, studentId, before, after) => query(
    'INSERT INTO schedule.changes(action,student_id,before_data,after_data) VALUES($1,$2,$3,$4)',
    [action, studentId, JSON.stringify(before), JSON.stringify(after)]
  );
  for (const p of existing) {
    if (planned.has(key(p))) continue;
    await query('DELETE FROM schedule.presentations WHERE id=$1', [p.id]);
    await record('presentation removed · rebalance', p.studentId, p, null);
  }
  for (const p of BALANCED_PRESENTATIONS) {
    const before = old.get(key(p));
    const result = before
      ? await query(`UPDATE schedule.presentations SET start_time=$1,end_time=$2,version=version+1 WHERE id=$3 RETURNING ${fields}`, [p.startTime,p.endTime,before.id])
      : await query(`INSERT INTO schedule.presentations(id,student_id,day,start_time,end_time) VALUES($1,$2,$3,$4,$5) RETURNING ${fields}`, [key(p),p.studentId,p.date,p.startTime,p.endTime]);
    await record(before ? 'time assigned · rebalance' : 'presentation added · rebalance', p.studentId, before || null, result.rows[0]);
  }
  await query('INSERT INTO schedule.imports(id) VALUES($1)', [REBALANCE_ID]);
}
