import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'node:crypto';
import { createScheduleStore } from '../schedule-db.js';
import { createScheduleRouter } from '../schedule.js';
import { BALANCED_PRESENTATIONS } from '../schedule-plan.js';
import { SUPERVISION, SUPERVISION_IMPORT, planSupervision, instructorConflicts, supervisionIssues } from '../schedule-supervision.js';

const plannedRows=()=>BALANCED_PRESENTATIONS.map((p,i)=>({...p,id:'planned-'+i}));

test('allocate one of each per student without instructor overlaps',()=>{
  const rows=plannedRows(),plan=planSupervision(rows);
  assert.ok(plan);assert.equal(plan.size,57);
  const labelled=rows.map(p=>({...p,supervision:plan.get(p.id)}));
  for(const id of new Set(rows.map(p=>p.studentId)))assert.deepEqual(labelled.filter(p=>p.studentId===id).map(p=>p.supervision).sort(),[...SUPERVISION].sort());
  assert.deepEqual(instructorConflicts(labelled),[]);
  assert.deepEqual(supervisionIssues(labelled,[...new Set(rows.map(p=>p.studentId))].map(id=>({id}))),{coverage:[],conflicts:[]});
  assert.deepEqual(planSupervision(rows),plan);
});

test('recordings may overlap, adjacent instructor sessions do not conflict, and impossible plans fail safely',()=>{
  const row=(id,supervision,startTime='09:00',endTime='09:30')=>({id,studentId:id,date:'2026-11-06',supervision,startTime,endTime});
  assert.equal(instructorConflicts([row('a','recorded'),row('b','recorded')]).length,0);
  assert.equal(instructorConflicts([row('a','matt'),row('b','matt','09:30','10:00')]).length,0);
  assert.equal(instructorConflicts([row('a','matt'),row('b','matt','09:29','09:59')]).length,1);
  assert.equal(instructorConflicts([row('a','matt'),row('b','david')]).length,0);
  const impossible=['a','b','c','d'].flatMap(studentId=>[0,1,2].map(i=>({...row(studentId+i,null),studentId,date:`2026-11-${String(6+i*7).padStart(2,'0')}`})));
  assert.equal(planSupervision(impossible),null);
  assert.equal(planSupervision(plannedRows(),{maxNodes:0}),null);
  const issues=supervisionIssues([row('a','matt'),{...row('b','matt'),studentId:'a'}],[{id:'a'}]);
  assert.deepEqual(issues.coverage,[{studentId:'a',missing:['david','recorded'],duplicates:['matt'],unassigned:0}]);
});

test('PIN-protected labels, atomic swaps, instructor warnings, moves and one-time import', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
  const schema='schedule_labels_'+crypto.randomBytes(6).toString('hex');
  let store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
  const app=express();app.use('/api/schedule',createScheduleRouter({query:(...args)=>store.query(...args),transaction:fn=>store.transaction(fn)},{pin:'573829',secure:false}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api/schedule`;let cookie='';
  async function request(path='',method='GET',body){
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
  }
  const edit=(p,extra={})=>request('/presentations/'+p.id,'PATCH',{date:p.date,startTime:p.startTime,endTime:p.endTime,version:p.version,...extra});
  try{
    const initial=(await request()).data;
    assert.deepEqual(initial.supervisionIssues,{coverage:[],conflicts:[]});
    const sessions=initial.presentations.filter(p=>p.studentId==='rachel'),first=sessions[0],other=sessions[1];
    assert.equal((await edit(first,{supervision:other.supervision})).status,401);
    const login=await request('/admin/login','POST',{pin:'573829'});cookie=login.cookie.split(';')[0];
    assert.equal((await edit(first,{supervision:'someone else'})).status,400);
    const proposed=await edit(first,{supervision:other.supervision});assert.equal(proposed.status,409);assert.equal(proposed.data.code,'supervision-swap');assert.equal(proposed.data.swapTarget.id,other.id);
    assert.deepEqual((await request()).data.presentations,initial.presentations);
    assert.equal((await edit(first,{supervision:other.supervision,swapWith:{id:other.id,version:other.version-1}})).status,409);
    const swapped=await edit(first,{supervision:other.supervision,swapWith:{id:other.id,version:other.version},allowInstructorConflict:true});assert.equal(swapped.status,200);
    let current=(await request()).data;
    const changedOther=current.presentations.find(p=>p.id===other.id);
    assert.equal(changedOther.supervision,first.supervision);assert.equal(changedOther.version,other.version+1);
    assert.ok(!current.supervisionIssues.coverage.some(c=>c.studentId==='rachel'));
    assert.deepEqual(current.students,initial.students);
    for(const p of current.presentations){const old=initial.presentations.find(x=>x.id===p.id);assert.equal(p.date,old.date);assert.equal(p.startTime,old.startTime);assert.equal(p.endTime,old.endTime);}
    assert.equal((await edit(other)).status,409);
    assert.equal((await edit(swapped.data,{supervision:first.supervision,swapWith:{id:changedOther.id,version:changedOther.version},allowInstructorConflict:true})).status,200);
    const fresh=(await request()).data.presentations.find(p=>p.id===first.id);
    const moved=await edit(fresh,{date:'2026-12-04',startTime:'09:00',endTime:'09:30'});assert.equal(moved.status,200);assert.equal(moved.data.supervision,first.supervision);
    assert.equal((await edit(moved.data,{date:first.date,startTime:first.startTime,endTime:first.endTime})).status,200);
    // Two instructors are shared across groups; recorded presentations have no such restriction.
    const add=(studentId,supervision,extra={})=>request('/presentations','POST',{studentId,supervision,date:'2026-12-04',startTime:'09:00',endTime:'09:30',...extra});
    const a=await add('rachel','matt');assert.equal(a.status,201);
    const warning=await add('carly','matt');assert.equal(warning.status,409);assert.equal(warning.data.code,'instructor-conflict');
    const b=await add('carly','matt',{allowInstructorConflict:true});assert.equal(b.status,201);
    const c=await add('ket','recorded');assert.equal(c.status,201);
    current=(await request()).data;assert.equal(current.supervisionIssues.conflicts.length,1);assert.ok(current.supervisionIssues.coverage.some(c=>c.studentId==='rachel'&&c.duplicates.includes('matt')));
    const later=await edit(a.data,{startTime:'11:00',endTime:'11:30'});assert.equal(later.status,200);
    const moveConflict=await edit(later.data,{startTime:'09:00',endTime:'09:30'});assert.equal(moveConflict.status,409);assert.equal(moveConflict.data.code,'instructor-conflict');
    for(const p of [later.data,b.data,c.data])assert.equal((await request('/presentations/'+p.id,'DELETE',{version:p.version})).status,200);
    const history=(await request('/admin/history')).data;assert.ok(history.some(c=>c.action==='supervision swapped'&&c.before.supervision!==c.after.supervision));
    assert.deepEqual((await request()).data.supervisionIssues,{coverage:[],conflicts:[]});
    // Simulate installing labels on an existing edited timetable with entered units.
    await store.transaction(async query=>{
      await query("UPDATE schedule.students SET unit='Preserve this unit' WHERE id='cyril'");
      await query("UPDATE schedule.presentations SET day='2026-12-04' WHERE id=$1",[first.id]);
      await query('UPDATE schedule.presentations SET supervision=NULL');
      await query('DELETE FROM schedule.imports WHERE id=$1',[SUPERVISION_IMPORT]);
    });
    const beforeImport=(await request()).data;
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    current=(await request()).data;assert.equal(current.presentations.length,57);assert.deepEqual(current.students,beforeImport.students);assert.deepEqual(current.supervisionIssues,{coverage:[],conflicts:[]});
    for(const p of current.presentations){const old=beforeImport.presentations.find(x=>x.id===p.id);assert.equal(p.date,old.date);assert.equal(p.startTime,old.startTime);assert.equal(p.endTime,old.endTime);assert.equal(p.version,old.version+1);}
    const auditCount=Number((await store.query('SELECT count(*) FROM schedule.changes')).rows[0].count);
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    assert.deepEqual((await request()).data.presentations,current.presentations);
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.changes')).rows[0].count),auditCount);
  }finally{
    await new Promise(r=>server.close(r));await store.query(`DROP SCHEMA ${schema} CASCADE`);await store.close();
  }
});
