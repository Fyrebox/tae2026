// Session 3 workplace game: a day on a building site (/constructionworker). The story and choices are in
// constructionworker.ink; this file holds what the page shows beside it. The builder and its costs are made up.
export const GAME = {
  key: "constructionworker",
  path: "/constructionworker",
  title: "A day on the building site",
  place: "Bayline Builders, Armstrong Creek site",
  manager: "the site supervisor",
  intro: "You work on a Bayline Builders housing site, and you're the one everyone asks about phones, tablets and apps. The site supervisor needs one AI idea, and has one minute to hear it.",
  madeUp: "The builder, the site and its costs are made up.",
  rulesTitle: "Bayline Builders' AI rules",
  pitchLevel: "Pitch the supervisor",
  // The safety camera is the most costly and needs the most set-up: not one to start with.
  startable: ["ai", "ml"],
  budget: { setup: 6000, monthly: 400 },
  cast: {
    supervisor: { name: "Site supervisor", look: "supervisor" },
    apprentice: { name: "Kai, an apprentice", look: "apprentice" },
  },
  rules: [
    "AI can draft safety documents, but never approve them: a competent person checks and signs every SWMS and toolbox talk before work starts.",
    "No worker, client or site details in free AI tools: use the company's approved business tools, and only the data needed.",
    "Cameras only where workers have been told in writing, and only for safety, never to watch what individual workers do.",
  ],
  laws: "Victoria's Occupational Health and Safety Act 2004 and OHS Regulations 2017: high-risk construction work needs a SWMS before it starts. Privacy Act 1988: worker and client details are personal information. Victoria's Surveillance Devices Act 1999 covers cameras.",
  // One AI, one ML and one DL option. The ink story fills in what each one solves and its main risk.
  cards: [
    { id: "ai", type: "AI", kind: "an assistant that works with text", title: "Safety paperwork helper", product: "Microsoft Copilot",
      text: "Drafts SWMS, toolbox talks and the site diary from the supervisor's notes. The supervisor checks and signs each one before work starts.",
      setup: 100, monthly: 45, effort: "Low",
      problem: "Writing SWMS, toolbox talks and the site diary takes the supervisor about an hour after every shift.",
      data: "The supervisor's notes and the company's SWMS templates" },
    { id: "ml", type: "ML", kind: "predicts from past data", title: "Delay predictor", product: "an add-on to the company's project-management software",
      text: "Learns from past jobs, deliveries and the weather forecast which tasks are likely to run late, so we can plan around them.",
      setup: 2000, monthly: 150, effort: "Medium",
      problem: "Rain and late deliveries keep pushing jobs behind, and every day late costs us about $1,500.",
      data: "Three or more years of past job schedules and deliveries (we have six)" },
    { id: "dl", type: "DL", kind: "works with pictures", title: "Site safety camera", product: "a site camera system with AI safety alerts",
      text: "Cameras on site spot people without a hard hat or hi-vis, or near an open edge, and send the supervisor an alert.",
      setup: 5000, monthly: 300, effort: "High",
      problem: "We keep having near misses: people without a hard hat, or too close to an open edge.",
      data: "Live video from the site, with workers told in writing" },
  ],
  checklist: [
    "It names the technology I recommend",
    "It compares all three options",
    "It follows the company's AI rules, OHS law and the Privacy Act",
    "It includes the change the supervisor asked for",
  ],
};
