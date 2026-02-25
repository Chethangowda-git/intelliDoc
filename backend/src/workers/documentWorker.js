import { Worker } from 'bullmq';
import { bullMQConnection } from '../config/redis.js';
import { Document } from '../models/Document.js';
import { extractText } from '../utils/textExtractor.js';
import { chunkText } from '../utils/chunker.js';
import { embedText } from '../config/gemini.js';
import { getOrCreateCollection } from '../config/chroma.js';

export function startWorker() {
  const worker = new Worker('document-processing', async (job) => {
    const { documentId, filePath, mimetype } = job.data;
    //console.log(`📄 Processing document: ${documentId}`);

    // Step 1 — Extract text
    await Document.findByIdAndUpdate(documentId, { status: 'extracting' });
    //console.log(`🔍 Extracting text from ${mimetype}`);
    const rawText = await extractText(filePath, mimetype);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text could be extracted from this document');
    }
    //console.log(`✅ Extracted ${rawText.length} characters`);

    // Step 2 — Chunk text
    await Document.findByIdAndUpdate(documentId, { status: 'embedding' });
    const chunks = chunkText(rawText);
    //console.log(`✂️  Created ${chunks.length} chunks`);

    // Step 3 — Embed each chunk and store in ChromaDB
    const collection = await getOrCreateCollection(documentId);

    const batchSize = 5; // Gemini free tier — be gentle
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const embeddings = await Promise.all(batch.map(chunk => embedText(chunk)));

      await collection.add({
        ids: batch.map((_, j) => `chunk_${i + j}`),
        embeddings,
        documents: batch,
        metadatas: batch.map((_, j) => ({
          documentId,
          chunkIndex: i + j,
        })),
      });

      //console.log(`📦 Stored chunks ${i + 1}–${Math.min(i + batchSize, chunks.length)} / ${chunks.length}`);
    }

    // Step 4 — Mark ready
    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      chunkCount: chunks.length,
    });

    //console.log(`✅ Document ${documentId} ready — ${chunks.length} chunks embedded`);
  }, { connection: bullMQConnection });

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job failed for document ${job.data.documentId}:`, err.message);
    await Document.findByIdAndUpdate(job.data.documentId, {
      status: 'failed',
      errorMessage: err.message,
    });
  });

  //console.log('⚙️  Document worker started');
  return worker;
}