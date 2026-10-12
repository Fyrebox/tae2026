// Chapter 1 — Read it (about 4 minutes)
// Outcome 1: read a simple table and chart and say in plain words what they show.
// Flow: read the table (worked example, then try) → the words on the sheet → higher is good or bad →
// the same numbers as a chart (worked example, then slide through) → say it in plain words.
// say: text sent to the voice (expressive tags, numbers in words). caption: text shown on screen.
// Every card with audio shows a replay button. All figures come from line3-data.js.
window.MODULE_CONTENT = window.MODULE_CONTENT || {};
window.MODULE_CONTENT.chapter1 = {
  id: "ch1",
  title: "Read it",
  minutes: 4,
  cards: [
    {
      id: "c1-01",
      type: "story",
      speaker: "guide",
      visual: "chapter-title",
      say: "[warm] Let's get comfortable reading the sheet. Every number on it answers a simple question. You just need to know where to look.",
      caption: "Let's get comfortable reading the sheet. Every number answers a simple question. You just need to know where to look.",
      audio: "media/audio/ch1/c1-01.mp3",
    },

    // ── Reading the table ─────────────────────────────────────────────────
    {
      id: "c1-02",
      type: "table-example",
      speaker: "guide",
      highlight: { week: 3, column: "unitsProduced" },
      // each step lights up when the voice reaches the phrase
      cues: [
        { at: "Find the week", show: "row" },
        { at: "Then go across", show: "column" },
        { at: "So in week 3", show: "cell" },
      ],
      say: "Here's how to read it. Find the week on the left. Then go across to the column you want. Week 3, units produced: four thousand, eight hundred and seventy. So in week 3, the line made four thousand, eight hundred and seventy housings.",
      caption: "Find the week on the left. Go across to the column you want. Week 3, units produced: 4,870. So in week 3, the line made 4,870 housings.",
      audio: "media/audio/ch1/c1-02.mp3",
    },
    {
      id: "c1-03",
      type: "table-tap",
      speaker: "guide",
      target: { week: 9, column: "downtimeHrs" },
      say: "Your turn. How many hours was the line stopped in week 9? Find it and tap the number.",
      caption: "Your turn. How many hours was the line stopped in week 9? Tap the number.",
      audio: "media/audio/ch1/c1-03.mp3",
      responses: {
        found: {
          say: "[pleased] That's the one. Eleven. In week 9, the line was stopped for eleven hours.",
          caption: "That's the one: 11. In week 9, the line was stopped for 11 hours.",
          audio: "media/audio/ch1/c1-03-found.mp3",
        },
        other: {
          // the app adds what the tapped cell says, then lights up week 9's row
          say: "Find week 9 on the left, then go across to downtime.",
          caption: "That's week {week}, {label}: {value}. Find week 9 on the left, then go across to Downtime.",
          audio: "media/audio/ch1/c1-03-other.mp3",
        },
      },
    },

    // ── The words on the sheet ────────────────────────────────────────────
    {
      id: "c1-04",
      type: "terms",
      speaker: "guide",
      say: "Different sites use different words for the same thing. Tap each one to see what it means, and what else you might hear it called.",
      caption: "Different sites use different words for the same thing. Tap each one to see what it means.",
      audio: "media/audio/ch1/c1-04.mp3",
      terms: [
        {
          column: "unitsProduced",
          meaning: "How many brake housings came off the line.",
          alsoCalled: ["Output", "Production", "Units made"],
          say: "Units produced. How many brake housings came off the line. You might also hear output, or production.",
          audio: "media/audio/ch1/c1-04-units.mp3",
        },
        {
          column: "target",
          meaning: "How many the line is meant to make each week.",
          alsoCalled: ["Goal", "Plan", "Quota"],
          say: "Target. How many the line is meant to make each week. You might also hear goal, plan, or quota.",
          audio: "media/audio/ch1/c1-04-target.mp3",
        },
        {
          column: "downtimeHrs",
          meaning: "Hours the line wasn't running.",
          alsoCalled: ["Stoppages", "Lost time", "Line down"],
          say: "Downtime. The hours the line wasn't running. You might also hear stoppages, or lost time.",
          audio: "media/audio/ch1/c1-04-downtime.mp3",
        },
        {
          column: "faultCalls",
          meaning: "Times someone called in a problem with the line.",
          alsoCalled: ["Breakdowns", "Call-outs", "Maintenance calls"],
          say: "Fault calls. The times someone called in a problem with the line. You might also hear breakdowns, or call-outs.",
          audio: "media/audio/ch1/c1-04-faults.mp3",
        },
        {
          column: "scrapPct",
          meaning: "Housings thrown out because they weren't good enough, out of every 100 made.",
          alsoCalled: ["Rejects", "Waste", "Defects"],
          say: "Scrap. Housings thrown out because they weren't good enough, out of every hundred made. You might also hear rejects, or waste.",
          audio: "media/audio/ch1/c1-04-scrap.mp3",
        },
      ],
    },

    // ── Higher is good, or higher is bad ──────────────────────────────────
    {
      id: "c1-05",
      type: "sort",
      speaker: "guide",
      piles: { left: "Higher is bad", right: "Higher is good" },
      say: "For some numbers, higher is good. For others, higher is bad. Swipe each card, or tap a button, to sort them.",
      caption: "For some numbers, higher is good. For others, higher is bad. Swipe each card or tap a button.",
      audio: "media/audio/ch1/c1-05.mp3",
      items: [
        {
          column: "unitsProduced",
          pile: "right",
          say: "Housings made. Higher is good. More housings off the line.",
          caption: "Higher is good: more housings off the line.",
          audio: "media/audio/ch1/c1-05-units.mp3",
        },
        {
          column: "downtimeHrs",
          pile: "left",
          say: "Hours stopped. Higher is bad. Every hour stopped is an hour not making housings.",
          caption: "Higher is bad: every hour stopped is an hour not making housings.",
          audio: "media/audio/ch1/c1-05-downtime.mp3",
        },
        {
          column: "scrapPct",
          pile: "left",
          say: "Scrap. Higher is bad. More housings end up in the bin.",
          caption: "Higher is bad: more housings end up in the bin.",
          audio: "media/audio/ch1/c1-05-scrap.mp3",
        },
        {
          column: "faultCalls",
          pile: "left",
          say: "Fault calls. Higher usually means more problems on the line. Usually. We'll come back to that one.",
          caption: "Higher usually means more problems on the line. Usually. We'll come back to that one.",
          audio: "media/audio/ch1/c1-05-faults.mp3",
        },
      ],
    },

    // ── The same numbers as a chart ───────────────────────────────────────
    {
      id: "c1-06",
      type: "worked-example",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0, targetLine: true, highlight: 3 },
      say: "Here are the same numbers as a chart. Each bar is one week. The taller the bar, the more housings. Here's week 3 again, four thousand, eight hundred and seventy. The line across is the target, five thousand. Week 3 sits just under it.",
      caption: "The same numbers as a chart. Each bar is one week. Week 3: 4,870. The line across is the target, 5,000. Week 3 sits just under it.",
      audio: "media/audio/ch1/c1-06.mp3",
    },
    {
      id: "c1-07",
      type: "scrub",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0, targetLine: true },
      weeksToVisit: 3, // Next unlocks after three different weeks
      say: "Slide your finger along the chart. I'll tell you about each week.",
      caption: "Slide your finger along the chart, or tap a bar. I'll tell you about each week.",
      audio: "media/audio/ch1/c1-07.mp3",
      weeks: {
        1: { say: "Week 1. Four thousand, eight hundred and twenty made. A hundred and eighty short of the target.", caption: "Week 1: 4,820 made. 180 short of the target.", audio: "media/audio/ch1/c1-07-w01.mp3" },
        2: { say: "Week 2. Four thousand, nine hundred and ten made. Ninety short of the target.", caption: "Week 2: 4,910 made. 90 short of the target.", audio: "media/audio/ch1/c1-07-w02.mp3" },
        3: { say: "Week 3. Four thousand, eight hundred and seventy made. A hundred and thirty short of the target.", caption: "Week 3: 4,870 made. 130 short of the target.", audio: "media/audio/ch1/c1-07-w03.mp3" },
        4: { say: "Week 4. Four thousand, nine hundred and fifty made. Fifty short of the target.", caption: "Week 4: 4,950 made. 50 short of the target.", audio: "media/audio/ch1/c1-07-w04.mp3" },
        5: { say: "Week 5. Four thousand, seven hundred and eighty made. Two hundred and twenty short of the target.", caption: "Week 5: 4,780 made. 220 short of the target.", audio: "media/audio/ch1/c1-07-w05.mp3" },
        6: { say: "Week 6. Four thousand, nine hundred and ninety made. Just ten short of the target.", caption: "Week 6: 4,990 made. Just 10 short of the target.", audio: "media/audio/ch1/c1-07-w06.mp3" },
        7: { say: "Week 7. Three thousand, six hundred and fifty made. One thousand, three hundred and fifty short. That's the storm week.", caption: "Week 7: 3,650 made. 1,350 short. That's the storm week.", audio: "media/audio/ch1/c1-07-w07.mp3" },
        8: { say: "Week 8. Four thousand, eight hundred and eighty made. A hundred and twenty short of the target.", caption: "Week 8: 4,880 made. 120 short of the target.", audio: "media/audio/ch1/c1-07-w08.mp3" },
        9: { say: "Week 9. Four thousand, nine hundred and thirty made. Seventy short of the target.", caption: "Week 9: 4,930 made. 70 short of the target.", audio: "media/audio/ch1/c1-07-w09.mp3" },
        10: { say: "Week 10. Five thousand, one hundred and twenty made. A hundred and twenty over the target.", caption: "Week 10: 5,120 made. 120 over the target.", audio: "media/audio/ch1/c1-07-w10.mp3" },
        11: { say: "Week 11. Five thousand and eighty made. Eighty over the target.", caption: "Week 11: 5,080 made. 80 over the target.", audio: "media/audio/ch1/c1-07-w11.mp3" },
        12: { say: "Week 12. Five thousand, one hundred and fifty made. A hundred and fifty over the target.", caption: "Week 12: 5,150 made. 150 over the target.", audio: "media/audio/ch1/c1-07-w12.mp3" },
      },
    },

    // ── Say it in plain words ─────────────────────────────────────────────
    {
      id: "c1-08",
      type: "worked-example",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0, targetLine: true, highlights: [10, 11, 12] },
      say: "Now let's say what the chart shows, in plain words. Here's one. Weeks 10 to 12 made more than the target. Short and simple. That's all it takes.",
      caption: "Say what the chart shows in plain words. For example: \"Weeks 10 to 12 made more than the target.\"",
      audio: "media/audio/ch1/c1-08.mp3",
    },
    {
      id: "c1-09",
      type: "sentence",
      speaker: "guide",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0, targetLine: true },
      // tap a word to swap it; any sentence the chart backs up counts
      slots: [
        ["Week 7", "Week 12"],
        ["the fewest", "the most"],
      ],
      template: "{0} made {1} housings.",
      start: [0, 1], // opens as "Week 7 made the most housings.", which the chart doesn't back up
      truths: {
        "Week 7|the fewest": { week: 7, say: "[pleased] Spot on. Week 7 made the fewest housings. Shortest bar on the chart.", caption: "Spot on. Week 7 made the fewest: shortest bar on the chart.", audio: "media/audio/ch1/c1-09-w7.mp3" },
        "Week 12|the most": { week: 12, say: "[pleased] Spot on. Week 12 made the most housings. Tallest bar on the chart.", caption: "Spot on. Week 12 made the most: tallest bar on the chart.", audio: "media/audio/ch1/c1-09-w12.mp3" },
      },
      notYet: {
        say: "Have a look at the chart. Does that match the bars? Try swapping a word.",
        caption: "Have a look at the chart. Does that match the bars? Try swapping a word.",
        audio: "media/audio/ch1/c1-09-check.mp3",
      },
      say: "Your turn. Tap a word to swap it, until the sentence matches the chart. Then tap Check.",
      caption: "Your turn. Tap a word to swap it until the sentence matches the chart. Then tap Check.",
      audio: "media/audio/ch1/c1-09.mp3",
    },

    {
      id: "c1-10",
      type: "chapter-end",
      speaker: "guide",
      say: "[warm] Good work. You can read the sheet across and down, you know the words, and you can say what a chart shows in plain words. Next, we'll look at how the same numbers can paint different pictures.",
      caption: "You can read the sheet, you know the words, and you can say what a chart shows in plain words.",
      audio: "media/audio/ch1/c1-10.mp3",
    },
  ],
};
