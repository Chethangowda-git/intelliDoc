export interface DocumentRecord {
  id: string;
  userId: string;
  filename: string;
  status: "queued" | "processing" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
}
