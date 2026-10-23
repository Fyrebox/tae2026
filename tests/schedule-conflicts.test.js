import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleConflicts } from '../schedule-conflicts.js';

const students=[{id:'a',name:'Rachel',group:1},{id:'b',name:'Sam',group:1},{id:'c',name:'Carly',group:2},{id:'d',name:'Ali',group:1}];
const p=(id,studentId,startTime='09:00',endTime='09:30',date='2026-11-06')=>({id,studentId,date,startTime,endTime});

test('exact clashes contain the group, date, people, full ranges and overlap interval',()=>{
  const rows=[p('rachel','a'),p('sam','b'),p('carly','c')];
  const conflicts=scheduleConflicts(rows,students);assert.equal(conflicts.length,1);
  assert.deepEqual(conflicts[0],{group:1,date:'2026-11-06',presentationIds:['rachel','sam'],startTime:'09:00',endTime:'09:30',presentations:[{id:'rachel',studentId:'a',name:'Rachel',startTime:'09:00',endTime:'09:30'},{id:'sam',studentId:'b',name:'Sam',startTime:'09:00',endTime:'09:30'}]});
  assert.deepEqual(scheduleConflicts([...rows].reverse(),students),conflicts);
});

test('partial, contained and multiple overlaps are reported once per pair',()=>{
  const rows=[p('one','a','09:00','10:00'),p('two','b','09:15','09:45'),p('three','d','09:30','10:00')];
  const conflicts=scheduleConflicts(rows,students);assert.equal(conflicts.length,3);
  assert.equal(new Set(conflicts.map(c=>c.presentationIds.join(':'))).size,3);
  const partial=scheduleConflicts([p('a','a'),p('b','b','09:15','09:45')],students);
  assert.equal(partial[0].startTime,'09:15');assert.equal(partial[0].endTime,'09:30');
});

test('different groups/dates, adjacent sessions, short breaks and missing times are not clashes',()=>{
  for(const other of [p('b','c'),p('b','b','09:00','09:30','2026-11-13'),p('b','b','09:30','10:00'),p('b','b','09:35','10:05'),p('b','b',null,null),p('b','b','09:00',null),p('b','b','09:00','09:00'),p('b','unknown')]){
    assert.deepEqual(scheduleConflicts([p('a','a'),other],students),[],JSON.stringify(other));
  }
  assert.deepEqual(scheduleConflicts([],students),[]);
});
