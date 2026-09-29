import mongoose from 'mongoose';

const SyllabusTopicSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

SyllabusTopicSchema.index({ subject: 1, topic: 1 }, { unique: true });

export default mongoose.models.SyllabusTopic || mongoose.model('SyllabusTopic', SyllabusTopicSchema);
