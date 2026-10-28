import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.HOST_PIN = '424242';
const { createPickRouter } = await import('../pick.js');
const { ACTIVITIES } = await import('../pick-decks.js');
const { createReportRouter, cleanSubmission } = await import('../report.js');
const { REPORT, FIELDS } = await import('../report-form.js');

async function serve(path, router) {
  const app = express();
  app.use(path, router);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}${path}`;
  const call = (p, { body, pin, method } = {}) => fetch(base + p, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'content-type': 'application/json', ...(pin ? { 'x-host-pin': pin } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { call, close: () => new Promise((r) => server.close(r)) };
}

const ID = 'learner-0001';
const ticks = REPORT.checklist.map(() => true);

test('every activity item has a valid answer and an explanation', () => {
  for (const [key, a] of Object.entries(ACTIVITIES)) {
    const options = new Set(a.options.map((o) => o.id));
    assert.ok(a.items.length >= 6, key);
    assert.equal(new Set(a.items.map((i) => i.id)).size, a.items.length, key);
    for (const i of a.items) {
      assert.ok(options.has(i.answer), `${key}/${i.id}`);
      assert.ok(i.why.length > 10, `${key}/${i.id}`);
    }
  }
});

test('pick activity counts first answers only and reports class results to the host', async () => {
  const { call, close } = await serve('/api/pick', createPickRouter());
  try {
    assert.equal((await call('/tech/join', { body: { id: ID } })).status, 200);
    assert.equal((await call('/tech/answer', { body: { id: ID, item: 'junk', answer: 'ml' } })).status, 200);
    assert.equal((await call('/tech/answer', { body: { id: ID, item: 'junk', answer: 'dl' } })).status, 200);
    assert.equal((await call('/tech/answer', { body: { id: ID, item: 'junk', answer: 'nope' } })).status, 400);
    assert.equal((await call('/tech/answer', { body: { id: ID, item: 'nope', answer: 'ml' } })).status, 400);
    assert.equal((await call('/tech/answer', { body: { id: 'bad id!', item: 'junk', answer: 'ml' } })).status, 400);
    assert.equal((await call('/nope/join', { body: { id: ID } })).status, 404);

    assert.equal((await call('/tech/host/stats')).status, 401);
    assert.equal((await call('/tech/host/stats', { pin: 'wrong' })).status, 401);
    const stats = await (await call('/tech/host/stats', { pin: '424242' })).json();
    assert.equal(stats.joined, 1);
    assert.equal(stats.started, 1);
    assert.equal(stats.finished, 0);
    assert.equal(stats.total, ACTIVITIES.tech.items.length);
    const junk = stats.items.find((i) => i.id === 'junk');
    assert.deepEqual(junk.counts, { rule: 0, ml: 1, dl: 0, manual: 0 });

    // Activities are separate: the Session 2 activity has no learners yet.
    assert.equal((await (await call('/tasks/host/stats', { pin: '424242' })).json()).joined, 0);

    for (const i of ACTIVITIES.tech.items) await call('/tech/answer', { body: { id: ID, item: i.id, answer: i.answer } });
    const done = await (await call('/tech/host/stats', { pin: '424242' })).json();
    assert.equal(done.finished, 1);
    assert.equal(done.avgScore, ACTIVITIES.tech.items.length); // junk was first answered correctly

    assert.equal((await call('/tech/host/reset', { method: 'POST', pin: '424242' })).status, 200);
    assert.equal((await (await call('/tech/host/stats', { pin: '424242' })).json()).joined, 0);
  } finally {
    await close();
  }
});

test('report submissions are validated', () => {
  const ok = cleanSubmission({ name: ' Sam ', fields: { s1_task: 'Find AI options', s1_due: '  ', s3_junk_class: 'ML' }, checklist: ticks });
  assert.deepEqual(ok, { name: 'Sam', fields: { s1_task: 'Find AI options', s3_junk_class: 'ML' }, checklist: ticks });
  const bad = [
    { name: '', fields: {}, checklist: ticks },
    { name: 'x'.repeat(61), fields: {}, checklist: ticks },
    { name: 'Sam', fields: [], checklist: ticks },
    { name: 'Sam', fields: {}, checklist: ticks.slice(1) },
    { name: 'Sam', fields: {}, checklist: [false, ...ticks.slice(1)] },
    { name: 'Sam', fields: { unknown: 'x' }, checklist: ticks },
    { name: 'Sam', fields: { s1_task: 5 }, checklist: ticks },
    { name: 'Sam', fields: { s1_due: 'x'.repeat(301) }, checklist: ticks },
    { name: 'Sam', fields: { s3_junk_class: 'Magic' }, checklist: ticks },
  ];
  for (const b of bad) assert.equal(cleanSubmission(b), null, JSON.stringify(b).slice(0, 80));
  assert.ok(FIELDS.size > 80);
});

test('reports are submitted, replaced on resubmission and readable only with the host PIN', async () => {
  const { call, close } = await serve('/api/report', createReportRouter());
  try {
    const body = { id: ID, name: 'Sam', fields: { s1_task: 'Draft' }, checklist: ticks };
    assert.equal((await call('/submit', { body })).status, 200);
    assert.equal((await call('/submit', { body: { ...body, id: 'no' } })).status, 400);
    assert.equal((await call('/submit', { body: { ...body, checklist: [] } })).status, 400);
    assert.equal((await call('/submit', { body: { ...body, fields: { s1_task: 'Final' } } })).status, 200);

    assert.equal((await call('/host/list')).status, 401);
    const { reports } = await (await call('/host/list', { pin: '424242' })).json();
    assert.equal(reports.length, 1);
    assert.equal(reports[0].name, 'Sam');
    assert.equal(reports[0].count, 2);
    assert.equal(reports[0].filled, 1);

    assert.equal((await call('/host/report/' + ID)).status, 401);
    const report = await (await call('/host/report/' + ID, { pin: '424242' })).json();
    assert.equal(report.fields.s1_task, 'Final');
    assert.equal((await call('/host/report/missing-0001', { pin: '424242' })).status, 404);

    assert.equal((await call('/host/reset', { method: 'POST', pin: '424242' })).status, 200);
    assert.equal((await (await call('/host/list', { pin: '424242' })).json()).reports.length, 0);
  } finally {
    await close();
  }
});
