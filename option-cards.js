// Session 2 option cards for the Bellarine report: two ready-made options per type (AI, ML, DL) for each goal.
// Learners pick one card per type for the goal they chose in Session 1. Costs are made up for the course.
export const GOALS = [
  "Answer patients' questions faster",
  "Fewer people miss their blood test",
  "Check samples under the microscope faster",
];

export const BUDGET = { setup: 10000, monthly: 500 };

const LINKS = {
  "Microsoft Copilot Studio": "https://learn.microsoft.com/en-us/microsoft-copilot-studio/",
  "Microsoft Power BI": "https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview",
  "Azure Machine Learning": "https://azure.microsoft.com/en-au/products/machine-learning",
  "Microsoft 365 Copilot": "https://learn.microsoft.com/en-us/copilot/microsoft-365/",
  "Azure AI Speech": "https://azure.microsoft.com/en-au/products/ai-services/ai-speech",
  "Azure AI Translator": "https://azure.microsoft.com/en-au/products/ai-services/ai-translator",
  "Data Innovations Instrument Manager": "https://www.datainnovations.com/product/instrument-manager/",
  "CellaVision": "https://www.cellavision.com/",
  "Aiforia": "https://www.aiforia.com/",
};

// [goal index, type, title, what it does, product, "use it for …" phrase for the ChatGPT question, set-up $, monthly $]
const ROWS = [
  [0, "ai", "Test-preparation advisor", "Asks which test the patient is having, then gives the right instructions (fasting, water) from scientists' rules.", "Microsoft Copilot Studio", "a test-preparation advisor on its website", 4000, 300],
  [0, "ai", "Booking advisor", "Works out which centre and time suit each test, from booking rules.", "Microsoft Copilot Studio", "a booking advisor on its website", 5000, 300],
  [0, "ml", "Phone busy-time forecast", "Forecasts the busiest phone times so more staff answer then.", "Microsoft Power BI", "forecasting its busiest phone times", 2000, 100],
  [0, "ml", "Results-call predictor", "Predicts which patients will call about results, and texts them an update first.", "Azure Machine Learning", "predicting which patients will call about their results", 8000, 400],
  [0, "dl", "Website chat assistant", "Answers only from approved Bellarine pages and passes hard questions to staff.", "Microsoft Copilot Studio", "a website chat assistant that answers from approved pages", 6000, 450],
  [0, "dl", "Email reply drafts", "Drafts email replies for staff to check and send.", "Microsoft 365 Copilot", "drafting email replies to patients for staff to check", 1000, 450],
  [1, "ai", "Reminder advisor", "Picks the right reminder and preparation steps for each test, so patients come ready.", "Microsoft Copilot Studio", "a reminder advisor that sends the right preparation steps for each test", 4000, 300],
  [1, "ai", "Rebooking assistant", "When a patient replies \"can't come\", it offers new times, following booking rules.", "Microsoft Copilot Studio", "a rebooking assistant that answers text messages", 5000, 300],
  [1, "ml", "Missed-test predictor", "Predicts who is likely to miss, so staff call them first.", "Azure Machine Learning", "predicting which patients are likely to miss their blood test", 8000, 400],
  [1, "ml", "Missed-test forecast", "Forecasts missed tests by centre and day, to plan extra walk-in times.", "Microsoft Power BI", "forecasting missed blood tests by centre and day", 2000, 100],
  [1, "dl", "Phone call assistant", "Calls patients and understands spoken replies, such as \"move it to Friday\".", "Azure AI Speech", "a phone assistant that understands spoken replies", 9000, 700],
  [1, "dl", "Reminder translator", "Sends each reminder in the patient's own language.", "Azure AI Translator", "translating appointment reminders into patients' languages", 1500, 50],
  [2, "ai", "Urgent-sample triage rules", "Puts urgent samples at the front of the queue, using rules written by senior scientists.", "Data Innovations Instrument Manager", "rules that put urgent samples at the front of the queue", 9000, 500],
  [2, "ai", "Slide checklist assistant", "Suggests what to look for on each slide type, from senior scientists' rules.", "Microsoft Copilot Studio", "a checklist assistant for scientists checking slides", 4000, 300],
  [2, "ml", "Sample-number forecast", "Forecasts daily sample numbers so enough scientists are rostered.", "Microsoft Power BI", "forecasting how many samples arrive each day", 2000, 100],
  [2, "ml", "Unusual-result flags", "Flags unusual result patterns for a second look.", "Azure Machine Learning", "flagging unusual result patterns for a second look", 8000, 400],
  [2, "dl", "Digital cell sorter", "A digital microscope that pre-sorts blood cells for a scientist to confirm.", "CellaVision", "pre-sorting blood cells for a scientist to confirm", 60000, 1500],
  [2, "dl", "Slide image AI", "Highlights areas to check on scanned slides.", "Aiforia", "highlighting areas to check on scanned slides", 40000, 2000],
];

export const CARDS = ROWS.map(([goal, type, title, text, product, use, setup, monthly]) => ({
  goal: GOALS[goal], type, title, text, product, link: LINKS[product], setup, monthly,
  value: `${title} (${product})`,
  question: `What does a small pathology company need to use ${product} for ${use}? Give the first two steps.`,
}));

export const cardValues = (type) => CARDS.filter((c) => c.type === type).map((c) => c.value);
