// Tap-to-choose activities for ICTAII401, set in the fictional Bellarine Pathology.
// Each item has one correct option; "why" is shown to the learner after they finish.
export const ACTIVITIES = {
  tech: {
    path: "/tech",
    // Runs inside section 3 of the Session 1 page, so learners stay on one page; /tech redirects there.
    inPage: "/brief#s3",
    // Learners can retry the items they got wrong; the latest answer counts in the report and on the host view.
    retries: true,
    eyebrow: "ICTAII401 · Session 1",
    title: "What does Bellarine already use?",
    lede: "Seven things Bellarine uses or does now. For each one, choose: a fixed rule, ML, DL, or done by hand. Your answers are saved in section 3 of your report.",
    options: [
      { id: "rule", label: "Fixed rule", hint: "a person wrote the steps" },
      { id: "ml", label: "ML", hint: "machine learning: it learned from examples" },
      { id: "dl", label: "DL", hint: "deep learning: it learned to work with language, pictures or sound" },
      { id: "manual", label: "Manual", hint: "people do it by hand" },
    ],
    items: [
      { id: "sms", text: "Text message reminder sent 24 hours before every appointment", answer: "rule",
        why: "A person set the rule: send a text 24 hours before. Automation is not automatically AI." },
      { id: "junk", text: "Outlook junk-mail filter", answer: "ml",
        why: "It learned what junk looks like from millions of examples." },
      { id: "flags", text: "Lab system marks any result outside the normal range", answer: "rule",
        why: "It compares each result with limits a person set. A fixed rule, and a scientist still signs off." },
      { id: "barcode", text: "Barcode scanners at the collection centres", answer: "rule",
        why: "It reads a code and matches it. Nothing is learned." },
      { id: "copilot", text: "Microsoft 365 Copilot Chat (available to staff)", answer: "dl",
        why: "A large language model (LLM), a kind of deep learning that writes text. Staff check anything it writes, and never give it patient data." },
      { id: "enquiries", text: "Staff answer patient and doctor questions by phone", answer: "manual",
        why: "Done by hand by whoever is free: a chance for AI to help with goal 1." },
      { id: "slides", text: "Scientists check samples under the microscope by eye", answer: "manual",
        why: "Done by hand: deep learning could help with goal 3, with a scientist still signing off." },
    ],
  },
  tasks: {
    path: "/session2",
    // Runs at the top of the Session 2 page; /session2 redirects there. The six tasks are the ones the unit lists.
    inPage: "/brief2#tasks",
    retries: true,
    eyebrow: "ICTAII401 · Session 2",
    title: "What do organisations automate?",
    lede: "Six tasks organisations commonly automate. For each one, choose what kind of technology does it.",
    options: [
      { id: "rule", label: "Fixed rule", hint: "a person wrote one simple rule" },
      { id: "ai", label: "AI (expert rules)", hint: "follows many rules written by experts; does not learn" },
      { id: "ml", label: "ML", hint: "learns patterns from past data" },
      { id: "dl", label: "DL", hint: "works with language, pictures or sound" },
    ],
    items: [
      { id: "email", text: "Choosing the best time to send each customer a marketing email", answer: "ml",
        why: "It learns from when people opened past emails. Email campaigns are a common use of ML." },
      { id: "chat", text: "A website chatbot that writes its own answers to questions", answer: "dl",
        why: "It works with language: a large language model (LLM), a kind of deep learning." },
      { id: "trends", text: "Spotting unusual spikes in a year of sales figures", answer: "ml",
        why: "It learns what normal looks like from past data, then flags what is different." },
      { id: "hiring", text: "Predicting which job applicants are likely to stay more than a year, from past staff records", answer: "ml",
        why: "It learns from past records. Check it for bias, and a person still makes every hiring decision." },
      { id: "helpdesk", text: "An IT help assistant that diagnoses laptop problems by following rules written by IT experts", answer: "ai",
        why: "Many rules written by experts, and it does not learn: an expert system, which is AI." },
      { id: "tickets", text: "Every support email gets a ticket number and an automatic \"we got your email\" reply", answer: "rule",
        why: "One simple rule a person wrote: same input, same result." },
    ],
  },
};
