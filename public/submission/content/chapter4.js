// Chapter 4 — Ask before you act (about 4 minutes)
// Outcome 3: decide what question to ask before acting on the numbers.
// Three scenes, getting harder: the boss decides from the numbers twice (pick Go with it / Ask first / Push back,
// and if asking, which question), then a mate spots an odd number and the learner decides what to do about it.
// Consequences are told in words only: no new figures are invented. Every path ends with what an experienced operator would ask.
window.MODULE_CONTENT = window.MODULE_CONTENT || {};
window.MODULE_CONTENT.chapter4 = {
  id: "ch4",
  title: "Ask before you act",
  minutes: 4,
  cards: [
    {
      id: "c4-01",
      type: "story",
      speaker: "guide",
      visual: "chapter-title",
      say: "[warm] Numbers get used to make decisions. Shifts, targets, who gets the blame. Here are three moments from the floor. You decide what to do.",
      caption: "Numbers get used to make decisions: shifts, targets, who gets the blame. Three moments from the floor. You decide.",
      audio: "media/audio/ch4/c4-01.mp3",
    },

    // ── Scene 1: fault calls are down, but the form changed (measured differently) ──
    {
      id: "c4-02",
      type: "scene",
      speaker: "boss",
      who: "The boss",
      chart: { measure: "faultCalls", weeks: "all", axisFrom: 0 },
      supervisorNotes: true,
      say: "[upbeat] Good news. Fault calls are down to thirteen a week. So I reckon we pull maintenance off the Saturday shift.",
      caption: "\"Fault calls are down to 13 a week. So I reckon we pull maintenance off the Saturday shift.\"",
      audio: "media/audio/ch4/c4-02.mp3",
      options: [
        {
          label: "Go with it",
          speaker: "guide",
          say: "Maintenance comes off Saturdays. If the drop was only the new form, the faults are still there. One breakdown on a Saturday, and the line sits idle till Monday.",
          caption: "Maintenance comes off Saturdays. If the drop was only the new form, the faults are still there. One Saturday breakdown, and the line sits idle till Monday.",
          audio: "media/audio/ch4/c4-02-go.mp3",
        },
        {
          label: "Ask first",
          speaker: "guide",
          say: "Good move. What would you ask?",
          caption: "Good move. What would you ask?",
          audio: "media/audio/ch4/c4-02-ask.mp3",
          questions: [
            {
              label: "Did the new form change what gets counted?",
              speaker: "guide",
              say: "The boss checks with maintenance before deciding. If the new form counts fewer things, the drop isn't real. Nobody gets moved until they know.",
              caption: "The boss checks with maintenance first. If the new form counts fewer things, the drop isn't real. Nobody gets moved until they know.",
              audio: "media/audio/ch4/c4-02-q-form.mp3",
            },
            {
              label: "Who's been making all the fault calls?",
              speaker: "guide",
              say: "People feel blamed and stop calling faults in. The numbers look even better, and they're even less true.",
              caption: "People feel blamed and stop calling faults in. The numbers look even better, and they're even less true.",
              audio: "media/audio/ch4/c4-02-q-who.mp3",
            },
            {
              label: "What happened in week 7?",
              speaker: "guide",
              say: "Week 7 was the storm. Worth knowing, but it doesn't tell you whether thirteen is real.",
              caption: "Week 7 was the storm. Worth knowing, but it doesn't tell you whether 13 is real.",
              audio: "media/audio/ch4/c4-02-q-week7.mp3",
            },
          ],
        },
        {
          label: "Push back",
          speaker: "guide",
          say: "You say it's a bad idea. The boss asks why. Without a reason, it's your gut against his numbers. A good question would do more.",
          caption: "You say it's a bad idea. The boss asks why. Without a reason, it's your gut against his numbers. A good question would do more.",
          audio: "media/audio/ch4/c4-02-push.mp3",
        },
      ],
      model: {
        speaker: "guide",
        say: "An experienced operator would ask: was it counted the same way before and after?",
        caption: "Good question: \"Was it counted the same way before and after?\"",
        audio: "media/audio/ch4/c4-02-model.mp3",
      },
    },

    // ── Scene 2: over target, but with overtime (unfair comparison) ──
    {
      id: "c4-03",
      type: "scene",
      speaker: "boss",
      who: "The boss",
      chart: { measure: "unitsProduced", weeks: "all", axisFrom: 0, targetLine: true },
      supervisorNotes: true,
      say: "[pleased] Three weeks over target! Line 3's never run better. From next month, the target goes up to fifty-two hundred.",
      caption: "\"Three weeks over target! Line 3's never run better. From next month, the target goes up to 5,200.\"",
      audio: "media/audio/ch4/c4-03.mp3",
      options: [
        {
          label: "Go with it",
          speaker: "guide",
          say: "The new target sticks. When the Saturday shifts stop, the line misses it every week, and the team cops the blame.",
          caption: "The new target sticks. When the Saturday shifts stop, the line misses it every week, and the team cops the blame.",
          audio: "media/audio/ch4/c4-03-go.mp3",
        },
        {
          label: "Ask first",
          speaker: "guide",
          say: "Good move. What would you ask?",
          caption: "Good move. What would you ask?",
          audio: "media/audio/ch4/c4-03-ask.mp3",
          questions: [
            {
              label: "How many hours did we run in those weeks?",
              speaker: "guide",
              say: "The boss twigs. Those were the overtime weeks. More hours, not a faster line. The target stays put until there's a fair comparison.",
              caption: "The boss twigs: those were the overtime weeks. More hours, not a faster line. The target stays put until there's a fair comparison.",
              audio: "media/audio/ch4/c4-03-q-hours.mp3",
            },
            {
              label: "Which week was our best?",
              speaker: "guide",
              say: "Week 12, at five thousand, one hundred and fifty. True, but it doesn't tell you why.",
              caption: "Week 12, at 5,150. True, but it doesn't tell you why.",
              audio: "media/audio/ch4/c4-03-q-best.mp3",
            },
            {
              label: "Who worked the Saturdays?",
              speaker: "guide",
              say: "Good to know, but it doesn't tell you whether the line got any faster.",
              caption: "Good to know, but it doesn't tell you whether the line got any faster.",
              audio: "media/audio/ch4/c4-03-q-who.mp3",
            },
          ],
        },
        {
          label: "Push back",
          speaker: "guide",
          say: "You say the new target's too high. Fair enough, but too high is just an opinion. Asking about the hours would show why.",
          caption: "You say the new target's too high. Fair enough, but \"too high\" is just an opinion. Asking about the hours would show why.",
          audio: "media/audio/ch4/c4-03-push.mp3",
        },
      ],
      model: {
        speaker: "guide",
        say: "An experienced operator would ask: is it a fair comparison? Same hours, same conditions?",
        caption: "Good question: \"Is it a fair comparison? Same hours, same conditions?\"",
        audio: "media/audio/ch4/c4-03-model.mp3",
      },
    },

    // ── Scene 3: a number that doesn't add up; the learner decides what to do (no boss, no hints) ──
    {
      id: "c4-04",
      type: "scene",
      speaker: "guide",
      who: "Your mate on the line",
      visual: "week7-figures",
      say: "[curious] Hang on. Week 7 says thirty-eight hours of downtime. That's a whole working week. But they still made three thousand, six hundred and fifty. Reckon someone's fudged it?",
      caption: "\"Week 7 says 38 hours of downtime. That's a whole working week. But they still made 3,650. Reckon someone's fudged it?\"",
      audio: "media/audio/ch4/c4-04.mp3",
      options: [
        {
          label: "Yeah, it's rigged",
          speaker: "guide",
          say: "By smoko, half the floor reckons the sheet is rigged. Now nobody trusts any of it, even the numbers that are right.",
          caption: "By smoko, half the floor reckons the sheet is rigged. Now nobody trusts any of it, even the numbers that are right.",
          audio: "media/audio/ch4/c4-04-rigged.mp3",
        },
        {
          label: "Ask the supervisor",
          speaker: "guide",
          say: "The supervisor checks. Either the line runs more hours than we thought, or the number gets fixed. Both ways, the sheet gets better.",
          caption: "The supervisor checks. Either the line runs more hours than we thought, or the number gets fixed. Both ways, the sheet gets better.",
          audio: "media/audio/ch4/c4-04-ask.mp3",
        },
        {
          label: "Not my problem",
          speaker: "guide",
          say: "Nothing happens. The odd number stays on the board, and the next person scratches their head too.",
          caption: "Nothing happens. The odd number stays on the board, and the next person scratches their head too.",
          audio: "media/audio/ch4/c4-04-ignore.mp3",
        },
      ],
      model: {
        speaker: "guide",
        say: "An experienced operator would ask: how many hours does the line actually run? An odd number isn't always a lie. Sometimes something's missing.",
        caption: "Good question: \"How many hours does the line actually run?\" An odd number isn't always a lie. Sometimes something's missing.",
        audio: "media/audio/ch4/c4-04-model.mp3",
      },
    },

    {
      id: "c4-05",
      type: "chapter-end",
      speaker: "guide",
      say: "[warm] Good on you. Before you act on a number, ask a question. Is it a normal week? Was it counted the same way? Is it a fair comparison? Next up, your question kit to keep.",
      caption: "Before you act on a number, ask: Is it a normal week? Was it counted the same way? Is it a fair comparison?",
      audio: "media/audio/ch4/c4-05.mp3",
    },
  ],
};
