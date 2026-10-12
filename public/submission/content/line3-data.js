// Line 3, weeks 1 to 12 — figures copied unchanged from Candidate_Brief_Read_the_Numbers.docx
const productionData = {
  line: "Line 3",
  product: "Brake housings",
  period: "Weeks 1 to 12",
  // label: wording in the brief's table; plainLabel: wording shown to learners
  columns: {
    week: { label: "Week", plainLabel: "Week" },
    unitsProduced: { label: "Units produced", plainLabel: "Housings made" },
    target: { label: "Target", plainLabel: "Weekly target" },
    downtimeHrs: { label: "Downtime (hrs)", plainLabel: "Hours the line was stopped", unit: "hrs" },
    faultCalls: { label: "Fault calls", plainLabel: "Faults reported" },
    scrapPct: { label: "Scrap (%)", plainLabel: "Scrap (out of every 100 made)", unit: "%" },
  },
  timeline: [
    { week: 1, unitsProduced: 4820, target: 5000, downtimeHrs: 14, faultCalls: 22, scrapPct: 2.1 },
    { week: 2, unitsProduced: 4910, target: 5000, downtimeHrs: 12, faultCalls: 19, scrapPct: 2.0 },
    { week: 3, unitsProduced: 4870, target: 5000, downtimeHrs: 13, faultCalls: 21, scrapPct: 2.2 },
    { week: 4, unitsProduced: 4950, target: 5000, downtimeHrs: 11, faultCalls: 18, scrapPct: 1.9 },
    { week: 5, unitsProduced: 4780, target: 5000, downtimeHrs: 16, faultCalls: 25, scrapPct: 2.4 },
    { week: 6, unitsProduced: 4990, target: 5000, downtimeHrs: 10, faultCalls: 17, scrapPct: 1.8 },
    { week: 7, unitsProduced: 3650, target: 5000, downtimeHrs: 38, faultCalls: 41, scrapPct: 3.9 },
    { week: 8, unitsProduced: 4880, target: 5000, downtimeHrs: 12, faultCalls: 20, scrapPct: 2.1 },
    { week: 9, unitsProduced: 4930, target: 5000, downtimeHrs: 11, faultCalls: 16, scrapPct: 2.0 },
    { week: 10, unitsProduced: 5120, target: 5000, downtimeHrs: 9, faultCalls: 15, scrapPct: 1.9 },
    { week: 11, unitsProduced: 5080, target: 5000, downtimeHrs: 8, faultCalls: 14, scrapPct: 2.3 },
    { week: 12, unitsProduced: 5150, target: 5000, downtimeHrs: 8, faultCalls: 13, scrapPct: 2.6 },
  ],
};

// "Notes from the line supervisor" — text copied unchanged; week 10's note holds two separate events
const supervisorEvents = {
  source: "Notes from the line supervisor",
  events: [
    { week: 7, appliesFromWeek: 7, appliesToWeek: 7, type: "disruption", text: "severe storm. The site lost power for part of the week." },
    { week: 10, appliesFromWeek: 10, appliesToWeek: 12, type: "workingHours", text: "Saturday overtime shifts began." },
    { week: 10, appliesFromWeek: 10, appliesToWeek: 12, type: "recordingChange", affects: ["faultCalls"], text: "Fault calls are now logged on a new form." },
  ],
};
