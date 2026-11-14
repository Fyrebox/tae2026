// Session 3 workplace game: a day at a hair salon (/hairdresser). The story and choices are in hairdresser.ink;
// this file holds what the page shows beside it: the salon's AI rules, the three option cards and the report checklist.
// The salon and its costs are made up for the course.
export const GAME = {
  key: "hairdresser",
  path: "/hairdresser",
  title: "A day at the salon",
  place: "Harbour Hair Studio",
  manager: "the salon owner",
  budget: { setup: 3000, monthly: 150 },
  // The four people who can appear on screen. "you" never appears: your replies are the buttons.
  cast: {
    owner: { name: "Salon owner", look: "owner" },
    client: { name: "Jess, a client", look: "client" },
  },
  rules: [
    "Client photos only with the client's consent, and deleted when no longer needed.",
    "No client details in free AI tools: use approved business tools, and only the data needed.",
    "A person checks every message before it goes to a client.",
  ],
  laws: "Privacy Act 1988: client details are personal information, and dye allergy notes are health information.",
  // One AI, one ML and one DL option. The ink story fills in what each one solves and its main risk.
  cards: [
    { id: "ai", type: "AI", kind: "an assistant that works with text", title: "Message helper", product: "Microsoft Copilot",
      text: "Drafts replies to Instagram and booking messages. A staff member checks each one, then sends it.",
      setup: 100, monthly: 45, effort: "Low",
      problem: "Instagram and booking messages pile up while we're busy, so clients book somewhere else.", data: "The salon's prices, opening hours and services" },
    { id: "ml", type: "ML", kind: "predicts from past data", title: "No-show predictor", product: "an add-on to the salon's booking software",
      text: "Learns from past bookings who might not turn up, so the salon can send them an extra reminder.",
      setup: 500, monthly: 40, effort: "Medium",
      problem: "About six clients a week don't turn up, and that costs us around $600 a week.", data: "Two or more years of booking records (the salon has three)" },
    { id: "dl", type: "DL", kind: "works with pictures", title: "Colour try-on", product: "L'Oréal ModiFace",
      text: "Shows clients their selfie with a new hair colour before it is dyed.",
      setup: 2500, monthly: 120, effort: "High",
      problem: "Some colour clients don't like the result, and we redo it for free.", data: "Clients' selfies, taken with their consent" },
  ],
  checklist: [
    "It names the technology I recommend",
    "It compares all three options",
    "It follows the salon's AI rules and the Privacy Act",
    "It includes the change the owner asked for",
  ],
};
