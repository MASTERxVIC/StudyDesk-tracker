import mongoose from 'mongoose';

const ErrorEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    subject: { type: String, default: '' },
    question: { type: String, default: '' },
    mistake: { type: String, default: '' },
    correction: { type: String, default: '' },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ErrorEntry || mongoose.model('ErrorEntry', ErrorEntrySchema);
