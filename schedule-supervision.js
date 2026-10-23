import { DELIVERY_DATES } from './schedule-data.js';

export const SUPERVISION = ['matt', 'david', 'recorded'];
export const GROUP_DAY_IMPORT = 'group-day-supervision-v1';
export const groupDayFields = 'group_number AS "group", day::text AS date, supervision, version';

export function initialGroupDays(dates) {
  return [...new Set(dates)].sort().flatMap(date=>[1,2,3].map(group=>({
    group,date,supervision:DELIVERY_DATES.includes(date)?SUPERVISION[(DELIVERY_DATES.indexOf(date)+group-1)%3]:'recorded',
  })));
}

export function inheritSupervision(presentations,students,groupDays) {
  const groups=new Map(students.map(s=>[s.id,s.group]));
  const labels=new Map(groupDays.map(d=>[d.group+':'+d.date,d.supervision]));
  return presentations.map(p=>({...p,supervision:labels.get(groups.get(p.studentId)+':'+p.date)||'recorded'}));
}

export const auditGroupDay = (query,action,before,after) => query(
  'INSERT INTO schedule.changes(action,group_number,before_data,after_data) VALUES($1,$2,$3,$4)',
  [action,after.group,JSON.stringify(before),JSON.stringify(after)]
);

export async function importGroupDays(query) {
  if((await query('SELECT id FROM schedule.imports WHERE id=$1',[GROUP_DAY_IMPORT])).rowCount)return;
  const presentations=(await query('SELECT student_id AS "studentId",day::text AS date,supervision FROM schedule.presentations')).rows;
  const groups=(await query('SELECT id,group_number AS "group" FROM schedule.students')).rows;
  const studentGroups=new Map(groups.map(s=>[s.id,s.group]));
  const planned=initialGroupDays([...DELIVERY_DATES,...presentations.map(p=>p.date)]);
  const rows=(await query(`INSERT INTO schedule.group_days(group_number,day,supervision)
    SELECT group_number,day::date,supervision FROM unnest($1::int[],$2::text[],$3::text[]) AS x(group_number,day,supervision)
    ON CONFLICT(group_number,day) DO NOTHING RETURNING ${groupDayFields}`,
    [planned.map(d=>d.group),planned.map(d=>d.date),planned.map(d=>d.supervision)])).rows;
  if(rows.length){
    const previous=rows.map(d=>JSON.stringify({group:d.group,date:d.date,legacyLabels:presentations.filter(p=>p.date===d.date&&studentGroups.get(p.studentId)===d.group).map(p=>({studentId:p.studentId,supervision:p.supervision}))}));
    await query(`INSERT INTO schedule.changes(action,group_number,before_data,after_data)
      SELECT 'group supervision assigned',group_number,before_data::jsonb,after_data::jsonb
      FROM unnest($1::int[],$2::text[],$3::text[]) AS x(group_number,before_data,after_data)`,
      [rows.map(d=>d.group),previous,rows.map(d=>JSON.stringify(d))]);
  }
  await query('INSERT INTO schedule.imports(id) VALUES($1)',[GROUP_DAY_IMPORT]);
}

// New custom dates start with recordings until the organiser assigns instructors.
// Existing dates and empty calendar days retain their saved allocation.
export async function ensureGroupDays(query,date) {
  const rows=(await query(`INSERT INTO schedule.group_days(group_number,day,supervision)
    SELECT group_number,$1::date,'recorded' FROM generate_series(1,3) AS x(group_number)
    ON CONFLICT(group_number,day) DO NOTHING RETURNING ${groupDayFields}`,[date])).rows;
  for(const row of rows)await auditGroupDay(query,'group supervision assigned',null,row);
}
