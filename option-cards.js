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

// [id, goal index, type, title, what it does, product, "to …" phrase for the AI question, set-up $, monthly $]
const ROWS = [
  ["chat", 0, "ai", "Website chat helper", "Answers common patient questions on the website, day or night.", "Microsoft Copilot Studio", "answer common patient questions on its website", 600, 45],
  ["rebook", 1, "ai", "Rebooking by text", "A patient texts \"can't come\" and it offers a new time.", "Microsoft Copilot Studio", "offer new booking times when patients text that they can't come", 500, 30],
  ["manual", 2, "ai", "Lab manual helper", "A scientist asks a question and gets the answer from the lab manual.", "Microsoft 365 Copilot", "answer scientists' questions from its lab manual", 100, 45],
  ["busy", 0, "ml", "Busy-time forecast", "Predicts when the phones will be busiest, so more staff answer then.", "Microsoft Power BI", "predict when its phones will be busiest", 200, 10],
  ["missed", 1, "ml", "Missed-test predictor", "Predicts who might miss their test, so staff call them first.", "Azure Machine Learning", "predict which patients might miss their blood test", 800, 40],
  ["samples", 2, "ml", "Sample forecast", "Predicts how many samples arrive each day, so enough scientists are working.", "Microsoft Power BI", "predict how many samples arrive each day", 200, 10],
  ["voice", 0, "dl", "Phone voice helper", "Understands what callers say and answers simple questions, such as opening hours.", "Azure AI Speech", "understand callers and answer simple questions by phone", 900, 70],
  ["calls", 1, "dl", "Spoken reminder calls", "Rings patients the day before with a friendly spoken reminder.", "Azure AI Speech", "ring patients with a spoken reminder the day before their test", 400, 30],
  ["sorter", 2, "dl", "Microscope picture sorter", "Looks at pictures of blood cells and sorts them for a scientist to check.", "CellaVision", "sort pictures of blood cells for a scientist to check", 6000, 150],
];

export const CARDS = ROWS.map(([id, goal, type, title, text, product, use, setup, monthly]) => ({
  id, goal: GOALS[goal], type, title, text, product, setup, monthly,
  value: `${title} (${product})`,
  question: `How could a small pathology company start using ${product} to ${use}? List what it needs and the first two steps.`,
}));

export const cardValues = (type) => CARDS.filter((c) => c.type === type).map((c) => c.value);

// The good-and-bad test (/goodbad): for each card, the right good thing and problem come first; the two wrong
// choices are true of other kinds of tool. The page shuffles them.
export const GOOD_BAD = {
  chat: { good: ["Answers common patient questions at any time of day", "Predicts which patients might miss their test", "Sorts pictures of blood cells"],
    bad: ["Can give a confident wrong answer, so staff must check what it says", "Needs years of past attendance records to learn from", "Only works with pictures and sound"],
    why: "An AI assistant writes answers any time, but an LLM can sound sure and still be wrong." },
  rebook: { good: ["Patients can rebook any time without waiting on the phone", "Forecasts how many samples arrive each day", "Rings patients with a spoken reminder"],
    bad: ["Might misunderstand an unusual message, so staff check odd replies", "Needs a microscope camera", "Costs more than the whole budget"],
    why: "It understands text messages at any hour, but unusual wording can confuse it." },
  manual: { good: ["Scientists find answers fast without searching the whole manual", "Sorts blood cells for the scientist", "Predicts busy phone times"],
    bad: ["It is only as good as the manual, and can still get things wrong", "Needs recordings of patients' voices to learn", "Needs a new phone system"],
    why: "It answers from the lab manual, so out-of-date pages mean wrong answers." },
  busy: { good: ["More staff answer the phones when they are needed", "Answers patients' questions by itself", "Understands what callers say"],
    bad: ["Needs enough past call records, and an unusual week can throw it off", "Can make up facts in a reply", "A scientist must check every picture"],
    why: "ML learns patterns from past calls, so it needs good data and can be fooled by odd weeks." },
  missed: { good: ["Staff can call the people most likely to miss first", "Writes friendly reminder messages by itself", "Understands spoken replies"],
    bad: ["Uses patient data, so privacy and fairness must be checked", "Can make up facts in its answers", "Only works on scanned slides"],
    why: "ML predicts from patient records, which brings privacy and bias risks." },
  samples: { good: ["Helps roster enough scientists for busy days", "Highlights cells to check on slides", "Answers scientists' questions from the manual"],
    bad: ["It is a best guess: a surprise like a flu outbreak can make it wrong", "Staff must read every answer it gives patients", "Needs a new phone line"],
    why: "A forecast learns from past days, so a sudden change can make it wrong." },
  voice: { good: ["Callers get simple answers without waiting for a person", "Predicts the busiest phone times", "Sorts pictures of blood cells"],
    bad: ["May not understand strong accents or a noisy line, so callers need a way to reach a person", "Needs years of booking data", "Only works on the website"],
    why: "DL works with sound, but speech recognition can struggle with accents and noise." },
  calls: { good: ["Reaches patients who don't read text messages", "Works out who might miss their test", "Answers questions from the lab manual"],
    bad: ["Some patients find automated calls annoying and ignore them", "Needs a microscope", "Can only send text messages"],
    why: "A spoken call reaches more people, but not everyone likes automated calls." },
  sorter: { good: ["Scientists spend less time on normal slides and more on unusual ones", "Answers patients' questions at night", "Forecasts how many samples arrive"],
    bad: ["Costly, and a scientist must still confirm every result (AI policy)", "Can only understand spoken words", "Needs past phone records"],
    why: "DL sorts pictures fast, but it is expensive and a scientist signs off every result." },
};
