import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { DocumentModel } from "../models/Document.js";
import { DOCUMENT_QUEUE_NAME } from "./document.queue.js";

export const startDocumentWorker = () => {
  const worker = new Worker(
    DOCUMENT_QUEUE_NAME,
    async (job) => {
      const { documentId } = job.data as { documentId: string };
      console.log(`Processing document: ${documentId}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await DocumentModel.findByIdAndUpdate(documentId, { status: "ready" });
      console.log(`Done: ${documentId}`);
    },
    { connection: redisConnection }
  );

  worker.on("error", (err) => console.error("Worker error", err));
  return worker;
};
