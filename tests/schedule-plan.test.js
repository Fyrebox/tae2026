import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEDULE_STUDENTS, SCHEDULE_DATES } from '../schedule-data.js';
import { BALANCED_PRESENTATIONS } from '../schedule-plan.js';
const minutes = time => Number(time.slice(0,2))*60+Number(time.slice(3));

test('everyone has three deliveries with only the minimum changes to photographed days',()=>{
  assert.equal(BALANCED_PRESENTATIONS.length,57);
  let removed=0,added=0;
  for(const student of SCHEDULE_STUDENTS){
    const actual=BALANCED_PRESENTATIONS.filter(p=>p.studentId===student.id);
    assert.equal(actual.length,3,student.id);
    assert.equal(new Set(actual.map(p=>p.date)).size,3,student.id);
    const missing=student.dates.filter(d=>!actual.some(p=>p.date===d)).length;
    const extra=actual.filter(p=>!student.dates.includes(p.date)).length;
    assert.equal(missing,student.dates.length===4?1:0,student.id);
    assert.equal(extra,student.dates.length===2?1:0,student.id);
    removed+=missing;added+=extra;
  }
  assert.equal(removed,5);assert.equal(added,14);
  assert.ok(!BALANCED_PRESENTATIONS.some(p=>p.studentId==='abbey'&&p.date==='2026-11-06'));
});

test('every group/day spans 9–13 with 30-minute sessions and ten-minute minimum breaks',()=>{
  for(const group of [1,2,3])for(const date of SCHEDULE_DATES){
    const day=BALANCED_PRESENTATIONS.filter(p=>p.group===group&&p.date===date).sort((a,b)=>a.startTime.localeCompare(b.startTime));
    assert.ok(day.length>=4&&day.length<=6);
    assert.equal(day[0].startTime,'09:00');assert.equal(day.at(-1).endTime,'13:00');
    for(let i=0;i<day.length;i++){
      assert.equal(minutes(day[i].endTime)-minutes(day[i].startTime),30);
      assert.equal(minutes(day[i].startTime)%5,0);
      if(i)assert.ok(minutes(day[i].startTime)-minutes(day[i-1].endTime)>=10);
    }
  }
  const daily=SCHEDULE_DATES.map(date=>BALANCED_PRESENTATIONS.filter(p=>p.date===date).length).sort();
  assert.deepEqual(daily,[14,14,14,15]);
});
