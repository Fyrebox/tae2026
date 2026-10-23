import pg from 'pg';
import { SCHEDULE_STUDENTS } from './schedule-data.js';
import { rebalanceSchedule } from './schedule-rebalance.js';
import { importGroupDays } from './schedule-supervision.js';

// A separate schema leaves the former course site's tables untouched.
export async function createScheduleStore(connectionString, schema = 'class_schedule') {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('Invalid schedule schema');
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000 });
  pool.on('error', () => console.error('Schedule database connection interrupted'));
  const client = await pool.connect();
  let initializationError;
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [schema]);
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [schema+'-edit']);
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await client.query(`CREATE TABLE IF NOT EXISTS ${schema}.students (
      id text PRIMARY KEY, name text NOT NULL, group_number integer NOT NULL,
      display_order integer NOT NULL, unit text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1
    ); CREATE TABLE IF NOT EXISTS ${schema}.presentations (
      id text PRIMARY KEY, student_id text NOT NULL REFERENCES ${schema}.students(id),
      day date NOT NULL, start_time time, end_time time, version integer NOT NULL DEFAULT 1,
      CHECK ((start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)),
      UNIQUE(student_id, day)
    ); CREATE TABLE IF NOT EXISTS ${schema}.changes (
      id bigserial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(),
      action text NOT NULL, student_id text, before_data jsonb, after_data jsonb
    ); CREATE TABLE IF NOT EXISTS ${schema}.imports (id text PRIMARY KEY);`);
    await client.query(`ALTER TABLE ${schema}.presentations ADD COLUMN IF NOT EXISTS supervision text
      CHECK (supervision IN ('matt','david','recorded'))`);
    // Keep legacy individual labels for historical records; group_days is authoritative.
    await client.query(`ALTER TABLE ${schema}.changes ALTER COLUMN student_id DROP NOT NULL;
      ALTER TABLE ${schema}.changes ADD COLUMN IF NOT EXISTS group_number integer;
      CREATE TABLE IF NOT EXISTS ${schema}.group_days (
        group_number integer NOT NULL CHECK(group_number BETWEEN 1 AND 3),day date NOT NULL,
        supervision text NOT NULL CHECK(supervision IN ('matt','david','recorded')),
        version integer NOT NULL DEFAULT 1,PRIMARY KEY(group_number,day)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS one_instructor_per_day ON ${schema}.group_days(day,supervision)
        WHERE supervision IN ('matt','david');`);
    const imported = await client.query(`SELECT id FROM ${schema}.imports WHERE id = 'photos-november-2026'`);
    if (!imported.rowCount) {
      for (const s of SCHEDULE_STUDENTS) {
        await client.query(`INSERT INTO ${schema}.students(id,name,group_number,display_order,notes) VALUES($1,$2,$3,$4,$5)`, [s.id,s.name,s.group,s.order,s.notes]);
        for (const day of s.dates) await client.query(`INSERT INTO ${schema}.presentations(id,student_id,day) VALUES($1,$2,$3)`, [s.id+'-'+day,s.id,day]);
      }
      await client.query(`INSERT INTO ${schema}.imports(id) VALUES('photos-november-2026')`);
    }
    await rebalanceSchedule((sql, values) => client.query(sql.replaceAll('schedule.', `${schema}.`), values));
    await importGroupDays((sql, values) => client.query(sql.replaceAll('schedule.', `${schema}.`), values));
    await client.query('COMMIT');
  } catch (err) { await client.query('ROLLBACK'); initializationError = err; }
  finally { client.release(); }
  if (initializationError) { await pool.end(); throw initializationError; }
  return {
    query: (sql, values) => pool.query(sql.replaceAll('schedule.', `${schema}.`), values),
    async transaction(fn) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        // Serialize edits so overlapping concurrent bookings are detected.
        await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [schema+'-edit']);
        const result = await fn((sql, values) => c.query(sql.replaceAll('schedule.', `${schema}.`), values));
        await c.query('COMMIT'); return result;
      } catch (err) { await c.query('ROLLBACK'); throw err; }
      finally { c.release(); }
    },
    close: () => pool.end(),
  };
}
