import mongoose from 'mongoose';

const VocabWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    meaning: { type: String, default: '' },
    example: { type: String, default: '' },
    dateAdded: { type: String, default: '' }, // YYYY-MM-DD
    mastered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.VocabWord || mongoose.model('VocabWord', VocabWordSchema);
