import mongoose from 'mongoose';

const CurrentAffairSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    category: { type: String, default: 'Banking' },
    title: { type: String, required: true },
    detail: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.CurrentAffair || mongoose.model('CurrentAffair', CurrentAffairSchema);
