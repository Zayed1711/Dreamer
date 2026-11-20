/**
 * Scam Check content: red-flag questions about an agent or offer, and the
 * Spot-the-scam quiz. These mirror the Partner Standards: anything an advertiser
 * must never do is a red flag here.
 */

export type Severity = "critical" | "high" | "medium";
export type Answer = "yes" | "no" | "unsure";
export type Risk = "low" | "medium" | "high";

export type Flag = {
  id: string;
  question: string;
  severity: Severity;
  why: string;
  todo: string;
};

export const FLAGS: Flag[] = [
  {
    id: "guarantee",
    question: "Did they guarantee admission, a scholarship or a visa?",
    severity: "critical",
    why: "Nobody can guarantee these. Universities decide admission and embassies decide visas.",
    todo: "Walk away from anyone who promises a guaranteed result.",
  },
  {
    id: "personal_account",
    question: "Did they ask you to pay into a personal bKash, Nagad or bank account?",
    severity: "critical",
    why: "Real businesses take payment into a company account and give a receipt.",
    todo: "Pay only a company account, or the university directly, and keep every receipt.",
  },
  {
    id: "fake_documents",
    question: "Did they offer to make, edit or “improve” any document, such as certificates, bank statements or test results?",
    severity: "critical",
    why: "Fake documents are fraud. They can get you refused, banned from a country, or prosecuted.",
    todo: "Never use altered documents. Leave this agent.",
  },
  {
    id: "no_contract",
    question: "Did they ask for money before giving you a written contract with fees and refund terms?",
    severity: "high",
    why: "Without a contract you have no proof of what you paid for and no way to get a refund.",
    todo: "Ask for a written contract listing every fee and the refund terms before you pay.",
  },
  {
    id: "passwords",
    question: "Did they ask for your email or portal passwords, or apply using their own email instead of yours?",
    severity: "high",
    why: "Whoever controls the account controls your application, offer letter and visa messages.",
    todo: "Apply from your own email and accounts, and never share passwords.",
  },
  {
    id: "unverified_offer",
    question: "Did your offer letter come from somewhere other than the university's own email or applicant portal?",
    severity: "high",
    why: "Fake offer letters are common. A real offer can always be confirmed with the university.",
    todo: "Email the university's admissions office yourself, using the address on its official website.",
  },
  {
    id: "originals",
    question: "Did they ask you to hand over your original passport or certificates?",
    severity: "medium",
    why: "Keeping your originals gives them leverage over you. Applications need copies, not originals.",
    todo: "Give copies only. Keep your originals with you.",
  },
  {
    id: "pressure",
    question: "Are they pushing you to decide or pay today, for example “only 2 seats left”?",
    severity: "medium",
    why: "Pressure stops you from checking. Real deadlines are on the university's website.",
    todo: "Take your time. Check the real deadline on the university's own website.",
  },
  {
    id: "no_english_test",
    question: "Did they say you don't need an English test because of their “connections”?",
    severity: "medium",
    why: "Some universities do waive tests, but that is a published rule, not a favour from an agent.",
    todo: "Check the English requirement on the university's admissions page.",
  },
  {
    id: "no_trace",
    question: "Is there no office address, trade licence or past students you can check?",
    severity: "medium",
    why: "A real business can be found and checked. A Facebook page alone is not enough.",
    todo: "Ask for their trade licence and to speak with past students, and visit the office.",
  },
  {
    id: "hidden_commission",
    question: "Did they refuse to say whether universities pay them a commission?",
    severity: "medium",
    why: "Many agents are paid by universities. Hiding it means their advice may follow the money, not you.",
    todo: "Ask in writing which universities pay them, and compare their advice with your own research.",
  },
];

const POINTS: Record<Severity, number> = { critical: 5, high: 3, medium: 2 };

/**
 * A "yes" to any critical flag is high risk. Otherwise points add up: a "yes" counts
 * fully, "not sure" counts half, because it is something still to check.
 */
export function scoreRisk(answers: Record<string, Answer>): Risk {
  let points = 0;
  for (const f of FLAGS) {
    const a = answers[f.id];
    if (a === "yes" && f.severity === "critical") return "high";
    if (a === "yes") points += POINTS[f.severity];
    if (a === "unsure") points += POINTS[f.severity] / 2;
  }
  if (points >= 5) return "high";
  if (points >= 2) return "medium";
  return "low";
}

export type Scenario = { message: string; from: string; scam: boolean; why: string };

export const SCENARIOS: Scenario[] = [
  {
    from: "WhatsApp, unknown number",
    message: "Congratulations! Your UK student visa is 100% guaranteed. Pay 50,000 BDT today to this bKash: 017XXXXXXXX to confirm.",
    scam: true,
    why: "A guaranteed visa and payment to a personal bKash: two critical red flags.",
  },
  {
    from: "Email from admissions@ the university's own domain",
    message: "Your offer letter is attached. You can also confirm it in your applicant portal on our website.",
    scam: false,
    why: "It comes from the university's own domain and points you to the official portal to confirm.",
  },
  {
    from: "Facebook agency page",
    message: "No IELTS? No problem. We can arrange a band 7 certificate for you in one week.",
    scam: true,
    why: "That is a fake document. Using it can get you banned from the country.",
  },
  {
    from: "Agency with an office in Dhanmondi",
    message: "Our service fee is 30,000 BDT, paid to our company account after you sign the contract. Refund terms are in clause 6.",
    scam: false,
    why: "Company account, a written contract first, and clear refund terms. That is how a real business works.",
  },
  {
    from: "Agent on Messenger",
    message: "Only 2 scholarship seats left! Bring your original passport to our office today to lock your seat.",
    scam: true,
    why: "Pressure to act today, plus a demand for your original passport.",
  },
  {
    from: "University admissions page",
    message: "Minimum English requirement: IELTS 6.0 overall. Some applicants may use a Medium of Instruction letter instead; see eligibility.",
    scam: false,
    why: "A published, checkable rule on the university's own page. Waivers like this are real when the university says so.",
  },
  {
    from: "Agent on WhatsApp",
    message: "Send me your email password so I can submit your applications faster.",
    scam: true,
    why: "Never share passwords. Whoever controls your email controls your offer and visa messages.",
  },
  {
    from: "Agency counsellor",
    message: "Yes, some universities pay us a commission. Here is the list, so you can compare our advice yourself.",
    scam: false,
    why: "Disclosing commission openly is exactly what an honest agency should do.",
  },
];

/** Correct answers needed to pass the quiz and clear the task. */
export const PASS_MARK = 6;
