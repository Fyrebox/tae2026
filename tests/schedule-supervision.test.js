import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'node:crypto';
import { createScheduleStore } from '../schedule-db.js';
import { createScheduleRouter } from '../schedule.js';
import { DELIVERY_DATES } from '../schedule-data.js';
import { GROUP_DAY_IMPORT, initialGroupDays, inheritSupervision } from '../schedule-supervision.js';

const key=d=>d.group+':'+d.date;
test('the five delivery dates rotate one instructor or recording per group/day',()=>{
  const days=initialGroupDays(DELIVERY_DATES);
  assert.equal(days.length,15);
  const expected=[['matt','david','recorded'],['david','recorded','matt'],['recorded','matt','david'],['matt','david','recorded'],['david','recorded','matt']];
  DELIVERY_DATES.forEach((date,i)=>assert.deepEqual(days.filter(d=>d.date===date).map(d=>d.supervision),expected[i]));
  assert.ok(initialGroupDays(['2026-12-11']).every(d=>d.supervision==='recorded'));
});

test('presentations inherit group/day labels, including moves and repeated labels for a student',()=>{
  const days=initialGroupDays(DELIVERY_DATES),students=[{id:'a',group:1},{id:'b',group:1},{id:'c',group:2}];
  const rows=[{id:'a1',studentId:'a',date:'2026-11-06',supervision:'recorded'},{id:'a2',studentId:'a',date:'2026-11-27',supervision:'david'},{id:'b1',studentId:'b',date:'2026-11-06',supervision:'david'},{id:'c1',studentId:'c',date:'2026-11-06',supervision:'matt'}];
  assert.deepEqual(inheritSupervision(rows,students,days).map(p=>p.supervision),['matt','matt','matt','david']);
  assert.equal(inheritSupervision([{...rows[0],date:'2026-12-04'}],students,days)[0].supervision,'david');
  assert.equal(rows[0].supervision,'recorded','legacy values are retained for history, not used for display');
});

test('protected group/day edits, atomic swaps, inherited moves and one-time migration', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
  const schema='schedule_group_days_'+crypto.randomBytes(6).toString('hex');
  let store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
  const app=express();app.use('/api/schedule',createScheduleRouter({query:(...args)=>store.query(...args),transaction:fn=>store.transaction(fn)},{pin:'573829',secure:false}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api/schedule`;let cookie='';
  async function request(path='',method='GET',body){
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
  }
  const editDay=(day,supervision,extra={})=>request(`/group-days/${day.date}/${day.group}`,'PATCH',{supervision,version:day.version,...extra});
  const editPresentation=(p,extra={})=>request('/presentations/'+p.id,'PATCH',{date:p.date,startTime:p.startTime,endTime:p.endTime,version:p.version,...extra});
  function assertInheritance(data){
    const labels=new Map(data.groupDays.map(d=>[key(d),d.supervision]));
    const groups=new Map(data.students.map(s=>[s.id,s.group]));
    for(const p of data.presentations)assert.equal(p.supervision,labels.get(groups.get(p.studentId)+':'+p.date),p.id);
    for(const date of data.dates)for(const staff of ['matt','david'])assert.ok(data.groupDays.filter(d=>d.date===date&&d.supervision===staff).length<=1);
  }
  function assertPresentationData(before,after){
    assert.equal(after.presentations.length,before.presentations.length);assert.deepEqual(after.students,before.students);
    for(const p of after.presentations){const old=before.presentations.find(x=>x.id===p.id);assert.deepEqual({...p,supervision:null},{...old,supervision:null});}
  }
  try{
    const initial=(await request()).data;assert.equal(initial.presentations.length,57);assert.equal(initial.groupDays.length,15);assert.equal(initial.supervisionIssues,undefined);assertInheritance(initial);
    assert.ok(!initial.presentations.some(p=>p.date==='2026-12-04'));
    const day=initial.groupDays.find(d=>d.group===1&&d.date==='2026-11-06'),other=initial.groupDays.find(d=>d.group===2&&d.date===day.date);
    assert.equal((await editDay(day,'david')).status,401);
    const login=await request('/admin/login','POST',{pin:'573829'});cookie=login.cookie.split(';')[0];
    for(const body of [{supervision:'someone else',version:day.version},{supervision:null,version:day.version},{supervision:'matt',version:'1'}])assert.equal((await request('/group-days/2026-11-06/1','PATCH',body)).status,400);
    assert.equal((await request('/group-days/2026-02-30/1','PATCH',{supervision:'matt',version:1})).status,400);
    assert.equal((await request('/group-days/2026-11-06/4','PATCH',{supervision:'matt',version:1})).status,400);
    assert.equal((await editPresentation(initial.presentations[0],{supervision:'matt'})).status,400);
    const proposal=await editDay(day,'david');assert.equal(proposal.status,409);assert.equal(proposal.data.code,'group-supervision-swap');assert.equal(proposal.data.swapTarget.group,2);
    assert.deepEqual((await request()).data, {...initial,admin:true});
    assert.equal((await editDay(day,'david',{swapWith:{group:2,version:other.version-1}})).status,409);
    const swapped=await editDay(day,'david',{swapWith:{group:2,version:other.version}});assert.equal(swapped.status,200);assert.equal(swapped.data.groupDays.length,2);
    let current=(await request()).data;assertInheritance(current);assertPresentationData(initial,current);
    assert.equal(current.groupDays.find(d=>key(d)===key(day)).supervision,'david');assert.equal(current.groupDays.find(d=>key(d)===key(other)).supervision,'matt');
    assert.equal((await editDay(day,'recorded')).status,409);
    assert.equal((await editDay(current.groupDays.find(d=>key(d)===key(day)),'matt',{swapWith:{group:2,version:other.version}})).status,409);
    // Multiple groups may record, but the database also prevents duplicate instructors.
    assert.equal((await editDay(current.groupDays.find(d=>key(d)===key(day)),'recorded')).status,200);
    await assert.rejects(store.query("UPDATE schedule.group_days SET supervision='matt' WHERE group_number=3 AND day='2026-11-06'"),{code:'23505'});
    current=(await request()).data;assert.equal(current.groupDays.filter(d=>d.date===day.date&&d.supervision==='recorded').length,2);
    // Empty days have editable labels, and moved presentations inherit the destination.
    const december=current.groupDays.find(d=>d.group===1&&d.date==='2026-12-04'),decOther=current.groupDays.find(d=>d.group===3&&d.date===december.date);
    assert.equal((await editDay(december,'matt',{swapWith:{group:3,version:decOther.version}})).status,200);
    const liam=current.presentations.find(p=>p.studentId==='liam');assert.equal(liam.supervision,'david');
    const moved=await editPresentation(liam,{date:'2026-12-04',startTime:'09:00',endTime:'09:30'});assert.equal(moved.status,200);assert.equal(moved.data.id,liam.id);assert.equal(moved.data.supervision,'matt');
    current=(await request()).data;assertInheritance(current);assert.equal(current.presentations.length,57);assert.ok(current.students.every(s=>current.presentations.filter(p=>p.studentId===s.id).length===3));
    const added=await request('/presentations','POST',{studentId:'rachel',date:'2026-12-11',startTime:'09:00',endTime:'09:30'});assert.equal(added.status,201);assert.equal(added.data.supervision,'recorded');
    current=(await request()).data;assert.ok(current.dates.includes('2026-12-11'));assert.equal(current.groupDays.filter(d=>d.date==='2026-12-11').length,3);
    const custom=current.groupDays.find(d=>d.group===1&&d.date==='2026-12-11');assert.equal((await editDay(custom,'matt')).status,200);
    assert.equal((await request()).data.presentations.find(p=>p.id===added.data.id).supervision,'matt');
    assert.equal((await request('/presentations/'+added.data.id,'DELETE',{version:added.data.version})).status,200);
    const history=(await request('/admin/history')).data;assert.ok(history.some(c=>c.group===1&&c.name==='Group 1'&&c.action==='group supervision swapped'));
    // Simulate upgrading an edited timetable from the former individual label model.
    await store.transaction(async query=>{
      await query("UPDATE schedule.students SET unit='Keep this entered unit' WHERE id='cyril'");
      await query("UPDATE schedule.presentations SET supervision='matt'");
      await query('DELETE FROM schedule.group_days');
      await query('DELETE FROM schedule.imports WHERE id=$1',[GROUP_DAY_IMPORT]);
    });
    const beforeImport=(await request()).data;
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    current=(await request()).data;assertInheritance(current);assertPresentationData(beforeImport,current);
    for(const date of DELIVERY_DATES)for(const expected of initialGroupDays([date]))assert.equal(current.groupDays.find(d=>key(d)===key(expected)).supervision,expected.supervision);
    const changed=current.groupDays.find(d=>d.group===1&&d.date==='2026-12-04');assert.equal((await editDay(changed,'recorded')).status,200);
    const saved=(await request()).data;
    const auditCount=Number((await store.query('SELECT count(*) FROM schedule.changes')).rows[0].count);
    await store.close();store=await createScheduleStore(process.env.TEST_DATABASE_URL,schema);
    assert.deepEqual((await request()).data.groupDays,saved.groupDays);
    assert.equal(Number((await store.query('SELECT count(*) FROM schedule.changes')).rows[0].count),auditCount);
  }finally{
    await new Promise(r=>server.close(r));await store.query(`DROP SCHEMA ${schema} CASCADE`);await store.close();
  }
});
