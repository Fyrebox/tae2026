import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'node:crypto';
import { createScheduleStore } from '../schedule-db.js';
import { createScheduleRouter } from '../schedule.js';
import { SCHEDULE_STUDENTS } from '../schedule-data.js';

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
    const initial=await request();assert.equal(initial.status,200);assert.equal(initial.data.students.length,19);assert.equal(initial.data.presentations.length,48);assert.equal(initial.data.admin,false);
    for(const s of SCHEDULE_STUDENTS)assert.deepEqual(initial.data.presentations.filter(p=>p.studentId===s.id).map(p=>p.date).sort(),s.dates);
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
    const session=initial.data.presentations.find(p=>p.studentId==='rachel');
    const updated=await request('/presentations/'+session.id,'PATCH',{date:session.date,startTime:'09:00',endTime:'09:30',version:session.version});assert.equal(updated.status,200);
    assert.equal((await request('/presentations/'+session.id,'PATCH',{date:session.date,version:1})).status,409);
    for(const date of ['2026-13-01','2026-02-30','2025-11-06']) assert.equal((await request('/presentations','POST',{studentId:'rachel',date})).status,400);
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:'2026-11-13',startTime:'10:00'})).status,400);
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:session.date})).status,409);
    const ali=initial.data.presentations.find(p=>p.studentId==='ali'&&p.date===session.date);
    const overlap=await request('/presentations/'+ali.id,'PATCH',{date:ali.date,startTime:'09:15',endTime:'09:45',version:ali.version});assert.equal(overlap.status,409);assert.equal(overlap.data.code,'overlap');
    assert.equal((await request('/presentations/'+ali.id,'PATCH',{date:ali.date,startTime:'09:15',endTime:'09:45',version:ali.version,allowOverlap:true})).status,200);
    const otherGroup=initial.data.presentations.find(p=>p.studentId==='carly'&&p.date===session.date);
    assert.equal((await request('/presentations/'+otherGroup.id,'PATCH',{date:otherGroup.date,startTime:'09:00',endTime:'09:30',version:otherGroup.version})).status,200);
    const added=await request('/presentations','POST',{studentId:'rachel',date:'2026-11-13'});assert.equal(added.status,201);
    assert.equal((await request()).data.presentations.filter(p=>p.studentId==='rachel').length,3);
    assert.equal((await request('/presentations/'+added.data.id,'DELETE',{version:added.data.version})).status,200);
    assert.equal((await request()).data.presentations.filter(p=>p.studentId==='rachel').length,2);
    const changes=await request('/admin/history');assert.equal(changes.status,200);assert.ok(changes.data.length>=6);
    // Reopening the store must retain edits and never reseed a removed assignment.
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    const persisted=await store.query('SELECT unit FROM schedule.students WHERE id=$1',['cyril']);assert.equal(persisted.rows[0].unit,'ICTAII401 · <script>example</script>');
    const times=await store.query('SELECT start_time::text FROM schedule.presentations WHERE id=$1',[session.id]);assert.equal(times.rows[0].start_time,'09:00:00');
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.presentations')).rows[0].count),48);
    assert.equal((await request('/admin/logout','POST',{})).status,200);
    assert.equal((await request('/presentations','POST',{studentId:'rachel',date:'2026-11-13'})).status,401);
  } finally {
    await new Promise(r=>server.close(r));
    await store.query(`DROP SCHEMA ${schema} CASCADE`);await store.close();
  }
});
