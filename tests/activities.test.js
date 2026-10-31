import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.HOST_PIN = '424242';
const { createPickRouter } = await import('../pick.js');
const { default: sortRouter } = await import('../sort.js');
const { DECK } = await import('../sort-deck.js');
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

test('every /tech answer can be saved in report section 3', () => {
  const labels = Object.fromEntries(ACTIVITIES.tech.options.map((o) => [o.id, o.label]));
  const group = REPORT.sections.find((s) => s.n === 3).groups.find((g) => g.activity === 'tech');
  assert.deepEqual(group.fields.filter((f) => f.item).map((f) => f.item).sort(), ACTIVITIES.tech.items.map((i) => i.id).sort());
  assert.equal(group.fields.filter((f) => f.firstTry).length, 1);
  for (const i of ACTIVITIES.tech.items) {
    const field = FIELDS.get(`s3_${i.id}_class`);
    assert.ok(field, i.id);
    assert.equal(field.item, i.id);
    for (const label of Object.values(labels)) assert.ok(field.options.includes(label), `${i.id}: ${label}`);
  }
});

test('pick activity counts the latest answer when retries are allowed, otherwise the first, and reports class results to the host', async () => {
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
    assert.deepEqual(junk.counts, { rule: 0, ml: 0, dl: 1, manual: 0 }); // tech allows retries: the latest answer counts

    // Activities are separate: the Session 2 activity has no learners yet, and it keeps the first answer.
    assert.equal((await (await call('/tasks/host/stats', { pin: '424242' })).json()).joined, 0);
    await call('/tasks/join', { body: { id: ID } });
    await call('/tasks/answer', { body: { id: ID, item: 'email', answer: 'campaign' } });
    await call('/tasks/answer', { body: { id: ID, item: 'email', answer: 'chatbot' } });
    const email = (await (await call('/tasks/host/stats', { pin: '424242' })).json()).items.find((i) => i.id === 'email');
    assert.equal(email.counts.campaign, 1);
    assert.equal(email.counts.chatbot, 0);

    for (const i of ACTIVITIES.tech.items) await call('/tech/answer', { body: { id: ID, item: i.id, answer: i.answer } });
    const done = await (await call('/tech/host/stats', { pin: '424242' })).json();
    assert.equal(done.finished, 1);
    assert.equal(done.avgScore, ACTIVITIES.tech.items.length); // the retry fixed junk

    assert.equal((await call('/tech/host/reset', { method: 'POST', pin: '424242' })).status, 200);
    assert.equal((await (await call('/tech/host/stats', { pin: '424242' })).json()).joined, 0);
  } finally {
    await close();
  }
});

test('report submissions are validated', () => {
  const ok = cleanSubmission({ name: ' Sam ', fields: { s1_task: 'Find AI options', s1_who: '  ', s3_junk_class: 'ML', s2_rank_missed: '2' }, checklist: ticks });
  assert.deepEqual(ok, { name: 'Sam', fields: { s1_task: 'Find AI options', s3_junk_class: 'ML', s2_rank_missed: '2' }, checklist: ticks });
  const bad = [
    { name: '', fields: {}, checklist: ticks },
    { name: 'x'.repeat(61), fields: {}, checklist: ticks },
    { name: 'Sam', fields: [], checklist: ticks },
    { name: 'Sam', fields: {}, checklist: ticks.slice(1) },
    { name: 'Sam', fields: {}, checklist: [false, ...ticks.slice(1)] },
    { name: 'Sam', fields: { unknown: 'x' }, checklist: ticks },
    { name: 'Sam', fields: { s1_task: 5 }, checklist: ticks },
    { name: 'Sam', fields: { s1_who: 'x'.repeat(301) }, checklist: ticks },
    { name: 'Sam', fields: { s2_rank_missed: '5' }, checklist: ticks },
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

test('each session page has its own brief, and it matches the full work brief', async () => {
  const { readFile } = await import('node:fs/promises');
  const report = await readFile(new URL('../pages/report.html', import.meta.url), 'utf8');
  const brief = await readFile(new URL('../pages/bellarine.html', import.meta.url), 'utf8');
  const blocks = [...report.matchAll(/<section class="brief" data-sessions="([\d ]+)"/g)].map((m) => m[1].split(' '));
  for (const n of ['1', '2', '3']) assert.ok(blocks.some((b) => b.includes(n)), `no brief for session ${n}`);
  const items = (html, cls) => [...html.slice(html.indexOf(cls)).split('</ol>')[0].matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(items(report, '<ol class="policy">'), items(brief, '<h2 id="policy">'));
  for (const s of REPORT.sections) assert.ok(!/taegordon\.au/.test(s.intro || ''), `section ${s.n} intro sends learners off the page`);
});

test('Rule or AI? counts the latest answer, so retrying a wrong card improves the result', async () => {
  const { call, close } = await serve('/api/sort', sortRouter);
  try {
    await call('/host/reset', { method: 'POST', pin: '424242' });
    assert.equal((await call('/join', { body: { id: ID } })).status, 200);
    const [first, ...rest] = DECK;
    const wrong = first.answer === 'ai' ? 'rule' : 'ai';
    await call('/answer', { body: { id: ID, card: first.id, answer: wrong } });
    for (const c of rest) await call('/answer', { body: { id: ID, card: c.id, answer: c.answer } });
    let stats = await (await call('/host/stats', { pin: '424242' })).json();
    assert.equal(stats.avgScore, DECK.length - 1);
    await call('/answer', { body: { id: ID, card: first.id, answer: first.answer } });
    stats = await (await call('/host/stats', { pin: '424242' })).json();
    assert.equal(stats.avgScore, DECK.length);
    assert.equal(stats.cards.find((c) => c.id === first.id)[wrong], 0);
  } finally {
    await call('/host/reset', { method: 'POST', pin: '424242' });
    await close();
  }
});
