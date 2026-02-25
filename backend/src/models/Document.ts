import mongoose, { Document as MDoc, Schema } from "mongoose";

export type DocumentStatus = "queued" | "extracting" | "embedding" | "ready" | "failed";

interface IDocument extends MDoc {
  userId: mongoose.Types.ObjectId;
  originalName: string;
  fileName: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  status: DocumentStatus;
  errorMessage?: string;
  pageCount?: number;
  chunkCount?: number;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx"], required: true },
    fileSize: { type: Number, required: true },
    status: {
      type: String,
      enum: ["queued", "extracting", "embedding", "ready", "failed"],
      default: "queued"
    },
    errorMessage: { type: String },
    pageCount: { type: Number },
    chunkCount: { type: Number }
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema);
export type { IDocument };
