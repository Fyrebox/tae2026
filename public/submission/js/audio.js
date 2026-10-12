// Plays voice clips in sequence. With sound off, or when a clip can't play,
// the sequence still moves on after a reading-time pause so nothing waits for audio.
window.RTN = window.RTN || {};
RTN.audio = (function () {
  const el = new Audio();
  el.preload = "auto";
  let enabled = true;
  let timer = null;
  let ticker = null;
  let last = { clips: [], opts: {} };
  let token = 0;

  const stripTags = (s) => (s || "").replace(/\[[^\]]*\]\s*/g, "");
  const readTime = (c) => Math.max(2200, stripTags(c.caption || c.say).split(/\s+/).length * 330);

  function setSpeaking(on) {
    document.body.classList.toggle("speaking", on);
  }

  function stop() {
    token++;
    el.pause();
    el.onended = el.ontimeupdate = el.onerror = null;
    clearTimeout(timer);
    clearInterval(ticker);
    setSpeaking(false);
  }

  function silent(c, opts, next, my) {
    const total = readTime(c);
    const start = Date.now();
    ticker = setInterval(() => {
      if (my !== token) return clearInterval(ticker);
      opts.onTime && opts.onTime(Math.min(1, (Date.now() - start) / total), c);
    }, 120);
    timer = setTimeout(() => { clearInterval(ticker); if (my === token) next(); }, total);
  }

  function run(queue, opts, my) {
    if (my !== token) return;
    if (!queue.length) { setSpeaking(false); opts.onEnd && opts.onEnd(); return; }
    const c = queue.shift();
    const next = () => run(queue, opts, my);
    if (!enabled || !c.audio) { setSpeaking(false); return silent(c, opts, next, my); }
    setSpeaking(true);
    el.src = c.audio;
    el.ontimeupdate = () => { if (el.duration) opts.onTime && opts.onTime(el.currentTime / el.duration, c); };
    el.onended = () => { opts.onTime && opts.onTime(1, c); next(); };
    el.onerror = () => { setSpeaking(false); silent(c, opts, next, my); };
    const p = el.play();
    if (p && p.catch) p.catch(() => { if (my === token) { setSpeaking(false); silent(c, opts, next, my); } });
  }

  function play(clips, opts = {}) {
    stop();
    const list = (Array.isArray(clips) ? clips : [clips]).filter(Boolean);
    last = { clips: list, opts };
    run(list.slice(), opts, token);
  }

  return {
    play,
    stop,
    replay() { play(last.clips, last.opts); },
    get enabled() { return enabled; },
    // Turning sound off mid-clip restarts the sequence silently, so cues and replies still arrive
    set enabled(v) { enabled = !!v; if (!enabled && !el.paused) play(last.clips, last.opts); },
    stripTags,
  };
})();
