export const SUPERVISION = ['matt', 'david', 'recorded'];
export const SUPERVISION_IMPORT = 'presentation-supervision-v1';
const overlaps = (a,b) => a.date===b.date && a.startTime && b.startTime && a.endTime && b.endTime && a.startTime<b.endTime && b.startTime<a.endTime;

export function instructorConflicts(presentations) {
  const conflicts=[];
  for(let i=0;i<presentations.length;i++)for(let j=i+1;j<presentations.length;j++){
    const a=presentations[i],b=presentations[j];
    if(!['matt','david'].includes(a.supervision)||a.supervision!==b.supervision||!overlaps(a,b))continue;
    conflicts.push({supervision:a.supervision,date:a.date,presentationIds:[a.id,b.id].sort(),studentIds:[a.studentId,b.studentId],startTime:a.startTime>b.startTime?a.startTime:b.startTime,endTime:a.endTime<b.endTime?a.endTime:b.endTime});
  }
  return conflicts;
}

export function supervisionIssues(presentations,students) {
  const coverage=students.flatMap(s=>{
    const sessions=presentations.filter(p=>p.studentId===s.id);
    const missing=SUPERVISION.filter(label=>!sessions.some(p=>p.supervision===label));
    const duplicates=SUPERVISION.filter(label=>sessions.filter(p=>p.supervision===label).length>1);
    const unassigned=sessions.filter(p=>!p.supervision).length;
    return missing.length||duplicates.length||unassigned?[{studentId:s.id,missing,duplicates,unassigned}]:[];
  });
  return {coverage,conflicts:instructorConflicts(presentations)};
}

// Constraint search: each student's three sessions use all three labels, while
// Matt and David can each attend only one presentation at any given time.
export function planSupervision(presentations,{maxNodes=200000}={}) {
  const rows=[...presentations].sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||'').localeCompare(b.startTime||'')||a.id.localeCompare(b.id));
  const students=new Set(rows.map(p=>p.studentId));
  if([...students].some(id=>rows.filter(p=>p.studentId===id).length!==3))return null;
  const neighbours=rows.map((a,i)=>rows.flatMap((b,j)=>i!==j&&(a.studentId===b.studentId||overlaps(a,b))?[j]:[]));
  const assigned=rows.map(p=>p.supervision||null);
  const compatible=(i,label,j,other)=>rows[i].studentId===rows[j].studentId?label!==other:label==='recorded'||label!==other;
  if(assigned.some((label,i)=>label&&neighbours[i].some(j=>assigned[j]&&!compatible(i,label,j,assigned[j]))))return null;
  let nodes=0;
  function search(){
    if(++nodes>maxNodes)return false;
    let chosen=-1,choices;
    for(let i=0;i<rows.length;i++){
      if(assigned[i])continue;
      const available=SUPERVISION.filter(label=>neighbours[i].every(j=>!assigned[j]||compatible(i,label,j,assigned[j])));
      if(!available.length)return false;
      if(chosen<0||available.length<choices.length||(available.length===choices.length&&neighbours[i].length>neighbours[chosen].length)){chosen=i;choices=available;}
    }
    if(chosen<0)return true;
    for(const label of choices){assigned[chosen]=label;if(search())return true;}
    assigned[chosen]=null;return false;
  }
  return search()?new Map(rows.map((p,i)=>[p.id,assigned[i]])):null;
}

// One-time, audited allocation against the actual timetable, including organiser
// edits. Later restarts never replace a label or change dates, times or units.
export async function importSupervision(query) {
  if((await query('SELECT id FROM schedule.imports WHERE id=$1',[SUPERVISION_IMPORT])).rowCount)return;
  const fields=`id, student_id AS "studentId", day::text AS date,
    to_char(start_time,'HH24:MI') AS "startTime", to_char(end_time,'HH24:MI') AS "endTime", supervision, version`;
  const before=(await query(`SELECT ${fields} FROM schedule.presentations ORDER BY day,start_time,id`)).rows;
  const plan=planSupervision(before);
  const seen=new Map();
  const changes=before.filter(p=>!p.supervision).map(p=>{
    const index=seen.get(p.studentId)||0;seen.set(p.studentId,index+1);
    return {...p,supervision:plan?.get(p.id)||SUPERVISION[index%3]};
  });
  if(changes.length){
    const updated=(await query(`UPDATE schedule.presentations p SET supervision=x.label,version=p.version+1
      FROM unnest($1::text[],$2::text[]) AS x(key,label) WHERE p.id=x.key RETURNING ${fields}`,
      [changes.map(p=>p.id),changes.map(p=>p.supervision)])).rows;
    const old=new Map(before.map(p=>[p.id,p]));
    await query(`INSERT INTO schedule.changes(action,student_id,before_data,after_data)
      SELECT 'supervision assigned',student_id,before_data::jsonb,after_data::jsonb
      FROM unnest($1::text[],$2::text[],$3::text[]) AS x(student_id,before_data,after_data)`,
      [updated.map(p=>p.studentId),updated.map(p=>JSON.stringify(old.get(p.id))),updated.map(p=>JSON.stringify(p))]);
  }
  await query('INSERT INTO schedule.imports(id) VALUES($1)',[SUPERVISION_IMPORT]);
}
