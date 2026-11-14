// Session 3 workplace game: a day in a restaurant kitchen (/chef). The story and choices are in chef.ink;
// this file holds what the page shows beside it. The restaurant and its costs are made up.
export const GAME = {
  key: "chef",
  path: "/chef",
  title: "A day in the kitchen",
  place: "The Pier Kitchen",
  manager: "the restaurant owner",
  intro: "You're a chef at The Pier Kitchen, and the one everyone asks about computers and apps. The owner needs one AI idea, and has one minute to hear it.",
  madeUp: "The restaurant and its costs are made up.",
  rulesTitle: "The restaurant's AI rules",
  pitchLevel: "Pitch the owner",
  // The bin camera is the most costly and needs the most set-up: not one to start with.
  startable: ["ai", "ml"],
  budget: { setup: 4000, monthly: 250 },
  cast: {
    owner: { name: "Restaurant owner", look: "restowner" },
    customer: { name: "Mia, a customer", look: "customer" },
  },
  rules: [
    "Allergen answers come only from our allergen chart, and a chef checks every allergen answer before it reaches a customer.",
    "No customer or staff details in free AI tools: use approved business tools, and only the data needed.",
    "Cameras only where staff have been told in writing, and never in staff areas such as the change room.",
  ],
  laws: "Food Standards Code: allergen information given to customers must be correct. Privacy Act 1988: customer details are personal information. Victoria's Surveillance Devices Act 1999: no cameras in workplace toilets or change rooms.",
  // One AI, one ML and one DL option. The ink story fills in what each one solves and its main risk.
  cards: [
    { id: "ai", type: "AI", kind: "an assistant that works with text", title: "Menu and allergen helper", product: "Microsoft Copilot",
      text: "Drafts replies to customers' menu and allergen questions from our allergen chart. A chef checks each one, then sends it.",
      setup: 100, monthly: 45, effort: "Low",
      problem: "Customers message all day about allergens and gluten-free options, and staff are too busy to answer quickly.",
      data: "The menu and the kitchen's allergen chart" },
    { id: "ml", type: "ML", kind: "predicts from past data", title: "Customer forecast", product: "a forecasting add-on to the booking system",
      text: "Learns from past bookings, the weather and local events how many customers will come each day, so we prep the right amount.",
      setup: 800, monthly: 90, effort: "Medium",
      problem: "Some nights we prep for 120 and 70 turn up, so we throw out about $800 of food a week.",
      data: "Two or more years of bookings and sales (we have three)" },
    { id: "dl", type: "DL", kind: "works with pictures", title: "Bin camera", product: "Winnow Vision",
      text: "A camera and scale over the bin recognise each food that's thrown away and how much, so we can change portions and the menu.",
      setup: 3500, monthly: 220, effort: "High",
      problem: "We don't know which dishes come back half-eaten or get thrown away.",
      data: "Photos of the food going into the bin" },
  ],
  checklist: [
    "It names the technology I recommend",
    "It compares all three options",
    "It follows the restaurant's AI rules, food safety law and the Privacy Act",
    "It includes the change the owner asked for",
  ],
};
