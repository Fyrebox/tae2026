import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

process.env.HOST_PIN = '424242';
const { GAMES } = await import('../games.js');

// art.js is a browser script that sets window.GameArt; run it in a sandbox.
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../public/game/art.js', import.meta.url), 'utf8'), sandbox);
const art = sandbox.window.GameArt;

test('every game character is drawn, with the parts the animations move, in every face', () => {
  const looks = new Set(Object.values(GAMES).flatMap((g) => Object.values(g.cast).map((c) => c.look)));
  for (const look of looks) {
    assert.ok(art.looks.includes(look), `${look} has a drawing`);
    for (const face of art.faces) {
      const svg = art.person(look, face);
      for (const part of ['hair-back', 'body', 'hand', 'head', 'blink', 'mouth']) assert.match(svg, new RegExp(`class="${part}"`), `${look} ${face}: ${part}`);
      assert.match(svg, /^<svg[^>]*class="person /);
    }
  }
});

test('every game has a short greeting for its manager on the /session3 picker', () => {
  for (const g of Object.values(GAMES)) {
    assert.equal(typeof g.greeting, 'string', g.key);
    assert.ok(g.greeting.length > 0 && g.greeting.length <= 28, `${g.key}: "${g.greeting}" fits the bubble`);
  }
});
