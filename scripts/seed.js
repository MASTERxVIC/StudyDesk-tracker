// Seeds the comprehensive bank-exam syllabus (141 topics).
// Run: npm run seed   (requires MONGODB_URI in .env.local or environment)
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const TopicSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);
TopicSchema.index({ subject: 1, topic: 1 }, { unique: true });
const SyllabusTopic = mongoose.models.SyllabusTopic || mongoose.model('SyllabusTopic', TopicSchema);

const SYLLABUS = {
  Quant: [
    'Number System & Divisibility',
    'Simplification & BODMAS',
    'Approximation',
    'HCF & LCM',
    'Percentage',
    'Ratio & Proportion',
    'Average',
    'Problems on Ages',
    'Partnership',
    'Profit & Loss',
    'Discount & Marked Price',
    'Simple Interest',
    'Compound Interest',
    'Time & Work',
    'Pipes & Cisterns',
    'Time, Speed & Distance',
    'Problems on Trains',
    'Boats & Streams',
    'Mensuration 2D (Area & Perimeter)',
    'Mensuration 3D (Volume & Surface Area)',
    'Permutation & Combination',
    'Probability',
    'Quadratic Equations',
    'Number Series (Missing Number)',
    'Number Series (Wrong Number)',
    'Data Interpretation – Tables',
    'Data Interpretation – Bar Graphs',
    'Data Interpretation – Line Graphs',
    'Data Interpretation – Pie Charts',
    'Data Interpretation – Caselets',
    'Data Sufficiency',
  ],
  Reasoning: [
    'Direction Sense Test',
    'Blood Relations',
    'Coding-Decoding',
    'Number Series',
    'Alphabet Series',
    'Analogy',
    'Classification (Odd One Out)',
    'Syllogism',
    'Statement & Conclusion',
    'Statement & Assumption',
    'Statement & Argument',
    'Cause & Effect',
    'Linear Seating Arrangement',
    'Circular Seating Arrangement',
    'Rectangular / Square Seating',
    'Floor-Based Puzzles',
    'Box-Based Puzzles',
    'Scheduling (Day / Month) Puzzles',
    'Comparison Puzzles',
    'Input-Output',
    'Order & Ranking',
    'Coded Inequalities',
    'Alphanumeric Series',
    'Logical Venn Diagrams',
    'Data Sufficiency',
    'Statement & Course of Action',
    'Assertion & Reason',
    'Critical Reasoning (Inference)',
    'Puzzles – Persons & Professions',
    'Designation-Based Puzzles',
    'Number Puzzles (Missing Numbers)',
  ],
  English: [
    'Reading Comprehension',
    'Cloze Test',
    'Para Jumbles',
    'Error Spotting',
    'Sentence Improvement',
    'Fill in the Blanks (Single)',
    'Fill in the Blanks (Double)',
    'Synonyms',
    'Antonyms',
    'Idioms & Phrases',
    'One Word Substitution',
    'Spelling Correction',
    'Active & Passive Voice',
    'Direct & Indirect Speech',
    'Tenses',
    'Subject-Verb Agreement',
    'Articles',
    'Prepositions',
    'Conjunctions',
    'Paragraph Completion',
    'Odd Sentence Out',
    'Word Usage in Context',
    'Theme Detection',
    'Connectors / Sentence Starters',
    'Phrasal Verbs',
  ],
  'General Awareness': [
    'Current Affairs – Last 6 Months',
    'Union Budget 2026-27',
    'Economic Survey',
    'RBI Monetary Policy & Rates',
    'Government Schemes (Central)',
    'Appointments (National)',
    'Appointments (International)',
    'Awards & Honours',
    'Sports – Tournaments & Winners',
    'Books & Authors',
    'Important Days & Themes',
    'Banking & Financial Awareness',
    'Static GK – Capitals & Currencies',
    'Static GK – National Parks & Wildlife',
    'Static GK – Dams, Rivers & Lakes',
    'Indian Polity Basics',
    'Indian Economy Basics',
    'Census & Demographics',
    'International Summits & Conferences',
    'Science & Tech in News',
  ],
  'Banking Awareness': [
    'Types of Banks in India',
    'RBI – Functions & Structure',
    'NPA & Asset Classification',
    'Priority Sector Lending',
    'Financial Inclusion (PMJDY & others)',
    'Digital Banking – UPI, NEFT, RTGS, IMPS',
    'Basel Norms (I, II, III)',
    'Money Market Instruments',
    'Capital Market Basics',
    'Negotiable Instruments Act, 1881',
    'KYC & AML Norms',
    'Banking Ombudsman Scheme',
    'SARFAESI Act, 2002',
    'DICGC – Deposit Insurance',
    'Credit Rating Agencies & CIBIL',
  ],
  Computer: [
    'Computer Fundamentals & Generations',
    'Hardware & Input / Output Devices',
    'Software – System & Application',
    'MS Word',
    'MS Excel',
    'MS PowerPoint',
    'Internet, Networking & Protocols',
    'Email & Web Browsers',
    'Cyber Security & Malware Basics',
    'Computer Abbreviations',
    'Binary & Number Systems',
    'DBMS & E-Commerce Basics',
  ],
  'Descriptive English': [
    'Essay Writing',
    'Formal Letter Writing',
    'Informal Letter Writing',
    'Precis Writing',
    'Descriptive Reading Comprehension',
    'Report Writing',
    'Paragraph Writing',
  ],
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const docs = [];
  for (const [subject, topics] of Object.entries(SYLLABUS)) {
    for (const topic of topics) {
      docs.push({ subject, topic, status: 'not-started' });
    }
  }

  let inserted = 0;
  for (const doc of docs) {
    const res = await SyllabusTopic.updateOne(
      { subject: doc.subject, topic: doc.topic },
      { $setOnInsert: doc },
      { upsert: true }
    );
    if (res.upsertedCount > 0) inserted++;
  }

  const total = await SyllabusTopic.countDocuments();
  console.log(`Done. Inserted ${inserted} new topics. Total topics in DB: ${total}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
