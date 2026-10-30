// The Bellarine AI Opportunities Report (ICTAII401): ten sections filled in across Sessions 1–3.
// One schema drives the learner form, the server's validation and the host's read-only view.
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
  ["slides", "Scientists check routine slides by eye"],
];

// Section 2: the four goals from the work brief, ranked by the learner after asking the Operations Manager.
const GOALS = [
  ["enquiries", "Less staff time on repeat patient and doctor questions"],
  ["missed", "Fewer missed appointments"],
  ["slides", "Faster routine slide checking in the lab"],
  ["labels", "Fewer sample-labelling errors"],
];

export const REPORT = {
  title: "AI Opportunities Report",
  submitTo: "Priya Raman, Operations Manager",
  sections: [
    { n: 1, session: 1, title: "Work brief", maps: "PC 1.1", intro: "Answer from the work brief and AI use policy at taegordon.au/bellarine. Short answers are fine.", groups: [
      { label: "What have I been asked to do?", hint: "One sentence in your own words, including what you hand in.", fields: [{ id: "s1_task", type: "textarea", placeholder: "Example from a different job: Compare three printers and recommend one in an email" }] },
      { label: "Who wants it, and by when?", fields: [{ id: "s1_who", type: "text", placeholder: "Example: The office manager, by Friday" }] },
      { label: "3 rules from the AI use policy I must follow", hint: "One rule per line.", fields: [{ id: "s1_constraints", type: "textarea", placeholder: "Example from a different policy: Never share your password" }] },
    ] },
    { n: 2, session: 1, title: "Organisational goals", maps: "PC 1.2", intro: "Ask the Operations Manager, then record what she says.", groups: [
      { label: "Rank the four goals", hint: "1 = most important, as the Operations Manager tells you.", fields: GOALS.map(([key, label]) => (
        { id: `s2_rank_${key}`, label, type: "select", options: ["1", "2", "3", "4"] })) },
      { label: "How will we know the top goal worked?", fields: [{ id: "s2_measure", type: "text", placeholder: "Example for a printer: fewer paper jams each week" }] },
      { label: "Budget and limits", hint: "What the Operations Manager said about money, and anything off limits.", fields: [{ id: "s2_budget", type: "textarea" }] },
      { label: "Value of the top goal", hint: "Copy the trainer's worked example: the yearly cost of the staff time it takes now.", fields: [{ id: "s2_value", type: "text" }] },
    ] },
    { n: 3, session: 1, title: "Current technology and processes", maps: "PC 1.3", intro: "Your answers from taegordon.au/session1/tech are copied here. Fix any that were wrong, then explain three of them.", groups: [
      { label: "Type of each technology or process", fields: TECH.map(([key, label]) => (
        { id: `s3_${key}_class`, label, type: "select", options: ["Fixed rule", "ML", "DL", "Manual"] })) },
      { label: "Pick one fixed rule. What is it, and why is it a rule?", fields: [{ id: "s3_why_rule", type: "textarea", placeholder: "Example: The thermostat, because a person set the temperature" }] },
      { label: "Pick one ML or DL item. What is it, and why?", fields: [{ id: "s3_why_ai", type: "textarea", placeholder: "Example: Face unlock, because it learned from photos" }] },
      { label: "Pick one manual process. What is it, and could AI help?", fields: [{ id: "s3_why_manual", type: "textarea" }] },
    ] },
    { n: 4, session: 2, title: "Application procedures", maps: "PC 1.4", intro: "How each option would be applied, from a vendor page.", groups: perOption(4, [
      ["source", "Source used and date"],
      ["prereq", "Prerequisites", "Data, licences, skills"],
      ["steps", "Main steps (at least 2)"],
    ]) },
    { n: 5, session: 2, title: "Recommended opportunities", maps: "PCs 2.1, 2.2, 2.4 · PE: one AI, one ML and one DL opportunity", groups: perOption(5, [
      ["goal", "Goal addressed"],
      ["product", "Technology type and example product"],
      ["how", "How it works"],
      ["adv", "Advantages"],
      ["disadv", "Disadvantages"],
      ["cost", "Estimated 12-month cost", "Budget: $10,000 set-up + $500 a month"],
    ]) },
    { n: 6, session: 2, title: "Implementation risks", maps: "PC 2.3", groups: perOption(6, [
      ["risk", "Main risk"],
      ["manage", "How to manage it"],
      ["consulted", "Who was consulted, and what they said"],
    ]) },
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
    "At least one AI, one ML and one DL opportunity (section 5)",
    "Each technology is named with an example product (section 5)",
    "How each would be applied, with the source (section 4)",
    "Risks, how to manage them and who was consulted (section 6)",
    "Comparison and policy check complete (sections 7 and 8)",
    "Feedback recorded and at least one change made (section 9)",
    "No real personal information about patients, staff or anyone else",
  ],
};

export const FIELD_LIMITS = { text: 300, textarea: 1500, select: 20 };

// id -> field, for validation.
export const FIELDS = new Map(REPORT.sections.flatMap((s) => s.groups.flatMap((g) => g.fields)).map((f) => [f.id, f]));
