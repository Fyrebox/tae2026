import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'node:crypto';
import { createScheduleStore } from '../schedule-db.js';
import { createScheduleRouter } from '../schedule.js';
import { SCHEDULE_STUDENTS } from '../schedule-data.js';
import { BALANCED_PRESENTATIONS } from '../schedule-plan.js';
import { REBALANCE_ID } from '../schedule-rebalance.js';

test('schedule import, persistence, editing, authentication and conflicts', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const schema='schedule_test_'+crypto.randomBytes(6).toString('hex');
  let store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
  const app=express();
  app.use('/api/schedule',createScheduleRouter(store,{pin:'573829',secure:false}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api/schedule`;
  let cookie='';
  async function request(path='',method='GET',body,extra={}) {
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
  }
  try {
    const initial=await request();assert.equal(initial.status,200);assert.equal(initial.data.students.length,19);assert.equal(initial.data.presentations.length,57);assert.equal(initial.data.admin,false);assert.deepEqual(initial.data.conflicts,[]);
    assert.ok(initial.data.dates.includes('2026-12-04'));
    assert.equal(initial.data.presentations.filter(p=>p.date==='2026-12-04').length,0);
    const liam=initial.data.presentations.find(p=>p.studentId==='liam');
    const olivia=initial.data.presentations.find(p=>p.studentId==='olivia');
    const move=(presentation,date,startTime,endTime,version=presentation.version)=>request('/presentations/'+presentation.id,'PATCH',{date,startTime,endTime,version});
    assert.equal((await move(liam,'2026-12-04','09:00','09:30')).status,401);
    for(const s of SCHEDULE_STUDENTS)assert.deepEqual(initial.data.presentations.filter(p=>p.studentId===s.id).map(p=>p.date).sort(),BALANCED_PRESENTATIONS.filter(p=>p.studentId===s.id).map(p=>p.date).sort());
    assert.equal(initial.data.students.find(s=>s.id==='abbey').notes,'Away on 6 November.');
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:'2026-11-13'})).status,401);
    const student=initial.data.students.find(s=>s.id==='cyril');
    assert.equal((await request('/students/cyril','PATCH',{unit:'ICTAII401 · <script>example</script>',version:student.version})).status,200);
    assert.equal((await request('/students/cyril','PATCH',{unit:'overwrite',version:student.version})).status,409);
    assert.equal((await request('/students/cyril','PATCH',{unit:'x'.repeat(161),version:2})).status,400);
    assert.equal((await request('/students/cyril','PATCH',{unit:'untrusted',version:2},{origin:'https://untrusted.example'})).status,403);
    assert.equal((await request('/admin/login','POST',{pin:'wrong'})).status,401);
    const login=await request('/admin/login','POST',{pin:'573829'});assert.equal(login.status,200);assert.ok(login.cookie.includes('HttpOnly'));assert.ok(login.cookie.includes('SameSite=Strict'));cookie=login.cookie.split(';')[0];
    assert.equal((await request()).data.admin,true);
    // Moving a December delivery updates the same record and preserves all counts/units.
    const movedLiam=await move(liam,'2026-12-04','09:00','09:30');assert.equal(movedLiam.status,200);assert.equal(movedLiam.data.id,liam.id);
    assert.equal((await move(liam,'2026-12-04','09:40','10:10')).status,409);
    const tooClose=await move(olivia,'2026-12-04','09:35','10:05');assert.equal(tooClose.status,409);assert.equal(tooClose.data.code,'overlap');
    const movedOlivia=await move(olivia,'2026-12-04','09:40','10:10');assert.equal(movedOlivia.status,200);
    const anotherLiam=initial.data.presentations.find(p=>p.studentId==='liam'&&p.id!==liam.id);
    const duplicate=await move(anotherLiam,'2026-12-04','10:20','10:50');assert.equal(duplicate.status,409);assert.match(duplicate.data.error,/already has a presentation/);
    const moved=await request();assert.equal(moved.data.presentations.length,57);
    for(const s of moved.data.students)assert.equal(moved.data.presentations.filter(p=>p.studentId===s.id).length,3,s.id);
    assert.ok(!moved.data.presentations.some(p=>p.studentId===liam.studentId&&p.date===liam.date));
    assert.equal(moved.data.students.find(s=>s.id==='cyril').unit,'ICTAII401 · <script>example</script>');
    assert.equal((await move(olivia,olivia.date,olivia.startTime,olivia.endTime,movedOlivia.data.version)).status,200);
    assert.equal((await move(liam,liam.date,liam.startTime,liam.endTime,movedLiam.data.version)).status,200);
    const restored=await request();assert.ok(restored.data.dates.includes('2026-12-04'));assert.ok(!restored.data.presentations.some(p=>p.date==='2026-12-04'));
    // A full six-person day cannot accept a seventh, even with a time override.
    const abbey=initial.data.presentations.find(p=>p.studentId==='abbey');
    const full=await request('/presentations/'+abbey.id,'PATCH',{date:'2026-11-06',startTime:'09:00',endTime:'09:30',version:abbey.version,allowOverlap:true});
    assert.equal(full.status,409);assert.match(full.data.error,/six presentations/);
    assert.equal((await request('/presentations','POST',{studentId:'abbey',date:'2026-11-06',startTime:'09:00',endTime:'09:30',allowOverlap:true})).status,409);
    const session=initial.data.presentations.find(p=>p.studentId==='rachel');
    const updated=await request('/presentations/'+session.id,'PATCH',{date:session.date,startTime:'09:00',endTime:'09:30',version:session.version});assert.equal(updated.status,200);
    assert.equal((await request('/presentations/'+session.id,'PATCH',{date:session.date,startTime:'09:00',endTime:'09:30',version:session.version})).status,409);
    for(const date of ['2026-13-01','2026-02-30','2025-11-06']) assert.equal((await request('/presentations','POST',{studentId:'rachel',date})).status,400);
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:'2026-11-13',startTime:'10:00'})).status,400);
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:session.date,startTime:'09:00',endTime:'09:30'})).status,409);
    const ali=initial.data.presentations.find(p=>p.studentId==='ali'&&p.date===session.date);
    const shortBreak=await request('/presentations/'+ali.id,'PATCH',{date:ali.date,startTime:'09:35',endTime:'10:05',version:ali.version});assert.equal(shortBreak.status,409);assert.equal(shortBreak.data.code,'overlap');
    const overlap=await request('/presentations/'+ali.id,'PATCH',{date:ali.date,startTime:'09:15',endTime:'09:45',version:ali.version});assert.equal(overlap.status,409);assert.equal(overlap.data.code,'overlap');
    const savedOverlap=await request('/presentations/'+ali.id,'PATCH',{date:ali.date,startTime:'09:15',endTime:'09:45',version:ali.version,allowOverlap:true});assert.equal(savedOverlap.status,200);
    const reported=(await request()).data.conflicts;assert.equal(reported.length,1);assert.equal(reported[0].group,1);assert.equal(reported[0].date,ali.date);
    assert.deepEqual(reported[0].presentationIds,[ali.id,session.id].sort());assert.equal(reported[0].startTime,'09:15');assert.equal(reported[0].endTime,'09:30');
    const otherGroup=initial.data.presentations.find(p=>p.studentId==='carly'&&p.date===session.date);
    assert.equal((await request('/presentations/'+otherGroup.id,'PATCH',{date:otherGroup.date,startTime:'09:00',endTime:'09:30',version:otherGroup.version})).status,200);
    assert.equal((await request()).data.conflicts.length,1,'simultaneous presentations in another group are allowed');
    assert.equal((await request('/presentations/'+ali.id,'PATCH',{date:ali.date,startTime:ali.startTime,endTime:ali.endTime,version:savedOverlap.data.version})).status,200);
    assert.deepEqual((await request()).data.conflicts,[],'the warning clears once the clash is corrected');
    for(const [startTime,endTime] of [['08:30','09:00'],['12:45','13:15'],['09:00','09:45']])assert.equal((await request('/presentations','POST',{studentId:'rachel',date:'2026-11-27',startTime,endTime})).status,400);
    const added=await request('/presentations','POST',{studentId:'rachel',date:'2026-11-27',startTime:'09:00',endTime:'09:30',allowOverlap:true});assert.equal(added.status,201);
    assert.equal((await request()).data.presentations.filter(p=>p.studentId==='rachel').length,4);
    assert.equal((await request('/presentations/'+added.data.id,'DELETE',{version:added.data.version})).status,200);
    assert.equal((await request()).data.presentations.filter(p=>p.studentId==='rachel').length,3);
    const changes=await request('/admin/history');assert.equal(changes.status,200);assert.ok(changes.data.length>=6);
    const removed=initial.data.presentations.find(p=>p.studentId==='rachel'&&p.date==='2026-11-13');
    assert.equal((await request('/presentations/'+removed.id,'DELETE',{version:removed.version})).status,200);
    // Reopening the store must retain edits and never reapply the correction.
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    const persisted=await store.query('SELECT unit FROM schedule.students WHERE id=$1',['cyril']);assert.equal(persisted.rows[0].unit,'ICTAII401 · <script>example</script>');
    const times=await store.query('SELECT start_time::text FROM schedule.presentations WHERE id=$1',[session.id]);assert.equal(times.rows[0].start_time,'09:00:00');
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.presentations')).rows[0].count),56);
    assert.equal((await store.query('SELECT id FROM schedule.presentations WHERE id=$1',[removed.id])).rowCount,0);
    assert.equal((await store.query('SELECT id FROM schedule.imports WHERE id=$1',[REBALANCE_ID])).rowCount,1);
    assert.equal((await request('/admin/logout','POST',{})).status,200);
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:'2026-11-13'})).status,401);
  } finally {
    await new Promise(r=>server.close(r));
    await store.query(`DROP SCHEMA ${schema} CASCADE`);await store.close();
  }
});

test('an existing photographed schedule is corrected once without changing unit names', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
  const schema='schedule_migration_'+crypto.randomBytes(6).toString('hex');
  let store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
  try{
    const source=SCHEDULE_STUDENTS.flatMap(s=>s.dates.map(date=>({id:s.id+'-'+date,studentId:s.id,date})));
    await store.transaction(async query=>{
      await query('DELETE FROM schedule.presentations');
      await query(`INSERT INTO schedule.presentations(id,student_id,day)
        SELECT id,student_id,day::date FROM unnest($1::text[],$2::text[],$3::text[]) AS original(id,student_id,day)`,
        [source.map(p=>p.id),source.map(p=>p.studentId),source.map(p=>p.date)]);
      await query('DELETE FROM schedule.imports WHERE id=$1',[REBALANCE_ID]);
      await query("UPDATE schedule.students SET unit='Keep this entered unit' WHERE id='cyril'");
    });
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.presentations')).rows[0].count),48);
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    assert.equal((await store.query("SELECT unit FROM schedule.students WHERE id='cyril'")).rows[0].unit,'Keep this entered unit');
    const rows=(await store.query('SELECT student_id,count(*) FROM schedule.presentations GROUP BY student_id')).rows;
    assert.equal(rows.length,19);assert.ok(rows.every(r=>Number(r.count)===3));
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.presentations')).rows[0].count),57);
    const changes=Number((await store.query('SELECT count(*) FROM schedule.changes')).rows[0].count);
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.changes')).rows[0].count),changes);
  }finally{await store.query(`DROP SCHEMA ${schema} CASCADE`);await store.close();}
});
