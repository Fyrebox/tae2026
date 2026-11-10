import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

const { createChatRouter } = await import('../chat.js');

async function serve(router) {
  const app = express();
  app.use('/api/chat', router);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/api/chat`;
  const post = (body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { post, close: () => new Promise((r) => server.close(r)) };
}

const ID = 'learner-0001';
const q = (content) => ({ role: 'user', content });

test('the AI chat answers, keeps the conversation and refuses personal information', async () => {
  const seen = [];
  const { post, close } = await serve(createChatRouter({ ask: async (messages) => { seen.push(messages); return `Answer ${messages.length}`; } }));
  try {
    let res = await post({ id: ID, messages: [q('How could Bellarine start using Power BI?')] });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { answer: 'Answer 1' });

    res = await post({ id: ID, messages: [q('First?'), { role: 'assistant', content: 'Answer 1' }, q('And the cost?')] });
    assert.equal((await res.json()).answer, 'Answer 3');
    assert.deepEqual(seen[1].map((m) => m.role), ['user', 'assistant', 'user']);

    for (const text of ['Email me at sam@example.com', 'Call 0412 345 678', 'Ring +61 3 5555 1234', 'Phone (03) 5555 1234', 'Mobile 0412345678']) {
      res = await post({ id: ID, messages: [q(text)] });
      assert.equal(res.status, 400, text);
      assert.match((await res.json()).error, /personal information/);
    }
    assert.equal(seen.length, 2); // refused questions never reach the AI

    for (const bad of [{ messages: [q('Hi')] }, { id: ID, messages: [] }, { id: ID, messages: [{ role: 'assistant', content: 'x' }] },
      { id: ID, messages: [q('x'.repeat(1001))] }, { id: ID, messages: Array.from({ length: 9 }, (_, i) => (i % 2 ? { role: 'assistant', content: 'a' } : q('b'))) }]) {
      assert.equal((await post(bad)).status, 400, JSON.stringify(bad).slice(0, 60));
    }
  } finally {
    await close();
  }
});

test('each learner gets 10 questions every 10 minutes, and AI failures say so without details', async () => {
  let t = 0;
  const { post, close } = await serve(createChatRouter({ ask: async () => 'ok', now: () => t }));
  try {
    for (let i = 0; i < 10; i++) assert.equal((await post({ id: ID, messages: [q('Hello')] })).status, 200);
    assert.equal((await post({ id: ID, messages: [q('Hello')] })).status, 429);
    assert.equal((await post({ id: 'learner-0002', messages: [q('Hello')] })).status, 200);
    t += 10 * 60 * 1000;
    assert.equal((await post({ id: ID, messages: [q('Hello')] })).status, 200);
  } finally {
    await close();
  }
  const broken = await serve(createChatRouter({ ask: async () => { throw Object.assign(new Error('Incorrect API key sk-123'), { status: 401 }); } }));
  try {
    const res = await broken.post({ id: ID, messages: [q('Hello')] });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.fallback, true);
    assert.doesNotMatch(body.error, /sk-|key/i);
  } finally {
    await broken.close();
  }
});
