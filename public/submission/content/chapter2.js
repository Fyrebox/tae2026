// Chapter 2 — Same numbers, different picture (about 4 minutes)
// Three tricks, each shown as numbers and as a picture: one odd week, a cut-off scale, a percent that hides the count.
// say: text sent to the voice (expressive tags, numbers in words). caption: text shown on screen.
// Every card with audio shows a replay button. All figures come from line3-data.js.
window.MODULE_CONTENT = window.MODULE_CONTENT || {};
window.MODULE_CONTENT.chapter2 = {
  id: "ch2",
  title: "Same numbers, different picture",
  minutes: 4,
  cards: [
    {
      id: "c2-01",
      type: "story",
      speaker: "guide",
      visual: "chapter-title",
      say: "The numbers on the sheet don't change. But the way they're shown can change what you think they mean. Let's look at three tricks.",
      caption: "The numbers don't change. How they're shown can change what you think. Three tricks to look at.",
      audio: "media/audio/ch2/c2-01.mp3",
    },

    // ── Trick 1: one odd week ─────────────────────────────────────────────
    {
      id: "c2-02",
      type: "story",
      speaker: "guide",
      visual: "supervisor-note-week7", // shows supervisorEvents week 7 text, word for word
      say: "Remember week 7? The supervisor's note says a big storm hit, and the site lost power for part of the week.",
      caption: "Remember week 7? A big storm hit. The site lost power for part of the week.",
      audio: "media/audio/ch2/c2-02.mp3",
    },
    {
      id: "c2-03",
      type: "worked-example",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0, averageLine: true },
      animation: "remove-week-7", // week 7 fades out, average line rises from 4,844 to 4,953
      animateAt: "Now watch", // animation starts when the voice reaches this phrase
      say: "Here's the average for all twelve weeks. Four thousand, eight hundred and forty-four housings a week. Now watch what happens when I take week 7 out. [curious] The average jumps to four thousand, nine hundred and fifty-three. One bad week pulled the whole average down by more than a hundred.",
      caption: "Average, all 12 weeks: 4,844. Take week 7 out: 4,953. One bad week pulled the average down by more than 100.",
      audio: "media/audio/ch2/c2-03.mp3",
    },
    {
      id: "c2-04",
      type: "toggle-week",
      speaker: "guide",
      chart: { measure: "downtimeHrs", weeks: "all", axisFrom: 0, averageLine: true },
      toggleWeek: 7, // tap week 7 to take it out or put it back; any number of times
      say: "Your turn. These bars show the hours the line was stopped. Tap week 7 to take it out, and watch the average line.",
      caption: "Your turn. Hours the line was stopped. Tap week 7 to take it out. Watch the average.",
      audio: "media/audio/ch2/c2-04.mp3",
      response: {
        // average with week 7: 13.5 hrs. Without: 11.3 hrs.
        say: "See that? The average drops from thirteen and a half hours to about eleven. Week 7 made a normal week look worse than it really is.",
        caption: "With week 7: 13.5 hours. Without: about 11. Week 7 made a normal week look worse than it is.",
        audio: "media/audio/ch2/c2-04-r.mp3",
      },
    },
    {
      id: "c2-05",
      type: "choice",
      speaker: "guide",
      visual: "week7-figures", // 38 hours stopped, 3,650 made
      say: "Now look closer at week 7. The line was stopped for thirty-eight hours. A normal full-time week is about thirty-eight hours. So how did they still make three thousand, six hundred and fifty housings? [curious] What do you reckon?",
      caption: "Week 7: stopped for 38 hours. A full-time week is about 38 hours. But 3,650 housings were still made. What do you reckon?",
      audio: "media/audio/ch2/c2-05.mp3",
      options: [
        {
          label: "Must be a mistake",
          say: "Could be. Numbers do get typed in wrong.",
          caption: "Could be. Numbers do get typed in wrong.",
          audio: "media/audio/ch2/c2-05-a.mp3",
        },
        {
          label: "Maybe the line runs more than one shift",
          say: "Could be. If the line runs day and night, thirty-eight hours is only part of the week.",
          caption: "Could be. If the line runs day and night, 38 hours is only part of the week.",
          audio: "media/audio/ch2/c2-05-b.mp3",
        },
        {
          label: "I'd ask someone",
          say: "Good call. That's exactly what this needs.",
          caption: "Good call. That's exactly what this needs.",
          audio: "media/audio/ch2/c2-05-c.mp3",
        },
      ],
      // shown after any option
      model: {
        say: "Here's the thing. The sheet doesn't tell us how many hours the line runs each week. Without that, nobody can say for sure. When a number doesn't add up, it's okay to ask. An experienced operator would ask: how many hours does the line run each week?",
        caption: "The sheet doesn't say how many hours the line runs. When a number doesn't add up, it's okay to ask. Good question: \"How many hours does the line run each week?\"",
        audio: "media/audio/ch2/c2-05-model.mp3",
      },
    },

    // ── Trick 2: a scale that doesn't start at zero ───────────────────────
    {
      id: "c2-06",
      type: "worked-example",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: [8, 9, 10, 11, 12], axisFrom: 0 },
      animation: "raise-axis-to-4800", // axis start slides from 0 to 4,800
      animateAt: "Now I'll start",
      say: "Here are weeks 8 to 12. With the side scale starting at zero, they look about the same. Now I'll start the scale at four thousand, eight hundred instead. [matter-of-fact] Same numbers. But now week 12 looks four times bigger than week 8. It isn't. It's only two hundred and seventy more.",
      caption: "Weeks 8 to 12, scale from 0: they look about the same. Scale from 4,800: week 12 looks 4 times bigger than week 8. It's only 270 more.",
      audio: "media/audio/ch2/c2-06.mp3",
    },
    {
      id: "c2-07",
      type: "axis-drag",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: [8, 9, 10, 11, 12], axisFrom: 0 },
      axisRange: [0, 4800], // drag handle on the bottom of the scale; buttons "Lower" / "Higher" do the same
      say: "Your turn. Drag the bottom of the scale up and down, and watch the bars.",
      caption: "Your turn. Drag the bottom of the scale up and down. Watch the bars.",
      audio: "media/audio/ch2/c2-07.mp3",
      response: {
        say: "The higher the scale starts, the bigger the gaps look. The numbers never changed.",
        caption: "The higher the scale starts, the bigger the gaps look. The numbers never changed.",
        audio: "media/audio/ch2/c2-07-r.mp3",
      },
    },
    {
      id: "c2-08",
      type: "find-it",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: [8, 9, 10, 11, 12], axisFrom: 4800 },
      target: "axis-bottom-label", // any other tap: an arrow points to the bottom of the scale
      say: "So here's the habit. Always check where the side scale starts. Tap the number at the bottom of the scale.",
      caption: "The habit: always check where the side scale starts. Tap the number at the bottom of the scale.",
      audio: "media/audio/ch2/c2-08.mp3",
      response: {
        say: "Four thousand, eight hundred. Not zero. So small changes will look big on this one.",
        caption: "4,800, not zero. Small changes will look big on this chart.",
        audio: "media/audio/ch2/c2-08-r.mp3",
      },
    },

    // ── Trick 3: a percent that hides the real count ──────────────────────
    {
      id: "c2-09",
      type: "unit-toggle",
      speaker: "guide",
      chart: { measure: "scrapPct", weeks: "all", axisFrom: 0 },
      toggle: ["Percent", "Number of housings (about)"], // count = housings made × scrap % ÷ 100, rounded
      say: "Scrap is shown as a percent. Week 12 is two point six percent. Sounds tiny, right? Tap the switch to see it as housings instead.",
      caption: "Scrap is shown as a percent. Week 12: 2.6%. Sounds tiny. Tap the switch to see it as housings.",
      audio: "media/audio/ch2/c2-09.mp3",
      response: {
        // 2.6% of 5,150 ≈ 134. 1.8% of 4,990 ≈ 90.
        say: "Two point six percent of five thousand, one hundred and fifty is about a hundred and thirty-four housings. In week 6 it was about ninety. That's a lot more housings in the bin.",
        caption: "2.6% of 5,150 is about 134 housings. In week 6 it was about 90. That's a lot more in the bin.",
        audio: "media/audio/ch2/c2-09-r.mp3",
      },
    },
    {
      id: "c2-10",
      type: "decision",
      speaker: "boss",
      visual: "boss-at-noticeboard",
      say: "[dismissive] Scrap's only up a little bit. Nothing to worry about.",
      caption: "\"Scrap's only up a little bit. Nothing to worry about.\"",
      audio: "media/audio/ch2/c2-10.mp3",
      options: [
        {
          label: "Go with it",
          speaker: "guide",
          say: "Nobody checks. Scrap keeps creeping up, and it's weeks before anyone looks into why.",
          caption: "Nobody checks. Scrap keeps creeping up, and it's weeks before anyone looks into why.",
          audio: "media/audio/ch2/c2-10-go.mp3",
        },
        {
          label: "Ask first",
          speaker: "guide",
          say: "You ask: how many housings is that? About a hundred and thirty-four gets everyone's attention. Someone starts looking into it.",
          caption: "You ask: \"How many housings is that?\" About 134 gets everyone's attention. Someone starts looking into it.",
          audio: "media/audio/ch2/c2-10-ask.mp3",
        },
        {
          label: "Push back",
          speaker: "guide",
          say: "You say it's not nothing. Fair enough, but without a number it's your word against his. Asking for the count would have backed you up.",
          caption: "You say it's not nothing. But without a number, it's your word against his. The count would have backed you up.",
          audio: "media/audio/ch2/c2-10-push.mp3",
        },
      ],
      model: {
        speaker: "guide",
        say: "An experienced operator would ask: how many housings is that, not just the percent?",
        caption: "Good question: \"How many housings is that, not just the percent?\"",
        audio: "media/audio/ch2/c2-10-model.mp3",
      },
    },

    {
      id: "c2-11",
      type: "chapter-end",
      speaker: "guide",
      visual: "three-tricks", // icons: one odd week, cut-off scale, percent vs count
      say: "[warm] Good work. Three tricks to watch for. One odd week can drag the average. A scale that doesn't start at zero makes small changes look big. And a percent can hide the real count.",
      caption: "Three tricks to watch for: one odd week drags the average. A scale not starting at zero makes small changes look big. A percent can hide the real count.",
      audio: "media/audio/ch2/c2-11.mp3",
    },
  ],
};
