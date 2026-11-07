// The Bellarine AI Opportunities Report (ICTAII401): ten sections filled in across Sessions 1–3.
// One schema drives the learner form, the server's validation and the host's read-only view.
import { GOALS, cardValues } from "./option-cards.js";

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
const RISKS = ["Privacy and health records", "Accuracy", "Bias and fairness", "Data quality", "Cost and vendor", "People"];
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
    { n: 4, session: 2, title: "Your options", maps: "PCs 2.1, 2.4, 1.4 · PE: one AI, one ML and one DL opportunity", intro: "For your goal, pick one card of each type and say why. Then ask ChatGPT the question on your card and check the product page. Never type personal information into ChatGPT.", groups: OPTIONS.map(([opt, optLabel]) => ({
      label: optLabel, hint: `${opt.toUpperCase()}: ${TYPE[opt]}.`, fields: [
        { id: `s4_pick_${opt}`, cards: opt, type: "select", options: cardValues(opt) },
        { id: `s4_why_${opt}`, label: "Why this one?", type: "text" },
        { id: `s4_needs_${opt}`, label: "What it needs, and the first two steps (from ChatGPT, checked on the product page)", type: "textarea" },
      ] })) },
    { n: 5, session: 2, title: "Good, bad and budget", maps: "PC 2.2", intro: "Budget: $10,000 to set up, plus up to $500 a month. The cost is on each card.", groups: OPTIONS.map(([opt, optLabel]) => ({
      label: optLabel, fields: [
        { id: `s5_goodbad_${opt}`, label: "One good thing and one problem for Bellarine", type: "textarea" },
        { id: `s5_budget_${opt}`, label: "Does it fit the budget?", type: "select", options: ["Yes", "No"] },
      ] })) },
    { n: 6, session: 2, title: "Risks", maps: "PC 2.3", intro: "Pick the main risk of each option and say how to manage it. Then ask the Operations Manager at least one risk question.", groups: [
      ...OPTIONS.map(([opt, optLabel]) => ({ label: optLabel, fields: [
        { id: `s6_risk_${opt}`, label: "Main risk", type: "select", options: RISKS },
        { id: `s6_manage_${opt}`, label: "How to manage it", type: "text" },
      ] })),
      { label: "What the Operations Manager said", fields: [{ id: "s6_priya", type: "textarea" }] },
    ] },
    { n: 7, session: 3, title: "Comparison", maps: "PE: make comparisons between AI, ML and DL", groups: [
      ...perOption(7, [["goal", "Goal addressed"], ["data", "Data needed"], ["cost", "12-month cost"], ["risk", "Main risk"], ["effort", "Effort to implement"]]),
      { label: "Which would you start with, and why?", fields: [{ id: "s7_start", type: "textarea" }] },
    ] },
    { n: 8, session: 3, title: "Policy and legislation", maps: "PE: apply organisational policies and procedures", groups: perOption(8, [
      ["policy", "AI use policy rules that apply"],
      ["privacy", "How it complies with the Privacy Act 1988 and health-records rules"],
    ]) },
    { n: 9, session: 3, title: "Feedback log", maps: "PCs 3.1, 3.2", intro: "Implementing feedback means changing the report, not just writing it down.", groups: [1, 2].map((r) => ({ label: `Feedback ${r}`, fields: [
      { id: `s9_date${r}`, label: "Date", type: "text" },
      { id: `s9_who${r}`, label: "Who gave feedback", type: "text" },
      { id: `s9_said${r}`, label: "What they said", type: "textarea" },
      { id: `s9_changed${r}`, label: "What I changed", type: "textarea" },
    ] })) },
  ],
  // Section 10 (submission) is the checklist, the learner's first name and the submit button.
  checklist: [
    "All sections are complete",
    "One AI, one ML and one DL option, each with a reason (section 4)",
    "What each option needs and its first two steps (section 4)",
    "One good thing, one problem and a budget check for each option (section 5)",
    "Risks, how to manage them and what the Operations Manager said (section 6)",
    "Comparison and policy check complete (sections 7 and 8)",
    "Feedback recorded and at least one change made (section 9)",
    "No real personal information about patients, staff or anyone else",
  ],
};

export const FIELD_LIMITS = { text: 300, textarea: 1500, select: 120 };

// id -> field, for validation.
export const FIELDS = new Map(REPORT.sections.flatMap((s) => s.groups.flatMap((g) => g.fields)).map((f) => [f.id, f]));
