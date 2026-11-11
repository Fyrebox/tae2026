// The Bellarine AI Opportunities Report (ICTAII401): ten sections filled in across Sessions 1–3.
// One schema drives the learner form, the server's validation and the host's read-only view.
import { CARDS, GOALS, cardValues } from "./option-cards.js";

const OPTIONS = [["ai", "AI option"], ["ml", "ML option"], ["dl", "DL option"]];

// One row per criterion, one text box per option (AI, ML, DL).
const perOption = (section, rows) =>
  rows.map(([key, label, hint]) => ({
    label, hint,
    fields: OPTIONS.map(([opt, optLabel]) => ({ id: `s${section}_${key}_${opt}`, label: optLabel, type: "textarea" })),
  }));

const TECH = [
  ["sms", "Text message reminder sent 24 hours before every appointment"],
  ["junk", "Outlook junk-mail filter"],
  ["flags", "Lab system marks any result outside the normal range"],
  ["barcode", "Barcode scanners at the collection centres"],
  ["copilot", "Microsoft 365 Copilot Chat"],
  ["enquiries", "Staff answer patient and doctor questions by phone"],
  ["slides", "Scientists check samples under the microscope by eye"],
];

// Section 2: the three goals from the work brief (option-cards.js). They matter equally, so each learner picks one.
// Section 5: for each option the learner taps the kind of risk, then the best way to manage it. The right fix comes
// first (the page shuffles them); the other two are common mistakes. Accuracy includes poor data.
const RISKS = [
  { name: "Privacy", hint: "patient data", why: "Health records are sensitive under the Privacy Act 1988: use less data, keep it safe and check before you start.", fixes: [
    "Use only the data it needs, keep it in Australia and check with the privacy officer first",
    "Ask patients to stop sharing health details",
    "Let the supplier decide what data to keep"] },
  { name: "Accuracy", hint: "wrong answers or poor data", why: "AI and ML can be wrong, and poor data makes them worse: test first and keep a person checking.", fixes: [
    "Test it on past cases first, and have staff check its answers",
    "Trust it once it has run for a week without complaints",
    "Give it as much data as possible, even if some is out of date"] },
  { name: "Bias", hint: "unfair to some groups", why: "A tool that learns from past data can treat some groups unfairly: check the results for each group.", fixes: [
    "Check it works equally well for different groups, such as older patients",
    "Leave out the patients it gets wrong",
    "Only use it for patients who live nearby"] },
  { name: "Cost", hint: "money and the supplier", why: "A small trial keeps within the budget and shows whether it is worth it before you spend more.", fixes: [
    "Start with a small trial, track the monthly cost and read the contract",
    "Sign a three-year contract to get a discount",
    "Buy it for every collection centre at once"] },
  { name: "People", hint: "staff and patients", why: "People trust a tool they understand, and some patients will always need a person.", fixes: [
    "Train staff, tell patients how it works and keep a way to reach a person",
    "Start it without telling staff, so they don't worry",
    "Close the phone line so patients have to use it"] },
];
const PRIYA_QUESTIONS = [
  "Who should check the AI's answers before patients see them?",
  "Which patient data are we allowed to use?",
  "What would make staff or patients not trust it?",
];
const TYPE = { ai: "an AI assistant that works with text, like ChatGPT or Copilot", ml: "learns from past data to predict something", dl: "works with pictures or sound" };

export const REPORT = {
  title: "AI Opportunities Report",
  submitTo: "Priya Raman, Operations Manager",
  sections: [
    { n: 1, session: 1, title: "Work brief", maps: "PC 1.1", intro: "Answer from the brief and the AI use policy at the top of this page. Short answers are fine.", groups: [
      { label: "What have I been asked to do?", hint: "One sentence in your own words, including what you hand in.", fields: [{ id: "s1_task", type: "textarea", placeholder: "Example from a different job: Compare three printers and recommend one in an email" }] },
      { label: "Who wants it, and by when?", fields: [{ id: "s1_who", type: "text", placeholder: "Example: The office manager, by Friday" }] },
      { label: "3 rules from the AI use policy I must follow", hint: "One rule per line.", fields: [{ id: "s1_constraints", type: "textarea", placeholder: "Example from a different policy: Never share your password" }] },
    ] },
    { n: 2, session: 1, title: "Organisational goals", maps: "PC 1.2", intro: "All three goals matter equally. Pick one, ask the Operations Manager about it, then record the answers.", groups: [
      { label: "Which goal will you work on?", fields: [{ id: "s2_goal", type: "select", options: GOALS }] },
      { label: "How will we know it worked?", fields: [{ id: "s2_measure", type: "text", placeholder: "Example for a printer: fewer paper jams each week" }] },
      { label: "Budget and limits", hint: "What the Operations Manager said about money, and anything off limits.", fields: [{ id: "s2_budget", type: "textarea" }] },
    ] },
    { n: 3, session: 1, title: "Current technology and processes", maps: "PC 1.3", intro: "Tap Start and sort Bellarine's seven technologies and processes. Got some wrong? Retry them: your latest answers are saved here. Then explain three of them.", groups: [
      // activity: the learner answers through the tap-to-choose activity (pick-decks.js), not drop-downs; item links each field
      // to its card. Retries replace wrong answers; firstTry keeps the score of the first round for the trainer.
      { label: "Type of each technology or process", activity: "tech", fields: [
        ...TECH.map(([key, label]) => ({ id: `s3_${key}_class`, item: key, label, type: "select", options: ["Fixed rule", "ML", "DL", "Manual"] })),
        { id: "s3_first_try", firstTry: true, label: "First try score", type: "text" },
      ] },
      { label: "Pick one fixed rule. What is it, and why is it a rule?", fields: [{ id: "s3_why_rule", type: "textarea", placeholder: "Example: The thermostat, because a person set the temperature" }] },
      { label: "Pick one ML or DL item. What is it, and why?", fields: [{ id: "s3_why_ai", type: "textarea", placeholder: "Example: Face unlock, because it learned from photos" }] },
      { label: "Pick one manual process. What is it, and could AI help?", fields: [{ id: "s3_why_manual", type: "textarea" }] },
    ] },
    // Session 2: one group per option. The card picker (cards: type) shows the cards for the learner's goal from section 2.
    { n: 4, session: 2, title: "Your options", maps: "PCs 2.1, 2.4, 1.4 · PE: one AI, one ML and one DL opportunity", intro: "Pick one card of each type and say why. Then tap Ask AI on your card and check the answer fits Bellarine's budget ($10,000 to set up, plus up to $500 a month) and AI use policy.", groups: OPTIONS.map(([opt, optLabel]) => ({
      label: optLabel, hint: `${opt.toUpperCase()}: ${TYPE[opt]}.`, fields: [
        { id: `s4_pick_${opt}`, cards: opt, type: "select", options: cardValues(opt) },
        { id: `s4_why_${opt}`, label: "Why this one?", type: "text" },
        { id: `s4_needs_${opt}`, label: "What it needs, and the first two steps (from the AI)", type: "textarea" },
        { id: `s4_fits_${opt}`, label: "Does it fit the budget and the AI use policy?", type: "select", options: ["Yes", "No"] },
      ] })) },
    { n: 5, session: 2, title: "Risks", maps: "PC 2.3", intro: "For each option you picked in section 4, tap its main risk, then the best way to manage it. Then ask the Operations Manager one question.", groups: [
      // risks: tapped through the risk picker for that option's card (RISKS above), not drop-downs.
      ...OPTIONS.map(([opt, optLabel]) => ({ label: optLabel, risks: opt, fields: [
        { id: `s5_risk_${opt}`, label: "Main risk", type: "select", options: RISKS.map((r) => r.name) },
        { id: `s5_manage_${opt}`, label: "How to manage it", type: "select", options: RISKS.flatMap((r) => r.fixes), answers: RISKS.map((r) => r.fixes[0]) },
      ] })),
      { label: "Ask the Operations Manager", hint: "Tap the question you asked, then write down the answer.", fields: [
        { id: "s5_question", label: "The question I asked", type: "select", tap: true, options: PRIYA_QUESTIONS },
        { id: "s5_priya", label: "What the Operations Manager said", type: "textarea" },
      ] },
    ] },
    { n: 6, session: 3, title: "Comparison", maps: "PE: make comparisons between AI, ML and DL", groups: [
      ...perOption(6, [["goal", "Goal addressed"], ["data", "Data needed"], ["cost", "12-month cost"], ["risk", "Main risk"], ["effort", "Effort to implement"]]),
      { label: "Which would you start with, and why?", fields: [{ id: "s6_start", type: "textarea" }] },
    ] },
    { n: 7, session: 3, title: "Policy and legislation", maps: "PE: apply organisational policies and procedures", groups: perOption(7, [
      ["policy", "AI use policy rules that apply"],
      ["privacy", "How it complies with the Privacy Act 1988 and health-records rules"],
    ]) },
    { n: 8, session: 3, title: "Feedback log", maps: "PCs 3.1, 3.2", intro: "Implementing feedback means changing the report, not just writing it down.", groups: [1, 2].map((r) => ({ label: `Feedback ${r}`, fields: [
      { id: `s8_date${r}`, label: "Date", type: "text" },
      { id: `s8_who${r}`, label: "Who gave feedback", type: "text" },
      { id: `s8_said${r}`, label: "What they said", type: "textarea" },
      { id: `s8_changed${r}`, label: "What I changed", type: "textarea" },
    ] })) },
  ],
  // The good-and-bad test (taegordon.au/goodbad, PC 2.2) is not a section: its result is copied in from the device
  // and submitted with the report, and the host view shows it.
  goodbad: { title: "Good and bad test", maps: "PC 2.2", fields: [
    { id: "gb_score", label: "Score", type: "text" },
    ...CARDS.map((c) => ({ id: `gb_${c.id}`, card: c.id, label: c.title, type: "text" })),
  ] },
  risks: RISKS,
  // Section 9 (submission) is the checklist, the learner's first name and the submit button.
  checklist: [
    "All sections are complete",
    "One AI, one ML and one DL option, each with a reason (section 4)",
    "What each option needs, its first two steps, and whether it fits the budget and policy (section 4)",
    "Good and bad test done on this device (taegordon.au/goodbad)",
    "Risks, how to manage them and what the Operations Manager said (section 5)",
    "Comparison and policy check complete (sections 6 and 7)",
    "Feedback recorded and at least one change made (section 8)",
    "No real personal information about patients, staff or anyone else",
  ],
};

export const FIELD_LIMITS = { text: 300, textarea: 1500, select: 120 };

// id -> field, for validation.
export const FIELDS = new Map([...REPORT.sections.flatMap((s) => s.groups.flatMap((g) => g.fields)), ...REPORT.goodbad.fields].map((f) => [f.id, f]));
