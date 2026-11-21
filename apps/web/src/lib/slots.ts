/**
 * Sponsored slots on milestones, and the free option always shown beside each one
 * (trust rule: a sponsored offer is labelled and never stands alone).
 * Ads come from the admin panel later; until then the slot shows as open.
 */
export const SLOTS: Record<string, { label: string; free: { title: string; note: string; url?: string } }> = {
  english_course: {
    label: "English course",
    free: { title: "LearnEnglish by the British Council", note: "Free lessons, listening and grammar practice.", url: "https://learnenglish.britishcouncil.org" },
  },
  level_test: {
    label: "English level test",
    free: { title: "Free online English level test", note: "From the British Council's LearnEnglish site.", url: "https://learnenglish.britishcouncil.org" },
  },
  ielts_coaching: {
    label: "IELTS coaching",
    free: { title: "Official IELTS practice tests", note: "Free sample tests from the people who run IELTS.", url: "https://ielts.org" },
  },
  test_booking: {
    label: "IELTS test booking",
    free: { title: "Book with the official test centres", note: "IDP and the British Council both run IELTS in Bangladesh. Book on their own sites." },
  },
  sat_coaching: {
    label: "SAT preparation",
    free: { title: "Official Digital SAT practice", note: "Free practice from College Board with Khan Academy.", url: "https://www.khanacademy.org/test-prep/digital-sat" },
  },
  gre_coaching: {
    label: "GRE preparation",
    free: { title: "Free official GRE practice tests", note: "POWERPREP tests from ETS, who run the GRE.", url: "https://www.ets.org/gre" },
  },
  admission_coaching: {
    label: "Admission coaching",
    free: { title: "Past questions from university websites", note: "Most public universities publish past admission questions." },
  },
  agency: {
    label: "Study-abroad agency",
    free: { title: "Apply directly to the university", note: "Every university accepts direct applications. Agents are optional, never required." },
  },
  student_banking: {
    label: "Student File & Blocked Account",
    free: {
      title: "Authorized Dealer Banks (Bangladesh Bank)",
      note: "You can open a student file at any Authorized Dealer bank branch across Bangladesh under official Bangladesh Bank foreign exchange rules.",
      url: "https://www.bb.org.bd",
    },
  },
};

export const ADVISOR_TOPICS: Record<string, string> = {
  "life-abroad": "Life as a student abroad",
  "bachelors-vs-masters": "Bachelor's abroad or master's later?",
  cgpa: "What CGPA really got me in",
  scholarships: "How I won my scholarship",
  shortlisting: "How I shortlisted universities",
  "sop-review": "Statement of purpose review",
  "visa-interview": "Visa interview practice",
};

export const STAMP_NAMES: Record<string, string> = {
  habit_formed: "Habit Formed",
  passport_ready: "Passport Ready",
  ielts_gate: "IELTS Gate",
  scholarship_hunter: "Scholarship Hunter",
  application_raid: "Application Raid",
  visa_gate: "Visa Gate",
  scam_spotter: "Scam Spotter",
};
