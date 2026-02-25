export interface User {
  id: string;
  email: string;
  name: string;
}

export type DocumentStatus = "queued" | "extracting" | "embedding" | "ready" | "failed";

export interface DocumentItem {
  _id: string;
  originalName: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  status: DocumentStatus;
  createdAt: string;
}
