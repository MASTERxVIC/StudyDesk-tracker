import mongoose from 'mongoose';

const MOCK_TYPES = ['topic-wise', 'sectional', 'full'];

const MockTestSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    mockType: { type: String, enum: MOCK_TYPES, default: 'full' },
    examType: { type: String, default: 'RRB PO' },
    // per-subject results
    quantAttempted: { type: Number, default: 0 },
    quantCorrect: { type: Number, default: 0 },
    reasoningAttempted: { type: Number, default: 0 },
    reasoningCorrect: { type: Number, default: 0 },
    englishAttempted: { type: Number, default: 0 },
    englishCorrect: { type: Number, default: 0 },
    gaAttempted: { type: Number, default: 0 },
    gaCorrect: { type: Number, default: 0 },
    // legacy fields (older entries) — kept for display fallback
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.MockTest || mongoose.model('MockTest', MockTestSchema);
