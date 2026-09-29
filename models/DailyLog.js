import mongoose from 'mongoose';

const STATUS = ['done', 'partial', 'not-started'];

const DailyLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD — one log per day
    quantStatus: { type: String, enum: STATUS, default: 'not-started' },
    reasoningStatus: { type: String, enum: STATUS, default: 'not-started' },
    englishStatus: { type: String, enum: STATUS, default: 'not-started' },
    gaStatus: { type: String, enum: STATUS, default: 'not-started' },
    hours: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
