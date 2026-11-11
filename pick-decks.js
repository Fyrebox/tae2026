// Tap-to-choose activities for ICTAII401, set in the fictional Bellarine Pathology.
// Each item has one correct option; "why" is shown to the learner after they finish.
import { CARDS, GOOD_BAD } from "./option-cards.js";

const TYPE_NAME = { ai: "AI", ml: "ML", dl: "DL" };
const abc = (labels) => labels.map((label, i) => ({ id: "abc"[i], label }));

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
  goodbad: {
    path: "/goodbad",
    // Each question has its own three choices ("a" is right; the page shuffles them), in card order.
    // retries: the latest answer counts; saveAs: the result is kept on the device and copied into the report.
    retries: true,
    ordered: true,
    saveAs: "goodbadResult",
    eyebrow: "ICTAII401 · Session 2",
    title: "Good and bad",
    lede: "Nine options for Bellarine. For each one, pick a good thing and a problem. Your answers are saved in your report on this device.",
    options: [],
    items: CARDS.flatMap((c) => ["good", "bad"].map((side) => ({
      id: `${c.id}-${side}`, card: c.id,
      text: `${c.title} (${TYPE_NAME[c.type]}): ${side === "good" ? "a good thing?" : "a problem?"}`,
      options: abc(GOOD_BAD[c.id][side]), answer: "a", why: GOOD_BAD[c.id].why,
    }))),
  },
};
