// Day-wise study timetable — Phase A (8 weeks) of the bank-exam plan.
// Day 1 = 26 Sept 2026 (user's actual start). Pure data + date math, no React.

export const PLAN_START = new Date(2026, 8, 26); // month is 0-based

const QCOUNT = { Quant: 50, Reasoning: 40, English: 30 };

// Phase A — Week 1..8 (index 0..7). Matches the full-proof plan's weekly table.
const WEEKS = [
  {
    quant: ['Simplification', 'Approximation', 'Number Series'],
    reasoning: ['Direction Sense', 'Blood Relations', 'Ranking'],
    english: ['Tenses', 'Articles'],
    gaFocus: 'Banking terms — 10/day',
  },
  {
    quant: ['Percentage', 'Ratio-Proportion', 'Averages'],
    reasoning: ['Syllogism', 'Inequalities'],
    english: ['Error Spotting basics'],
    gaFocus: 'Banking terms — 10/day',
  },
  {
    quant: ['Profit-Loss', 'Simple & Compound Interest'],
    reasoning: ['Coding-Decoding', 'Alphanumeric Series'],
    english: ['Cloze Test intro', 'Vocabulary — 10 words/day'],
    gaFocus: 'Government schemes',
  },
  {
    quant: ['Time & Work', 'Time-Speed-Distance'],
    reasoning: ['Puzzles intro — floor, box, day-based'],
    english: ['Parajumble'],
    gaFocus: 'Sectional test (Quant + Reasoning) on Day 6',
  },
  {
    quant: ['DI basics — table & bar', 'Quadratic Equations'],
    reasoning: ['Seating Arrangement — linear + circular'],
    english: ['Reading Comprehension — 1 daily (timed)'],
    gaFocus: 'RBI functions',
  },
  {
    quant: ['Mixture-Alligation', 'Partnership', 'Mensuration'],
    reasoning: ['Input-Output', 'Data Sufficiency intro'],
    english: ['Fill in the Blanks', 'Phrase Replacement'],
    gaFocus: 'Banking awareness capsule',
  },
  {
    // Week 7 — full revision week
    quant: ['Full Quant revision', 'Timed sets — 35Q/20min'],
    reasoning: ['Full Reasoning revision', 'Timed sets'],
    english: ['English sectional tests'],
    gaFocus: 'Last 3 months CA revision',
  },
  { mockWeek: true }, // Week 8 — mock week
];

const SLOT_TIMES = {
  Quant: '11:00 – 1:00',
  Reasoning: '1:20 – 3:20',
  English: '4:20 – 5:50',
  'GA / Current Affairs': '6:10 – 7:10',
  Revision: '7:10 – 7:40',
};

function dateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function diffDays(a, b) {
  return Math.round((dateOnly(a) - dateOnly(b)) / 86400000);
}

function focusFor(topics, dow, subject) {
  if (dow === 6)
    return { topic: `Weekly revision — ${subject}`, task: 'Timed test + mistakes in notes' };
  const topic = topics[dow % topics.length];
  const pass = Math.floor(dow / topics.length);
  let task;
  if (dow === 5) task = 'Timed practice set';
  else if (pass === 0) task = `Concept + ${QCOUNT[subject]} practice questions`;
  else task = 'Mixed practice + weak-spot revision';
  return { topic, task };
}

function mockWeekSlots(dow) {
  if (dow <= 4) {
    return [
      { slot: 'Quant', time: SLOT_TIMES.Quant, topic: 'Full RRB prelims mock (80 Q / 45 min)', task: `Mock ${dow + 1} of 5 — exam conditions` },
      { slot: 'Reasoning', time: SLOT_TIMES.Reasoning, topic: 'Mock deep analysis', task: 'Every wrong/guessed question → notes' },
      { slot: 'English', time: SLOT_TIMES.English, topic: 'Weak-area practice', task: 'From the mock analysis' },
      { slot: 'GA / Current Affairs', time: SLOT_TIMES['GA / Current Affairs'], topic: 'Daily current affairs (light)', task: 'Headlines only' },
      { slot: 'Revision', time: SLOT_TIMES.Revision, topic: 'Mistake notebook', task: 'Formula + vocab' },
    ];
  }
  if (dow === 5) {
    return [
      { slot: 'Quant', time: SLOT_TIMES.Quant, topic: 'All 5 mocks — Quant mistakes redo', task: 'Timed re-attempt' },
      { slot: 'Reasoning', time: SLOT_TIMES.Reasoning, topic: 'All 5 mocks — Reasoning mistakes redo', task: 'Timed re-attempt' },
      { slot: 'English', time: SLOT_TIMES.English, topic: 'Error log revision', task: 'Notes sweep' },
      { slot: 'GA / Current Affairs', time: SLOT_TIMES['GA / Current Affairs'], topic: 'Daily current affairs', task: 'Headlines + banking news' },
      { slot: 'Revision', time: SLOT_TIMES.Revision, topic: 'Formula notebook', task: 'Final sweep' },
    ];
  }
  return [
    { slot: 'Quant', time: SLOT_TIMES.Quant, topic: 'Light revision', task: 'Formulas only' },
    { slot: 'Reasoning', time: SLOT_TIMES.Reasoning, topic: 'Light revision', task: 'Short tricks' },
    { slot: 'English', time: SLOT_TIMES.English, topic: 'Vocab + light reading', task: 'Easy day' },
    { slot: 'GA / Current Affairs', time: SLOT_TIMES['GA / Current Affairs'], topic: 'Weekly CA roundup', task: 'Revise the week' },
    { slot: 'Revision', time: SLOT_TIMES.Revision, topic: 'Rest / plan next phase', task: 'Recharge' },
  ];
}

// Returns null before Day 1, { phaseDone: true } after Phase A (56 days).
export function getDayPlan(date) {
  const dd = diffDays(date, PLAN_START);
  if (dd < 0) return null;
  const week = Math.floor(dd / 7);
  if (week > 7) return { phaseDone: true, dayNumber: dd + 1, date: dateOnly(date) };
  const dow = dd % 7;
  const W = WEEKS[week];
  const dayNumber = dd + 1;

  let slots;
  if (W.mockWeek) {
    slots = mockWeekSlots(dow);
  } else {
    const q = focusFor(W.quant, dow, 'Quant');
    const r = focusFor(W.reasoning, dow, 'Reasoning');
    const e = focusFor(W.english, dow, 'English');
    slots = [
      { slot: 'Quant', time: SLOT_TIMES.Quant, topic: q.topic, task: q.task },
      { slot: 'Reasoning', time: SLOT_TIMES.Reasoning, topic: r.topic, task: r.task },
      { slot: 'English', time: SLOT_TIMES.English, topic: e.topic, task: e.task },
      {
        slot: 'GA / Current Affairs',
        time: SLOT_TIMES['GA / Current Affairs'],
        topic: 'Daily current affairs',
        task: W.gaFocus,
      },
      {
        slot: 'Revision',
        time: SLOT_TIMES.Revision,
        topic: 'Formula notebook + vocab flashcards',
        task: 'Mistakes → notes',
      },
    ];
  }
  return { dayNumber, weekNumber: week + 1, dow, mockWeek: !!W.mockWeek, slots, date: dateOnly(date) };
}

// The 7 days of the plan-week containing `date` (Day 1-anchored weeks).
export function getPlanWeek(date) {
  const dd = Math.max(0, diffDays(date, PLAN_START));
  const start = new Date(PLAN_START);
  start.setDate(start.getDate() + Math.floor(dd / 7) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { date: d, dayNumber: diffDays(d, PLAN_START) + 1 };
  });
}

export function fmtDayShort(d) {
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const dm = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${wd} ${dm}`;
}
