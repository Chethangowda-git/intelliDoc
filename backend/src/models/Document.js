import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  status: {
    type: String,
    enum: ['queued', 'extracting', 'embedding', 'ready', 'failed'],
    default: 'queued',
  },
  errorMessage: { type: String },
  chunkCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Document = mongoose.model('Document', documentSchema);