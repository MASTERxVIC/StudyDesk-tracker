import mongoose from 'mongoose';

const WeeklyReviewSchema = new mongoose.Schema(
  {
    weekStart: { type: String, required: true }, // YYYY-MM-DD (Monday)
    hoursStudied: { type: Number, default: 0 },
    mocksTaken: { type: Number, default: 0 },
    avgAccuracy: { type: Number, default: 0 },
    wins: { type: String, default: '' },
    improvements: { type: String, default: '' },
    nextWeekFocus: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.WeeklyReview || mongoose.model('WeeklyReview', WeeklyReviewSchema);
