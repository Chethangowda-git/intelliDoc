import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const DOCUMENT_QUEUE_NAME = "document-processing";

export const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection
});
