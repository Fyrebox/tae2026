// Session 2 option cards for the Bellarine report: three per type, one for each goal. Every learner sees all nine
// and picks one of each type; Session 2 does not depend on the goal picked in Session 1.
// AI: an assistant that works with text (an LLM); ML: predictions from past data; DL: pictures or sound.
// Costs are made up for the course.
export const GOALS = [
  "Answer patients' questions faster",
  "Fewer people miss their blood test",
  "Check samples under the microscope faster",
];

export const BUDGET = { setup: 10000, monthly: 500 };

// [goal index, type, title, what it does, product, "to …" phrase for the ChatGPT question, set-up $, monthly $]
const ROWS = [
  [0, "ai", "Website chat helper", "Answers common patient questions on the website, day or night.", "Microsoft Copilot Studio", "answer common patient questions on its website", 600, 45],
  [1, "ai", "Rebooking by text", "A patient texts \"can't come\" and it offers a new time.", "Microsoft Copilot Studio", "offer new booking times when patients text that they can't come", 500, 30],
  [2, "ai", "Lab manual helper", "A scientist asks a question and gets the answer from the lab manual.", "Microsoft 365 Copilot", "answer scientists' questions from its lab manual", 100, 45],
  [0, "ml", "Busy-time forecast", "Predicts when the phones will be busiest, so more staff answer then.", "Microsoft Power BI", "predict when its phones will be busiest", 200, 10],
  [1, "ml", "Missed-test predictor", "Predicts who might miss their test, so staff call them first.", "Azure Machine Learning", "predict which patients might miss their blood test", 800, 40],
  [2, "ml", "Sample forecast", "Predicts how many samples arrive each day, so enough scientists are working.", "Microsoft Power BI", "predict how many samples arrive each day", 200, 10],
  [0, "dl", "Phone voice helper", "Understands what callers say and answers simple questions, such as opening hours.", "Azure AI Speech", "understand callers and answer simple questions by phone", 900, 70],
  [1, "dl", "Spoken reminder calls", "Rings patients the day before with a friendly spoken reminder.", "Azure AI Speech", "ring patients with a spoken reminder the day before their test", 400, 30],
  [2, "dl", "Microscope picture sorter", "Looks at pictures of blood cells and sorts them for a scientist to check.", "CellaVision", "sort pictures of blood cells for a scientist to check", 6000, 150],
];

export const CARDS = ROWS.map(([goal, type, title, text, product, use, setup, monthly]) => ({
  goal: GOALS[goal], type, title, text, product, setup, monthly,
  value: `${title} (${product})`,
  question: `How could a small pathology company start using ${product} to ${use}? List what it needs and the first two steps.`,
}));

export const cardValues = (type) => CARDS.filter((c) => c.type === type).map((c) => c.value);
