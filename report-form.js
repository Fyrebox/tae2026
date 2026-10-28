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
  ["sms", "SMS reminder 24 hours before every appointment"],
  ["junk", "Outlook junk-mail filter"],
  ["flags", "Lab system flags out-of-range results"],
  ["barcode", "Barcode scanners at collection"],
  ["copilot", "Microsoft 365 Copilot Chat"],
  ["enquiries", "Patient and GP enquiries answered by phone"],
  ["slides", "Routine slides screened by eye"],
];

export const REPORT = {
  title: "AI Opportunities Report",
  submitTo: "Priya Raman, Operations Manager",
  sections: [
    { n: 1, session: 1, title: "Work brief", maps: "PC 1.1", groups: [
      { label: "Task", fields: [{ id: "s1_task", type: "textarea" }] },
      { label: "Deliverable", fields: [{ id: "s1_deliverable", type: "text" }] },
      { label: "Requested by / reporting to", fields: [{ id: "s1_requested", type: "text" }] },
      { label: "Due date", fields: [{ id: "s1_due", type: "text" }] },
      { label: "Policy constraints (at least 3)", fields: [{ id: "s1_constraints", type: "textarea" }] },
    ] },
    { n: 2, session: 1, title: "Organisational goals", maps: "PC 1.2", intro: "Confirmed with the Operations Manager, in priority order.", groups: [
      ...[1, 2, 3, 4].map((r) => ({ label: `Goal ranked ${r}`, fields: [
        { id: `s2_goal${r}`, label: "Goal", type: "text" },
        { id: `s2_measure${r}`, label: "How success will be measured", type: "text" },
      ] })),
      { label: "Budget and limits", fields: [{ id: "s2_budget", type: "textarea" }] },
      { label: "Value of goal 1", hint: "Yearly cost of the staff time it takes now", fields: [{ id: "s2_value", type: "text" }] },
    ] },
    { n: 3, session: 1, title: "Current technology and processes", maps: "PC 1.3", groups: TECH.map(([key, label]) => ({ label, fields: [
      { id: `s3_${key}_class`, label: "Type", type: "select", options: ["Fixed rule", "ML", "DL", "Manual"] },
      { id: `s3_${key}_why`, label: "Why", type: "text" },
    ] })) },
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
