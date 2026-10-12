// Chapter 3 — Make it look good (about 3 minutes)
// Outcome 2, harder: the learner uses the tricks themselves, sees what they hid, then spots them in another chart.
// No figure is ever changed: every chart here draws the real Line 3 numbers.
// say: text sent to the voice (expressive tags, numbers in words). caption: text shown on screen.
window.MODULE_CONTENT = window.MODULE_CONTENT || {};
window.MODULE_CONTENT.chapter3 = {
  id: "ch3",
  title: "Make it look good",
  minutes: 3,
  cards: [
    {
      id: "c3-01",
      type: "story",
      speaker: "guide",
      visual: "chapter-title",
      say: "[warm] Time to swap sides. The boss wants the weekly chart to look as good as it can. You've got the tools. And you can't change a single number.",
      caption: "Time to swap sides. The boss wants the chart to look as good as it can. You can't change a single number.",
      audio: "media/audio/ch3/c3-01.mp3",
    },
    {
      id: "c3-02",
      type: "story",
      speaker: "boss",
      visual: "boss-at-noticeboard",
      say: "[upbeat] Right, I need a chart for head office. Make Line 3 look like it's flying. Don't change any numbers, mind. Just present it nicely.",
      caption: "\"I need a chart for head office. Make Line 3 look like it's flying. Don't change any numbers. Just present it nicely.\"",
      audio: "media/audio/ch3/c3-02.mp3",
    },

    // ── The maker: three switches, a live "looks like / really" meter, then show the boss ──
    {
      id: "c3-03",
      type: "maker",
      speaker: "guide",
      chart: { measure: "unitsProduced", targetLine: true },
      tools: {
        weeks: [
          { id: "all", label: "All 12 weeks", weeks: "all" },
          { id: "no7", label: "Leave out week 7", weeks: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12] },
          { id: "last5", label: "Weeks 8 to 12", weeks: [8, 9, 10, 11, 12] },
        ],
        scale: [
          { id: "zero", label: "From 0", axisFrom: 0 },
          { id: "high", label: "From 4,800", axisFrom: 4800 },
        ],
        headline: [
          { id: "plain", label: "Line 3 output" },
          { id: "flying", label: "Line 3 is flying!" },
          { id: "target", label: "Line 3 beats target 3 weeks running" },
        ],
      },
      say: "Use the three switches under the chart. Pick the weeks, pick where the scale starts, and pick a headline. Watch the meter. When you're happy, show the boss.",
      caption: "Use the switches: pick the weeks, where the scale starts, and a headline. Watch the meter. Then show the boss.",
      audio: "media/audio/ch3/c3-03.mp3",
      boss: {
        flat: {
          speaker: "boss",
          say: "[unimpressed] Hmm. Looks a bit flat, doesn't it?",
          caption: "\"Hmm. Looks a bit flat, doesn't it?\"",
          audio: "media/audio/ch3/c3-03-flat.mp3",
        },
        happy: {
          speaker: "boss",
          say: "[delighted] Beauty! Head office is going to love that.",
          caption: "\"Beauty! Head office is going to love that.\"",
          audio: "media/audio/ch3/c3-03-happy.mp3",
        },
      },
    },

    // ── The reveal: their chart next to all the numbers, and what each switch hid ──
    {
      id: "c3-04",
      type: "reveal",
      speaker: "guide",
      say: "Now, here's the thing. Every number on your chart was true. Let's put it next to all the numbers and see what changed.",
      caption: "Every number on your chart was true. Here it is next to all the numbers.",
      audio: "media/audio/ch3/c3-04.mp3",
      notes: {
        no7: {
          say: "You left out week 7. The worst week just disappeared.",
          caption: "You left out week 7. The worst week just disappeared.",
          audio: "media/audio/ch3/c3-04-no7.mp3",
        },
        last5: {
          say: "You only showed weeks 8 to 12. Seven weeks under target just disappeared.",
          caption: "You only showed weeks 8 to 12. Seven weeks under target disappeared.",
          audio: "media/audio/ch3/c3-04-last5.mp3",
        },
        high: {
          say: "You started the scale at four thousand, eight hundred. A small rise now looks huge.",
          caption: "You started the scale at 4,800. A small rise now looks huge.",
          audio: "media/audio/ch3/c3-04-high.mp3",
        },
        flying: {
          say: "Your headline did the talking. Flying isn't a number.",
          caption: "Your headline did the talking. \"Flying\" isn't a number.",
          audio: "media/audio/ch3/c3-04-flying.mp3",
        },
        target: {
          say: "Your headline is true. But those were the overtime weeks. More hours, same target.",
          caption: "Your headline is true. But those were the overtime weeks: more hours, same target.",
          audio: "media/audio/ch3/c3-04-target.mp3",
        },
        honest: {
          say: "You kept it honest. The boss might grumble, but your chart tells the whole story.",
          caption: "You kept it honest. The boss might grumble, but your chart tells the whole story.",
          audio: "media/audio/ch3/c3-04-honest.mp3",
        },
      },
    },

    // ── Spot it: someone else's chart, four things to find, two needed ──
    {
      id: "c3-05",
      type: "spot",
      speaker: "guide",
      // fault calls, weeks 8–12: 20, 16, 15, 14, 13
      chart: { measure: "faultCalls", weeks: [8, 9, 10, 11, 12], axisFrom: 12, heading: "Fault calls slashed!" },
      note: "From week 10, fault calls are logged on a new form.",
      need: 2,
      say: "Now spot it in someone else's chart. This one's about fault calls. Tap anything that looks fishy. Find at least two.",
      caption: "Spot it in someone else's chart. Tap anything that looks fishy. Find at least two.",
      audio: "media/audio/ch3/c3-05.mp3",
      spots: {
        heading: {
          label: "The headline",
          say: "The headline says slashed. It went from twenty to thirteen. That's seven fewer calls. Better, but not slashed.",
          caption: "\"Slashed\"? It went from 20 to 13. That's 7 fewer calls. Better, but not slashed.",
          audio: "media/audio/ch3/c3-05-heading.mp3",
        },
        axis: {
          label: "The scale",
          say: "The scale starts at twelve, not zero. So a drop of seven looks like the calls nearly vanished.",
          caption: "The scale starts at 12, not zero. A drop of 7 looks like the calls nearly vanished.",
          audio: "media/audio/ch3/c3-05-axis.mp3",
        },
        weeks: {
          label: "The weeks",
          say: "Only five weeks are shown. What happened before week 8? You can't tell from this chart.",
          caption: "Only weeks 8 to 12 are shown. What happened before week 8? You can't tell.",
          audio: "media/audio/ch3/c3-05-weeks.mp3",
        },
        note: {
          label: "The note",
          say: "And from week 10, fault calls went on a new form. The drop might be the form, not the line.",
          caption: "From week 10, fault calls went on a new form. The drop might be the form, not the line.",
          audio: "media/audio/ch3/c3-05-note.mp3",
        },
      },
      hint: {
        say: "Have a look around the edges. The headline, the scale, the weeks, and any notes.",
        caption: "Look around the edges: the headline, the scale, the weeks, and any notes.",
        audio: "media/audio/ch3/c3-05-hint.mp3",
      },
    },

    {
      id: "c3-06",
      type: "chapter-end",
      speaker: "guide",
      say: "[warm] Nice work. You've seen how it's done from the inside, so now you'll spot it a mile off. Watch for weeks left out, a scale that doesn't start at zero, and a headline doing the talking. And always check the notes.",
      caption: "Watch for weeks left out, a scale that doesn't start at zero, and a headline doing the talking. And always check the notes.",
      audio: "media/audio/ch3/c3-06.mp3",
    },
  ],
};
