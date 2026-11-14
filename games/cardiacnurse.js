// Session 3 workplace game: a shift on a cardiac ward (/cardiacnurse). The story and choices are in
// cardiacnurse.ink; this file holds what the page shows beside it. The hospital, the ward and its costs are made up.
export const GAME = {
  key: "cardiacnurse",
  path: "/cardiacnurse",
  title: "A shift on the cardiac ward",
  place: "Ward 4B (cardiology), Corio Bay Hospital",
  manager: "the Nurse Unit Manager",
  intro: "You're a cardiac nurse on Ward 4B, and the ward's go-to person for computers and apps. The Nurse Unit Manager needs one AI idea, and has one minute to hear it.",
  madeUp: "The hospital, the ward and its costs are made up.",
  rulesTitle: "The hospital's AI rules",
  pitchLevel: "Pitch the manager",
  // The home ECG checker is a medical device and the most costly: not one to start with.
  startable: ["ai", "ml"],
  budget: { setup: 5000, monthly: 300 },
  cast: {
    manager: { name: "Nurse Unit Manager", look: "manager" },
    patient: { name: "Ray, a patient", look: "patient" },
  },
  rules: [
    "No patient information in public AI tools: use only the hospital's approved, secure tools.",
    "AI suggests, clinicians decide: a nurse or doctor checks everything AI produces before it reaches a patient or the record.",
    "AI that diagnoses or monitors patients must be approved by the TGA and by the hospital's clinical governance committee before use.",
  ],
  laws: "Privacy Act 1988 and Victoria's Health Records Act 2001: patient details are health information. Software that diagnoses is a medical device, regulated by the TGA.",
  // One AI, one ML and one DL option. The ink story fills in what each one solves and its main risk.
  cards: [
    { id: "ai", type: "AI", kind: "an assistant that works with text", title: "Discharge helper", product: "Microsoft 365 Copilot (the hospital's secure version)",
      text: "Drafts plain-English discharge instructions from the nurse's notes. A nurse checks every line against the chart, then gives them to the patient.",
      setup: 500, monthly: 60, effort: "Low",
      problem: "Writing discharge instructions takes us about 40 minutes a patient, and patients still go home confused about their medicines.",
      data: "The nurse's discharge notes and the ward's approved patient information" },
    { id: "ml", type: "ML", kind: "predicts from past data", title: "Early-warning predictor", product: "an add-on to the hospital's electronic medical record",
      text: "Learns from years of vital signs which patients might get worse in the next few hours, so nurses check them sooner.",
      setup: 3000, monthly: 200, effort: "Medium",
      problem: "Overnight, a patient can slowly get worse between observation rounds, and we spot it late.",
      data: "Five or more years of vital signs and outcomes (the hospital has eight)" },
    { id: "dl", type: "DL", kind: "reads pictures and signals", title: "Home ECG checker", product: "AliveCor KardiaMobile",
      text: "Patients at home record a 30-second ECG on their phone, and it flags a possible irregular rhythm (atrial fibrillation) for a nurse to review.",
      setup: 4000, monthly: 250, effort: "High",
      problem: "Patients ring the ward after going home, worried about palpitations, and we can't tell over the phone what's going on.",
      data: "Patients' ECG recordings, sent with their consent" },
  ],
  checklist: [
    "It names the technology I recommend",
    "It compares all three options",
    "It follows the hospital's AI rules, the Privacy Act and the Health Records Act",
    "It includes the change the manager asked for",
  ],
};
