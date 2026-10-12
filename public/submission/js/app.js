// Read the Numbers — chapter list and card player.
(function () {
  const CHAPTERS = [
    { id: "ch0", key: "chapter0", number: 0, title: "Warm-up", minutes: 1 },
    { id: "ch1", key: "chapter1", number: 1, title: "Read it", minutes: 4 },
    { id: "ch2", key: "chapter2", number: 2, title: "Same numbers, different picture", minutes: 4 },
    { id: "ch3", key: "chapter3", number: 3, title: "Make it look good", minutes: 3 },
    { id: "ch4", key: "chapter4", number: 4, title: "Ask before you act", minutes: 4 },
    { id: "ch5", key: "chapter5", number: 5, title: "Your question kit", minutes: 1 },
  ];
  const ready = (ch) => ch.key && window.MODULE_CONTENT[ch.key];

  // Progress lives on this device only; the module works the same without it
  const KEY = "read-the-numbers-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const progress = Object.assign({ done: {}, seen: {}, pos: null, sound: true, confidence: {} }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* private mode */ } };
  RTN.audio.enabled = progress.sound;

  const app = document.getElementById("app");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // ── Chapter list ──────────────────────────────────────
  function home() {
    RTN.audio.stop();
    const next = CHAPTERS.find((c) => ready(c) && !progress.done[c.id]);
    const resume = progress.pos && CHAPTERS.find((c) => c.id === progress.pos.ch);
    const startLabel = resume ? "Keep going" : next ? "Start" : "Go again";
    app.innerHTML = "";
    const el = h(`<main class="home">
      <div><span class="eyebrow">Line 3 · Brake housings</span><h1>Read the Numbers</h1></div>
      <p>Short chapters, a few minutes each. Stop any time. You'll pick up where you left off on this device.</p>
      <div class="sound-tip">${RTN.icons.soundOn}<span>Turn your sound on. The words are on screen too.</span></div>
      <ol class="chapters"></ol>
      <div class="start-bar"><button class="btn btn-primary" id="start">${startLabel}</button></div>
    </main>`);
    const list = el.querySelector(".chapters");
    CHAPTERS.forEach((c) => {
      const done = progress.done[c.id];
      const status = !ready(c) ? "Coming soon" : done ? "Done" : "";
      const li = h(`<li><button class="chapter${done ? " done" : ""}" ${ready(c) ? "" : "disabled"}>
        <span class="num">${done ? RTN.icons.tick.replace(/44/g, "20") : c.number}</span>
        <span><span class="t">${esc(c.title)}</span><br><span class="m">About ${c.minutes} min</span></span>
        <span class="s">${status}</span></button></li>`);
      if (ready(c)) li.firstElementChild.onclick = () => openChapter(c, 0);
      list.appendChild(li);
    });
    el.querySelector("#start").onclick = () => {
      if (resume && ready(resume)) openChapter(resume, progress.pos.i);
      else openChapter(next || CHAPTERS.find(ready), 0);
    };
    app.appendChild(el);
  }

  // ── Player ────────────────────────────────────────────
  let cur = null;

  function openChapter(ch, i) {
    const cards = window.MODULE_CONTENT[ch.key].cards;
    cur = { ch, cards, i: Math.min(i || 0, cards.length - 1), shared: {} };
    app.innerHTML = "";
    const el = h(`<section class="player">
      <div class="topbar">
        <button class="icon-btn" id="close" aria-label="Back to chapters">${RTN.icons.close}</button>
        <div class="segments" aria-hidden="true">${cards.map(() => "<i></i>").join("")}</div>
        <button class="icon-btn" id="sound" aria-label="Sound"></button>
      </div>
      <div class="chapter-name">${esc(ch.title)}</div>
      <div class="stage" id="stage"></div>
      <nav class="navbar">
        <button class="btn btn-ghost" id="back">${RTN.icons.back}Back</button>
        <button class="btn replay" id="replay" aria-label="Replay">${RTN.icons.replay}<span>Replay</span></button>
        <button class="btn btn-primary next" id="next">Next${RTN.icons.next}</button>
      </nav>
    </section>`);
    app.appendChild(el);
    el.querySelector("#close").onclick = home;
    el.querySelector("#back").onclick = back;
    el.querySelector("#next").onclick = forward;
    el.querySelector("#replay").onclick = () => (cur.onReplay ? cur.onReplay() : RTN.audio.replay());
    const sound = el.querySelector("#sound");
    const paintSound = () => {
      sound.innerHTML = progress.sound ? RTN.icons.soundOn : RTN.icons.soundOff;
      sound.setAttribute("aria-label", progress.sound ? "Sound on. Tap to turn off" : "Sound off. Tap to turn on");
    };
    sound.onclick = () => { progress.sound = !progress.sound; RTN.audio.enabled = progress.sound; save(); paintSound(); };
    paintSound();
    showCard();
  }

  function back() { if (cur.i > 0) { cur.i--; showCard(); } else home(); }
  function forward() {
    if (!cur.ready) { cur.nudge && cur.nudge(); return; }
    if (cur.i < cur.cards.length - 1) { cur.i++; showCard(); }
    else finishChapter();
  }
  function finishChapter() {
    progress.done[cur.ch.id] = true;
    progress.pos = null;
    save();
    home();
  }

  function showCard() {
    RTN.audio.stop();
    const card = cur.cards[cur.i];
    cur.onReplay = null;
    cur.nudge = null;
    progress.pos = { ch: cur.ch.id, i: cur.i };
    save();

    document.querySelectorAll(".segments i").forEach((s, k) => s.classList.toggle("on", k <= cur.i));
    const stage = document.getElementById("stage");
    stage.innerHTML = "";
    stage.scrollTop = 0;
    const visual = h('<div class="visual"></div>');
    const captions = h('<div class="captions" aria-live="polite"></div>');
    const actions = h('<div class="actions"></div>');
    const feedback = h('<div class="captions feedback" aria-live="polite"></div>');
    stage.append(visual, captions, actions, feedback);

    const ctx = {
      card, visual, captions, actions, chapter: cur.ch,
      setReady(v) {
        cur.ready = v;
        const n = document.getElementById("next");
        n.classList.toggle("waiting", !v);
        n.setAttribute("aria-disabled", String(!v));
      },
      caption(text) { captions.prepend(h(`<p class="caption">${esc(text)}</p>`)); },
      // Replies and the model answer sit below the choices, so nothing the learner tapped moves
      reply(text) {
        feedback.querySelectorAll(".reply").forEach((r) => r.remove());
        const el = h(`<p class="reply">${esc(text)}</p>`);
        feedback.prepend(el);
        requestAnimationFrame(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }));
      },
      model(text, label = "What an experienced operator does") {
        if (feedback.querySelector(".model")) return;
        const el = h(`<div class="model"><b>${esc(label)}</b><p>${esc(text.replace(/^Good question: /, ""))}</p></div>`);
        feedback.append(el);
        requestAnimationFrame(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }));
      },
      play(clips, opts) { RTN.audio.play(clips, opts); },
    };
    document.getElementById("next").innerHTML =
      cur.i === cur.cards.length - 1 ? `Finish${RTN.icons.next}` : `Next${RTN.icons.next}`;

    const render = TYPES[card.type] || TYPES.story;
    render(card, ctx);
    stage.focus({ preventScroll: true });
  }

  // Story cards: tapping the left third goes back, the rest goes forward (like Stories)
  function storyTaps(ctx) {
    ctx.visual.style.cursor = "pointer";
    ctx.visual.addEventListener("click", (e) => {
      const r = ctx.visual.getBoundingClientRect();
      if (e.clientX - r.left < r.width / 3) back(); else forward();
    });
  }
  // Light up Back, Replay and Next one after another
  function hintButtons() {
    ["back", "replay", "next"].forEach((id, k) => {
      const b = document.getElementById(id);
      setTimeout(() => { b.classList.add("hint"); setTimeout(() => b.classList.remove("hint"), 1500); }, 600 + k * 1600);
    });
  }
  const visualFor = (card, ctx) => {
    const f = RTN.visuals[card.visual];
    if (f) ctx.visual.innerHTML = f(card, ctx.chapter);
  };
  const fill = (text, week) => {
    const r = productionData.timeline.find((x) => x.week === week);
    return text.replace("{week}", week).replace("{unitsProduced}", r.unitsProduced.toLocaleString("en-AU"));
  };

  // ── Card types ────────────────────────────────────────
  const TYPES = {
    story(card, ctx) {
      visualFor(card, ctx);
      if (card.visual !== "boss-at-noticeboard") ctx.caption(card.caption); // the boss's words sit in the speech bubble
      ctx.setReady(true);
      if (card.visual === "how-to-tap") hintButtons(); else storyTaps(ctx);
      ctx.play(card);
    },

    "chapter-end"(card, ctx) {
      ctx.visual.innerHTML = RTN.visuals[card.visual] ? RTN.visuals[card.visual](card, ctx.chapter) : `<div class="done-mark">${RTN.icons.tick}</div>`;
      ctx.caption(card.caption);
      ctx.setReady(true);
      progress.done[cur.ch.id] = true;
      save();
      ctx.play(card);
    },

    confidence(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const row = h('<div class="faces" role="group" aria-label="How sure do you feel?"></div>');
      card.options.forEach((label, k) => {
        const b = h(`<button class="face" aria-pressed="false">${RTN.faces[k]}<span>${esc(label)}</span></button>`);
        b.onclick = () => {
          row.querySelectorAll(".face").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          let r = card.response;
          if (card.when === "after") {
            // compare with the warm-up answer, if there is one
            const before = progress.confidence.before;
            progress.confidence.after = k + 1;
            r = !before ? card.responses.none : k + 1 > before ? card.responses.up : k + 1 < before ? card.responses.down : card.responses.same;
          } else progress.confidence.before = k + 1;
          save();
          ctx.reply(r.caption);
          ctx.play(r);
          ctx.setReady(true);
        };
        row.appendChild(b);
      });
      ctx.actions.appendChild(row);
      cur.nudge = () => row.querySelector(".face").focus();
      ctx.play(card);
    },

    "chart-tap"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, {
        onBarTap(w) {
          ctx.setReady(true);
          chart.set({ highlight: w });
          if (w === 7) {
            ctx.reply(card.responses.week7.caption);
            ctx.play(card.responses.week7);
          } else {
            const r = card.responses.otherWeek;
            ctx.reply(fill(r.caption, w));
            ctx.play(r);
            setTimeout(() => chart.pulse(7), 600);
          }
        },
      }));
      ctx.play(card);
    },

    "worked-example"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(true);
      const chart = RTN.Chart(ctx.visual, card.chart);
      const spoken = RTN.audio.stripTags(card.say);
      const at = card.animateAt ? spoken.indexOf(card.animateAt) / spoken.length : 0.5;
      let done = false;
      const run = () => {
        done = false;
        chart.set(Object.assign({}, card.chart, { hidden: [] }));
        ctx.play(card, {
          onTime(f) {
            if (done || f < at) return;
            done = true;
            if (card.animation === "remove-week-7") chart.animate({ hidden: [7] }, 1200);
            if (card.animation === "raise-axis-to-4800") chart.animate({ axisFrom: 4800 }, 1400);
          },
        });
      };
      cur.onReplay = run;
      run();
    },

    "toggle-week"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      let answered = false;
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, {
        onBarTap(w) {
          if (w !== card.toggleWeek) return chart.pulse(card.toggleWeek);
          const hidden = new Set(chart.state.hidden);
          hidden.has(w) ? hidden.delete(w) : hidden.add(w);
          chart.animate({ hidden: [...hidden] }, 800);
          if (!answered) {
            answered = true;
            ctx.setReady(true);
            ctx.reply(card.response.caption);
            setTimeout(() => ctx.play(card.response), 700);
          }
        },
      }));
      ctx.actions.appendChild(h('<p class="caption" style="font-size:15px;color:var(--muted)">Tap it again to put it back.</p>'));
      cur.nudge = () => chart.pulse(card.toggleWeek);
      ctx.play(card, { onEnd: () => { if (!answered) chart.pulse(card.toggleWeek); } });
    },

    "axis-drag"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const [min, max] = card.axisRange;
      let answered = false;
      const changed = (v) => {
        lower.disabled = v <= min;
        higher.disabled = v >= max;
        if (!answered && v >= (min + max) / 2) {
          answered = true;
          ctx.setReady(true);
          ctx.reply(card.response.caption);
          ctx.play(card.response);
        }
      };
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, {
        axisMark: "pulse",
        drag: { min, max, step: 100, onChange: changed },
      }));
      const tools = h(`<div class="chart-tools"><button class="btn btn-ghost" id="lower">Start lower</button><button class="btn btn-ghost" id="higher">Start higher</button></div>`);
      const lower = tools.querySelector("#lower"), higher = tools.querySelector("#higher");
      const nudgeBy = (d) => {
        const v = Math.max(min, Math.min(max, chart.state.axisFrom + d));
        chart.animate({ axisFrom: v }, 400);
        changed(v);
      };
      lower.onclick = () => nudgeBy(-1200);
      higher.onclick = () => nudgeBy(1200);
      lower.disabled = true;
      ctx.visual.appendChild(tools);
      cur.nudge = () => chart.set({ axisMark: "pulse" });
      ctx.play(card);
    },

    "find-it"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      let found = false;
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, {
        axisMark: true,
        onAxisTap() {
          if (found) return;
          found = true;
          ctx.setReady(true);
          chart.set({ axisMark: true });
          ctx.reply(card.response.caption);
          ctx.play(card.response);
        },
        onMiss() { if (!found) chart.set({ axisMark: "pulse" }); },
      }));
      cur.nudge = () => chart.set({ axisMark: "pulse" });
      ctx.play(card);
    },

    "unit-toggle"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const chart = RTN.Chart(ctx.visual, card.chart);
      const sw = h(`<div class="switch" role="group" aria-label="Show scrap as"></div>`);
      let answered = false;
      ["pct", "count"].forEach((mode, k) => {
        const b = h(`<button aria-pressed="${k === 0}">${esc(card.toggle[k])}</button>`);
        b.onclick = () => {
          sw.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          chart.set({ mode, highlight: 12 });
          if (mode === "count" && !answered) {
            answered = true;
            ctx.setReady(true);
            ctx.reply(card.response.caption);
            ctx.play(card.response);
          }
        };
        sw.appendChild(b);
      });
      chart.set({ highlight: 12 });
      ctx.actions.appendChild(sw);
      cur.nudge = () => sw.querySelectorAll("button")[1].focus();
      ctx.play(card);
    },

    // Worked example on the sheet: row, then column, then the cell, in time with the voice
    "table-example"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(true);
      const t = RTN.table(ctx.visual);
      const spoken = RTN.audio.stripTags(card.say);
      const cues = card.cues.map((c) => ({ ...c, f: Math.max(0, spoken.indexOf(c.at)) / spoken.length }));
      const { week, column } = card.highlight;
      const run = () => {
        t.clear();
        ctx.play(card, {
          onTime(f) {
            cues.filter((c) => f >= c.f).forEach((c) => {
              if (c.show === "row") t.row(week);
              if (c.show === "column") t.column(column);
              if (c.show === "cell") t.cell(week, column, "found");
            });
          },
        });
      };
      cur.onReplay = run;
      run();
    },

    "table-tap"(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const { week, column } = card.target;
      let found = false, misses = 0;
      const t = RTN.table(ctx.visual, {
        onTap(w, col) {
          if (found) return;
          if (col === "week") { t.clear(); t.row(w); return; }
          if (w === week && col === column) {
            found = true;
            t.clear();
            t.cell(w, col, "found");
            ctx.setReady(true);
            ctx.reply(card.responses.found.caption);
            ctx.play(card.responses.found);
            return;
          }
          misses++;
          const r = productionData.timeline.find((x) => x.week === w);
          const c = card.responses.other;
          ctx.reply(c.caption.replace("{week}", w).replace("{label}", productionData.columns[col].label).replace("{value}", RTN.tableValue(col, r[col])));
          t.clear();
          t.cell(w, col, "tried");
          t.row(week);
          if (misses >= 2) t.column(column);
          ctx.play(c);
        },
      });
      cur.nudge = () => t.row(week);
      ctx.play(card);
    },

    // Each term opens to its plain meaning and the other names it goes by
    terms(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const list = h('<div class="terms"></div>');
      card.terms.forEach((term) => {
        const col = productionData.columns[term.column];
        const b = h(`<button class="term" aria-expanded="false">
          <span class="term-head"><b>${esc(col.label)}</b><span>${esc(col.plainLabel)}</span></span>
          <span class="term-body"><span>${esc(term.meaning)}</span>
          <span class="also">Also called: ${term.alsoCalled.map((a) => `<i>${esc(a)}</i>`).join("")}</span></span>
        </button>`);
        b.onclick = () => {
          const open = b.getAttribute("aria-expanded") !== "true";
          b.setAttribute("aria-expanded", String(open));
          if (open) { ctx.play(term); ctx.setReady(true); }
        };
        list.appendChild(b);
      });
      ctx.actions.appendChild(list);
      cur.nudge = () => list.querySelector(".term").focus();
      ctx.play(card);
    },

    // Two-way sort: swipe a card left or right, or tap a button. Every card lands in its true pile with the reason.
    sort(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const box = h(`<div class="sort">
        <div class="piles"><div class="pile" data-pile="left"><b>${esc(card.piles.left)}</b><div class="pile-items"></div></div>
        <div class="pile" data-pile="right"><b>${esc(card.piles.right)}</b><div class="pile-items"></div></div></div>
        <div class="deck"></div>
        <div class="row"><button class="btn btn-ghost" data-go="left">${RTN.icons.back}${esc(card.piles.left)}</button>
        <button class="btn btn-ghost" data-go="right">${esc(card.piles.right)}${RTN.icons.next}</button></div>
      </div>`);
      const deck = box.querySelector(".deck");
      let i = 0, busy = false;
      const label = (it) => productionData.columns[it.column].plainLabel;
      const deal = () => {
        deck.innerHTML = "";
        if (i >= card.items.length) {
          deck.innerHTML = '<p class="deck-done">All sorted</p>';
          box.querySelectorAll("[data-go]").forEach((b) => (b.disabled = true));
          ctx.setReady(true);
          return;
        }
        const it = card.items[i];
        const c = h(`<div class="sort-card" tabindex="-1"><b>${esc(label(it))}</b><small>${esc(productionData.columns[it.column].label)}</small></div>`);
        deck.appendChild(c);
        let x0 = null, dx = 0;
        c.addEventListener("pointerdown", (e) => { if (busy) return; x0 = e.clientX; dx = 0; c.setPointerCapture(e.pointerId); c.style.transition = "none"; });
        c.addEventListener("pointermove", (e) => { if (x0 == null) return; dx = e.clientX - x0; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; });
        const up = () => {
          if (x0 == null) return;
          x0 = null;
          c.style.transition = "";
          if (Math.abs(dx) > 70) decide(dx > 0 ? "right" : "left");
          else c.style.transform = "";
        };
        c.addEventListener("pointerup", up);
        c.addEventListener("pointercancel", up);
      };
      const decide = (side) => {
        if (busy || i >= card.items.length) return;
        busy = true;
        const it = card.items[i];
        const c = deck.querySelector(".sort-card");
        c.style.transform = `translateX(${it.pile === "right" ? 120 : -120}%) rotate(${it.pile === "right" ? 12 : -12}deg)`;
        c.style.opacity = "0";
        box.querySelector(`[data-pile="${it.pile}"] .pile-items`).appendChild(h(`<span>${esc(label(it))}</span>`));
        ctx.reply(`${label(it)}: ${it.caption}`);
        ctx.play(it);
        setTimeout(() => { i++; busy = false; deal(); }, 450);
      };
      box.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => decide(b.dataset.go)));
      ctx.actions.appendChild(box);
      deal();
      ctx.play(card);
    },

    // Slide along the chart; each week is read out in plain words
    scrub(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const seen = new Set();
      let current = null, timer = null;
      const show = (w) => {
        if (w === current) return;
        current = w;
        chart.set({ highlight: w });
        const clip = card.weeks[w];
        ctx.reply(clip.caption);
        seen.add(w);
        if (seen.size >= card.weeksToVisit) ctx.setReady(true);
        clearTimeout(timer);
        RTN.audio.stop();
        timer = setTimeout(() => ctx.play(clip), 260); // wait for the finger to settle
      };
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, { onScrub: show, onBarTap: show }));
      ctx.visual.appendChild(h('<p class="slide-hint" aria-hidden="true">Slide along the bars</p>'));
      ctx.play(card);
    },

    // Tap a word to swap it; Check reads the sentence against the chart
    sentence(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const chart = RTN.Chart(ctx.visual, card.chart);
      const pick = card.start ? card.start.slice() : card.slots.map(() => 0);
      let tries = 0, done = false;
      const box = h('<div class="sentence"><p class="sentence-line"></p><button class="btn btn-primary" id="check">Check it on the chart</button></div>');
      const line = box.querySelector(".sentence-line");
      const draw = () => {
        line.innerHTML = "";
        card.template.split(/(\{\d\})/).forEach((part) => {
          const m = part.match(/^\{(\d)\}$/);
          if (!m) { if (part) line.append(document.createTextNode(part)); return; }
          const k = +m[1];
          const b = h(`<button class="word" aria-label="${esc(card.slots[k][pick[k]])}. Tap to swap">${esc(card.slots[k][pick[k]])}</button>`);
          b.onclick = () => { if (done) return; pick[k] = (pick[k] + 1) % card.slots[k].length; draw(); line.querySelectorAll(".word")[k].focus(); };
          line.append(b);
        });
      };
      box.querySelector("#check").onclick = () => {
        if (done) return;
        const key = pick.map((p, k) => card.slots[k][p]).join("|");
        const truth = card.truths[key];
        if (truth) {
          done = true;
          chart.set({ highlight: truth.week });
          ctx.reply(truth.caption);
          ctx.play(truth);
          ctx.setReady(true);
          box.querySelector("#check").disabled = true;
          return;
        }
        tries++;
        ctx.reply(card.notYet.caption);
        ctx.play(card.notYet);
        if (tries >= 2) {
          ctx.model("Week 7 made the fewest housings. Week 12 made the most.", "Sentences the chart backs up");
          ctx.setReady(true);
        }
      };
      draw();
      ctx.actions.appendChild(box);
      cur.nudge = () => line.querySelector(".word").focus();
      ctx.play(card);
    },

    // Make the chart look good: three switches, a live meter, then the boss reacts
    maker(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const pick = cur.shared.maker || (cur.shared.maker = { weeks: "all", scale: "zero", headline: "plain" });
      const opt = (tool) => card.tools[tool].find((o) => o.id === pick[tool]);
      const config = () => ({
        weeks: opt("weeks").weeks,
        axisFrom: opt("scale").axisFrom,
        heading: opt("headline").label,
        highlight: null,
      });
      ctx.visual.classList.add("pinned"); // chart and meter stay in view while the switches scroll
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, config()));
      const meter = h('<div class="meter" aria-live="polite"></div>');
      ctx.visual.appendChild(meter);
      const drawMeter = () => {
        const c = config(), rows = productionData.timeline;
        const ws = c.weeks === "all" ? rows.map((r) => r.week) : c.weeks;
        const first = rows.find((r) => r.week === ws[0]).unitsProduced;
        const last = rows.find((r) => r.week === ws[ws.length - 1]).unitsProduced;
        const times = (last - c.axisFrom) / Math.max(first - c.axisFrom, 1);
        const looks = times < 1.5 ? `Week ${ws[ws.length - 1]} looks about the same as week ${ws[0]}` : `Week ${ws[ws.length - 1]} looks ${Math.round(times)} times as tall as week ${ws[0]}`;
        meter.innerHTML = `<div><span>Looks like</span><b>${looks}</b></div><div><span>Really</span><b>${(last - first).toLocaleString("en-AU")} more housings</b></div>`;
        meter.classList.toggle("hyped", times >= 1.5);
        cur.shared.hype = times >= 3 || pick.headline !== "plain";
      };
      Object.entries({ weeks: "Weeks", scale: "Scale starts", headline: "Headline" }).forEach(([tool, name]) => {
        const row = h(`<div class="tool"><span class="tool-name">${name}</span><div class="switch" role="group" aria-label="${name}"></div></div>`);
        const sw = row.querySelector(".switch");
        card.tools[tool].forEach((o) => {
          const b = h(`<button aria-pressed="${pick[tool] === o.id}">${esc(o.label)}</button>`);
          b.onclick = () => {
            pick[tool] = o.id;
            sw.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
            chart.set(config());
            drawMeter();
          };
          sw.appendChild(b);
        });
        ctx.actions.appendChild(row);
      });
      const show = h('<button class="btn btn-primary">Show the boss</button>');
      show.onclick = () => {
        const r = cur.shared.hype ? card.boss.happy : card.boss.flat;
        ctx.reply(r.caption);
        ctx.play(r);
        ctx.setReady(true);
      };
      ctx.actions.appendChild(show);
      drawMeter();
      cur.nudge = () => show.focus();
      ctx.play(card);
    },

    // Their chart next to all the numbers, then one line for each thing a switch hid
    reveal(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(true);
      const maker = window.MODULE_CONTENT.chapter3.cards.find((c) => c.type === "maker");
      const pick = cur.shared.maker || { weeks: "all", scale: "zero", headline: "plain" };
      const opt = (tool) => maker.tools[tool].find((o) => o.id === pick[tool]);
      const box = h('<div class="reveal"><p class="reveal-label">Your chart</p><div class="mine"></div><p class="reveal-label">All the numbers</p><div class="all"></div></div>');
      ctx.visual.appendChild(box);
      RTN.Chart(box.querySelector(".mine"), { measure: "unitsProduced", targetLine: true, weeks: opt("weeks").weeks, axisFrom: opt("scale").axisFrom, heading: opt("headline").label });
      RTN.Chart(box.querySelector(".all"), { measure: "unitsProduced", targetLine: true, weeks: "all", axisFrom: 0, heading: "Line 3 output, weeks 1 to 12" });
      const keys = [pick.weeks, pick.scale, pick.headline].filter((k) => card.notes[k]);
      const notes = keys.length ? keys.map((k) => card.notes[k]) : [card.notes.honest];
      const list = h(`<ul class="reveal-notes">${notes.map((n) => `<li>${esc(n.caption)}</li>`).join("")}</ul>`);
      ctx.actions.appendChild(list);
      ctx.play([card, ...notes]);
    },

    // Tap what looks fishy on someone else's chart. Each find explains itself; two unlock Next.
    spot(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(false);
      const found = new Set();
      const tally = h(`<p class="tally" aria-live="polite"></p>`);
      const noteEl = h(`<button class="sticky sticky-btn"><small>Note</small><p>${esc(card.note)}</p></button>`);
      const list = h('<ul class="found-list"></ul>');
      const drawTally = () => {
        const n = found.size, total = Object.keys(card.spots).length;
        tally.textContent = n >= total ? `Found all ${total}` : `Found ${n} of ${total}`;
      };
      const hit = (key) => {
        if (key === "plot") { ctx.reply(card.hint.caption); ctx.play(card.hint); return; }
        const s = card.spots[key];
        if (!found.has(key)) {
          found.add(key);
          list.appendChild(h(`<li>${RTN.icons.tick.replace(/44/g, "18")}${esc(s.label)}</li>`));
        }
        chart.set({ marks: [...found].filter((k) => k !== "note") });
        noteEl.classList.toggle("spotted", found.has("note"));
        ctx.reply(s.caption);
        ctx.play(s);
        drawTally();
        if (found.size >= card.need) ctx.setReady(true);
      };
      const chart = RTN.Chart(ctx.visual, Object.assign({}, card.chart, { onRegionTap: hit }));
      noteEl.onclick = () => hit("note");
      ctx.visual.appendChild(noteEl);
      // Keyboard and screen-reader route to the same four spots
      const keys = h('<div class="spot-keys" role="group" aria-label="Parts of the chart"></div>');
      Object.entries(card.spots).filter(([k]) => k !== "note").forEach(([k, s]) => {
        const b = h(`<button class="visually-hidden">${esc(s.label)}</button>`);
        b.onclick = () => hit(k);
        keys.appendChild(b);
      });
      ctx.visual.appendChild(keys);
      ctx.actions.append(tally, list);
      drawTally();
      cur.nudge = () => { ctx.reply(card.hint.caption); ctx.play(card.hint); };
      ctx.play(card);
    },

    // A moment on the floor: someone says something, the learner decides. "Ask first" opens a choice of questions.
    scene(card, ctx) {
      ctx.visual.innerHTML = RTN.visuals.speech(card);
      if (card.chart) {
        const holder = h('<div class="scene-chart"></div>');
        ctx.visual.appendChild(holder);
        RTN.Chart(holder, card.chart);
      }
      if (card.visual && RTN.visuals[card.visual]) ctx.visual.insertAdjacentHTML("beforeend", RTN.visuals[card.visual](card, ctx.chapter));
      if (card.supervisorNotes) ctx.visual.insertAdjacentHTML("beforeend", RTN.visuals["supervisor-notes"]());
      ctx.setReady(false);
      let modelHeard = false;
      const finish = (o) => {
        ctx.reply(o.caption);
        ctx.model(card.model.caption);
        ctx.play(modelHeard ? [o] : [o, card.model]);
        modelHeard = true;
        ctx.setReady(true);
      };
      const press = (group, b) => group.querySelectorAll(".option").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const opts = h('<div class="actions"></div>');
      const qBox = h('<div class="questions" hidden><p class="q-title">What would you ask?</p></div>');
      card.options.forEach((o) => {
        const b = h(`<button class="option" aria-pressed="false">${esc(o.label)}</button>`);
        b.onclick = () => {
          press(opts, b);
          if (!o.questions) { qBox.hidden = true; return finish(o); }
          qBox.hidden = false;
          ctx.reply(o.caption);
          ctx.play(o);
          requestAnimationFrame(() => qBox.scrollIntoView({ block: "nearest", behavior: "smooth" }));
        };
        opts.appendChild(b);
        (o.questions || []).forEach((q) => {
          const qb = h(`<button class="option q" aria-pressed="false">${esc(q.label)}</button>`);
          qb.onclick = () => { press(qBox, qb); finish(q); };
          qBox.appendChild(qb);
        });
      });
      ctx.actions.append(opts, qBox);
      cur.nudge = () => opts.querySelector(".option").focus();
      ctx.play(card);
    },

    // The question kit: every card is on screen at once; tapping one plays it again
    kit(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(true);
      const list = h('<div class="kit" aria-label="Your question kit"><p class="kit-title">Before you act on a number, ask:</p></div>');
      card.items.forEach((it) => {
        const b = h(`<button class="kit-card${it.chartCheck ? " chart-check" : ""}">
          <span class="kit-q">${esc(it.question)}</span><span class="kit-d">${esc(it.detail)}</span></button>`);
        b.onclick = () => ctx.play(it);
        list.appendChild(b);
      });
      ctx.visual.appendChild(list);
      ctx.play(card);
    },

    // What the learner has built: one branch per chapter, lit once done. Nothing ever dims.
    bloom(card, ctx) {
      ctx.caption(card.caption);
      ctx.setReady(true);
      const box = h('<div class="bloom"></div>');
      card.branches.forEach((b, k) => {
        const ch = CHAPTERS.find((c) => c.id === b.chapter);
        const lit = !!progress.done[b.chapter];
        const row = h(`<div class="branch${lit ? " lit" : ""}" style="--k:${k}">
          <span class="node" aria-hidden="true"></span>
          <div><b>${esc(ch.title)}</b>${lit ? "" : '<span class="later">Still to grow</span>'}
          <div class="leaves">${b.skills.map((s, j) => `<span style="--j:${j}">${esc(s)}</span>`).join("")}</div></div></div>`);
        box.appendChild(row);
      });
      ctx.visual.appendChild(box);
      ctx.play(card);
    },

    choice(card, ctx) { choiceCard(card, ctx, false); },
    decision(card, ctx) { choiceCard(card, ctx, true); },
  };

  // Three-way choice: every option plays out its consequence, then the model question. No marks, no scores.
  function choiceCard(card, ctx, isBoss) {
    if (isBoss) ctx.visual.innerHTML = RTN.visuals["boss-at-noticeboard"](card);
    else { visualFor(card, ctx); ctx.caption(card.caption); }
    ctx.setReady(false);
    let first = true;
    card.options.forEach((o) => {
      const b = h(`<button class="option" aria-pressed="false">${esc(o.label)}</button>`);
      b.onclick = () => {
        ctx.actions.querySelectorAll(".option").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        ctx.reply(o.caption);
        ctx.model(card.model.caption);
        ctx.play(first ? [o, card.model] : [o]);
        first = false;
        ctx.setReady(true);
      };
      ctx.actions.appendChild(b);
    });
    cur.nudge = () => ctx.actions.querySelector(".option").focus();
    ctx.play(card);
  }

  // Keyboard for the desktop fallback
  document.addEventListener("keydown", (e) => {
    if (!cur || !document.querySelector(".player")) return;
    if (e.target.closest && e.target.closest("button, [role=button]") && (e.key === "Enter" || e.key === " ")) return;
    if (e.key === "ArrowRight") forward();
    if (e.key === "ArrowLeft") back();
    if (e.key === "r" || e.key === "R") document.getElementById("replay").click();
  });

  home();
})();
