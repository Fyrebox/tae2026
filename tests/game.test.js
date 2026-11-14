import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Story } from 'inkjs';

process.env.HOST_PIN = '424242';
const { GAMES, compileStory, storySource, levelsOf, createGameRouter } = await import('../games.js');

const FACES = ['happy', 'worried', 'thinking', 'surprised'];
const SCENES = ['desk', 'office', 'colour', 'station', 'bedside', 'kitchen', 'dining'];
const ID = 'learner-0001';

// Play to the end. pick(story) chooses the choice index at each choice point.
function play(json, pick, cap = 3000) {
  const story = new Story(json);
  const lines = [];
  for (let steps = 0; steps < cap; steps++) {
    while (story.canContinue) lines.push({ text: story.Continue().trim(), tags: story.currentTags });
    if (!story.currentChoices.length) return { story, lines };
    story.ChooseChoiceIndex(pick(story));
  }
  throw new Error('The story did not end');
}

// The choice whose reply is not tagged "bad": the right answer.
function rightChoice(story) {
  const saved = story.state.toJson();
  for (let i = 0; i < story.currentChoices.length; i++) {
    story.ChooseChoiceIndex(i);
    const tags = [];
    while (story.canContinue) { story.Continue(); tags.push(...story.currentTags); }
    story.state.LoadJson(saved);
    if (!tags.includes('bad')) return i;
  }
  throw new Error('No right answer at this point');
}

for (const [key, game] of Object.entries(GAMES)) {
  const source = storySource(key);
  const json = compileStory(source);

  test(`${key}: the story compiles, and only uses known people, faces and scenes`, () => {
    const levels = levelsOf(source);
    assert.ok(levels.length >= 8, levels.join(', '));
    assert.equal(levels.at(-1), 'Send it');
    assert.ok(levels.includes(game.pitchLevel));
    for (const [, who, face] of source.matchAll(/#\s*(\w+):(\w+)/g)) {
      if (['scene', 'level', 'show', 'clock'].includes(who)) continue;
      assert.ok(game.cast[who], `unknown speaker ${who}`);
      assert.ok(FACES.includes(face), `unknown face ${face}`);
    }
    for (const [, scene] of source.matchAll(/#\s*scene:(\w+)/g)) assert.ok(SCENES.includes(scene), scene);
    for (const [, panel] of source.matchAll(/#\s*show:(\w+)/g)) assert.ok(['policy', 'cards', 'compare', 'pitch'].includes(panel), panel);
    assert.deepEqual(game.cards.map((c) => c.type), ['AI', 'ML', 'DL']);
  });

  test(`${key}: every random playthrough reaches 5 pm with a full recommendation`, () => {
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let run = 0; run < 300; run++) {
      const { story } = play(json, (s) => Math.floor(rand() * s.currentChoices.length));
      const v = (n) => story.variablesState[n];
      assert.ok(game.startable.includes(v('start')), `run ${run}`);
      for (const k of ['start_why', 'start_fix', 'feedback', 'change', 'ai_goal', 'ai_risk', 'ml_goal', 'ml_risk', 'dl_goal', 'dl_risk']) assert.ok(v(k), `run ${run}: ${k}`);
      assert.ok(v('score') <= v('total'));
    }
  });

  test(`${key}: right answers every time score full marks, and every question has exactly one wrong-free path`, () => {
    const { story, lines } = play(json, rightChoice);
    assert.equal(story.variablesState.score, story.variablesState.total);
    assert.ok(story.variablesState.total >= 20);
    assert.ok(!lines.some((l) => l.tags.includes('bad')));
  });
}

async function serve() {
  const app = express();
  app.use('/api/game', createGameRouter());
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api/game`;
  const call = (p, { body, pin } = {}) => fetch(base + p, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(pin ? { 'x-host-pin': pin } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { call, close: () => new Promise((r) => server.close(r)) };
}

test('the game API tracks levels, takes the sent recommendation and keeps the host view behind the PIN', async () => {
  const { call, close } = await serve();
  try {
    assert.equal((await call('/hairdresser/progress', { body: { id: ID, level: 'Compare', score: 5, total: 7 } })).status, 200);
    for (const bad of [{ id: 'x', level: 'Compare', score: 1, total: 1 }, { id: ID, level: 'Nope', score: 1, total: 1 },
      { id: ID, level: 'Compare', score: 3, total: 2 }, { id: ID, level: 'Compare', score: -1, total: 2 }]) {
      assert.equal((await call('/hairdresser/progress', { body: bad })).status, 400, JSON.stringify(bad));
    }
    assert.equal((await call('/nogame/progress', { body: { id: ID, level: 'Compare', score: 1, total: 1 } })).status, 404);

    const answers = { start: 'ml', start_why: 'Biggest cost', start_fix: 'A person decides', feedback: 'Trial', change: 'x'.repeat(500), ml_risk: 'Bias', extra: 'dropped' };
    assert.equal((await call('/hairdresser/submit', { body: { id: ID, name: '', score: 20, total: 23, answers } })).status, 400);
    assert.equal((await call('/hairdresser/submit', { body: { id: ID, name: 'Sam', score: 20, total: 23, answers: { ...answers, start: 'dl' } } })).status, 400);
    assert.equal((await call('/hairdresser/submit', { body: { id: ID, name: ' Sam ', score: 20, total: 23, answers } })).status, 200);

    assert.equal((await call('/hairdresser/host')).status, 401);
    assert.equal((await call('/hairdresser/host', { pin: '0000' })).status, 401);
    const host = await (await call('/hairdresser/host', { pin: '424242' })).json();
    assert.equal(host.learners.length, 1);
    const [l] = host.learners;
    assert.equal(l.name, 'Sam');
    assert.equal(l.level, 'Send it');
    assert.equal(l.answers.change.length, 300);
    assert.equal(l.answers.extra, undefined);
    // Playing again after sending does not change the score that was sent.
    assert.equal((await call('/hairdresser/progress', { body: { id: ID, level: 'Spot it', score: 0, total: 1 } })).status, 200);
    const again = (await (await call('/hairdresser/host', { pin: '424242' })).json()).learners[0];
    assert.deepEqual([again.sentScore, again.sentTotal, again.name], [20, 23, 'Sam']);

    assert.equal((await call('/hairdresser/host/reset', { body: {}, pin: '424242' })).status, 200);
    assert.equal((await (await call('/hairdresser/host', { pin: '424242' })).json()).learners.length, 0);
  } finally {
    await close();
  }
});
