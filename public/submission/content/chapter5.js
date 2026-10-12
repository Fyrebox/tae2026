// Chapter 5 — Your question kit (about 1 minute)
// The take-away: three questions and one chart check, a picture of what the learner has built,
// the same confidence check as the warm-up, and a send-off.
window.MODULE_CONTENT = window.MODULE_CONTENT || {};
window.MODULE_CONTENT.chapter5 = {
  id: "ch5",
  title: "Your question kit",
  minutes: 1,
  cards: [
    {
      id: "c5-01",
      type: "story",
      speaker: "guide",
      visual: "chapter-title",
      say: "[warm] Last bit. Here's your question kit. Three questions to ask before you act on any number, on any site.",
      caption: "Last bit. Your question kit: three questions to ask before you act on any number, on any site.",
      audio: "media/audio/ch5/c5-01.mp3",
    },
    {
      id: "c5-02",
      type: "kit",
      speaker: "guide",
      say: "Here's your kit. Tap any card to hear it again. Take a photo or a screenshot, so you've always got it.",
      caption: "Tap any card to hear it again. Take a photo or screenshot so you've always got it.",
      audio: "media/audio/ch5/c5-02.mp3",
      items: [
        {
          question: "Is this a normal week?",
          detail: "One odd week, like a storm, can drag the whole average.",
          say: "Is this a normal week? One odd week, like a storm, can drag the whole average.",
          audio: "media/audio/ch5/c5-02-normal.mp3",
        },
        {
          question: "Was it counted the same way?",
          detail: "A new form or a new rule can change the numbers without changing the work.",
          say: "Was it counted the same way? A new form or a new rule can change the numbers without changing the work.",
          audio: "media/audio/ch5/c5-02-counted.mp3",
        },
        {
          question: "Is it a fair comparison?",
          detail: "Extra hours or extra shifts can make a line look faster than it is.",
          say: "Is it a fair comparison? Extra hours or extra shifts can make a line look faster than it is.",
          audio: "media/audio/ch5/c5-02-fair.mp3",
        },
        {
          question: "On any chart, check:",
          detail: "Where the scale starts. Which weeks are shown. What the headline is doing.",
          chartCheck: true,
          say: "And on any chart, check three things. Where the scale starts, which weeks are shown, and what the headline is doing.",
          audio: "media/audio/ch5/c5-02-chart.mp3",
        },
      ],
    },
    {
      id: "c5-03",
      type: "bloom",
      speaker: "guide",
      // one branch per chapter; a branch lights up once its chapter is done, and never dims again
      branches: [
        { chapter: "ch1", skills: ["Read across and down", "Know the words", "Say it plainly"] },
        { chapter: "ch2", skills: ["One odd week", "Scale from zero", "Percent or count"] },
        { chapter: "ch3", skills: ["Weeks left out", "Headlines that talk", "Check the notes"] },
        { chapter: "ch4", skills: ["Counted the same way?", "Fair comparison?", "How many hours?"] },
      ],
      say: "[warm] Look at what you've built. Every branch is something you can now spot on a sheet. And none of it goes away.",
      caption: "Look at what you've built. Every branch is something you can now spot on a sheet.",
      audio: "media/audio/ch5/c5-03.mp3",
    },
    {
      id: "c5-04",
      type: "confidence",
      when: "after", // compares with the warm-up answer
      speaker: "guide",
      say: "Same question as the start. How sure do you feel reading numbers like these now?",
      caption: "Same question as the start. How sure do you feel reading numbers like these now?",
      audio: "media/audio/ch5/c5-04.mp3",
      options: ["Not sure at all", "A bit unsure", "Okay", "Fairly sure", "Very sure"],
      responses: {
        up: {
          say: "[pleased] You feel more sure than when you started. Good on you.",
          caption: "You feel more sure than when you started. Good on you.",
          audio: "media/audio/ch5/c5-04-up.mp3",
        },
        same: {
          say: "About the same as the start. That's fine. The questions in your kit do the heavy lifting.",
          caption: "About the same as the start. That's fine. The questions in your kit do the heavy lifting.",
          audio: "media/audio/ch5/c5-04-same.mp3",
        },
        down: {
          say: "A bit less sure than at the start? That's normal. You know what to look for now, and that makes numbers look trickier. That's a good thing.",
          caption: "A bit less sure than at the start? That's normal. You know what to look for now, and that makes numbers look trickier. That's a good thing.",
          audio: "media/audio/ch5/c5-04-down.mp3",
        },
        none: {
          say: "Thanks for telling me.",
          caption: "Thanks for telling me.",
          audio: "media/audio/ch5/c5-04-none.mp3",
        },
      },
    },
    {
      id: "c5-05",
      type: "chapter-end",
      speaker: "guide",
      say: "[warm] That's the lot. Next time the sheet goes up on the noticeboard, you'll know how to read it, and what to ask. Good on you.",
      caption: "That's the lot. Next time the sheet goes up, you'll know how to read it, and what to ask.",
      audio: "media/audio/ch5/c5-05.mp3",
    },
  ],
};
