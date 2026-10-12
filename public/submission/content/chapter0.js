// Chapter 0 — Warm-up (about 1 minute)
// say: text sent to the voice (expressive tags, numbers in words). caption: text shown on screen.
// Every card with audio shows a replay button.
window.MODULE_CONTENT = window.MODULE_CONTENT || {};
window.MODULE_CONTENT.chapter0 = {
  id: "ch0",
  title: "Warm-up",
  minutes: 1,
  cards: [
    {
      id: "c0-01",
      type: "story",
      speaker: "guide",
      visual: "noticeboard-sheet",
      say: "[warm] G'day. This is the weekly sheet from Line 3, the brake housing line. It's the same one that goes up on the noticeboard.",
      caption: "G'day. This is the weekly sheet from Line 3. It's the same one that goes up on the noticeboard.",
      audio: "media/audio/ch0/c0-01.mp3",
    },
    {
      id: "c0-02",
      type: "story",
      speaker: "guide",
      visual: "how-to-tap", // pulse on right edge, then on the replay button
      say: "Tap the right side of the screen to keep going, and the left side to go back. If you miss something I say, tap the replay button. You can't break anything.",
      caption: "Tap right to keep going. Tap left to go back. Tap replay to hear me again.",
      audio: "media/audio/ch0/c0-02.mp3",
    },
    {
      id: "c0-03",
      type: "confidence",
      speaker: "guide",
      say: "Quick question first. How sure do you feel reading numbers like these? There's no wrong answer.",
      caption: "How sure do you feel reading numbers like these? There's no wrong answer.",
      audio: "media/audio/ch0/c0-03.mp3",
      options: ["Not sure at all", "A bit unsure", "Okay", "Fairly sure", "Very sure"],
      response: {
        say: "Thanks. I'll ask you again at the end.",
        caption: "Thanks. I'll ask you again at the end.",
        audio: "media/audio/ch0/c0-03-r.mp3",
      },
    },
    {
      id: "c0-04",
      type: "chart-tap",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0 },
      say: "Each bar is one week. The taller the bar, the more housings were made. Tap the shortest bar.",
      caption: "Each bar is one week. Taller bar means more housings made. Tap the shortest bar.",
      audio: "media/audio/ch0/c0-04.mp3",
      responses: {
        week7: {
          say: "[pleased] That's week 7. Only three thousand, six hundred and fifty made. Hang on to that one. We'll come back to it.",
          caption: "That's week 7. Only 3,650 made. Remember this week. We'll come back to it.",
          audio: "media/audio/ch0/c0-04-week7.mp3",
        },
        otherWeek: {
          // caption is filled in by the app with the tapped week's real figure; week 7 then glows
          say: "Have a look at week 7. See how it drops right down?",
          caption: "Week {week}: {unitsProduced} made. Have a look at week 7. See how it drops right down?",
          audio: "media/audio/ch0/c0-04-other.mp3",
          then: "highlight-week-7",
        },
      },
    },
    {
      id: "c0-05",
      type: "chapter-end",
      speaker: "guide",
      say: "Nice one. That's the warm-up done. Next, we'll look at how the same numbers can tell different stories.",
      caption: "Warm-up done. Next: how the same numbers can tell different stories.",
      audio: "media/audio/ch0/c0-05.mp3",
    },
  ],
};
