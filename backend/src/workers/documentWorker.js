import { Worker } from 'bullmq';
import { bullMQConnection } from '../config/redis.js';
import { Document } from '../models/Document.js';
import { extractText } from '../utils/textExtractor.js';
import { chunkText } from '../utils/chunker.js';
import { embedText as hfEmbed } from '../config/huggingface.js';
import { embedText as geminiEmbed } from '../config/gemini.js';
import { getOrCreateCollection } from '../config/chroma.js';
import fs from 'fs';

async function storeChunks(chunks, documentId, embedFn, collectionName, dims) {
  const collection = await getOrCreateCollection(collectionName, dims);
  const batchSize = 5;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(chunk => embedFn(chunk)));

    await collection.add({
      ids: batch.map((_, j) => `chunk_${i + j}`),
      embeddings,
      documents: batch,
      metadatas: batch.map((_, j) => ({ documentId, chunkIndex: i + j })),
    });

    console.log(`📦 [${collectionName}] Stored chunks ${i + 1}–${Math.min(i + batchSize, chunks.length)} / ${chunks.length}`);
  }
}

export function startWorker() {
  const worker = new Worker('document-processing', async (job) => {
    const { documentId, filePath, mimetype } = job.data;
    console.log(`📄 Processing document: ${documentId}`);

    // Step 1 — Extract
    await Document.findByIdAndUpdate(documentId, { status: 'extracting' });
    const rawText = await extractText(filePath, mimetype);
    if (!rawText?.trim()) throw new Error('No text could be extracted');
    console.log(`✅ Extracted ${rawText.length} characters`);

    // Step 2 — Chunk
    await Document.findByIdAndUpdate(documentId, { status: 'embedding' });
    const chunks = chunkText(rawText);
    console.log(`✂️  Created ${chunks.length} chunks`);

    // Step 3 — Embed with HuggingFace
    console.log('🤗 Embedding with HuggingFace...');
    await storeChunks(chunks, documentId, hfEmbed, `doc_${documentId}_huggingface`, 384);

    // Step 4 — Embed with Gemini
    console.log('✨ Embedding with Gemini...');
    await storeChunks(chunks, documentId, geminiEmbed, `doc_${documentId}_gemini`, 3072);

    // Step 5 — Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted file: ${filePath}`);
    }

    // Step 6 — Mark ready
    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      chunkCount: chunks.length,
    });

    console.log(`✅ Document ${documentId} ready — ${chunks.length} chunks embedded with both providers`);
  }, { connection: bullMQConnection });

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job failed:`, err.message);
    await Document.findByIdAndUpdate(job.data.documentId, {
      status: 'failed',
      errorMessage: err.message,
    });
  });

  console.log('⚙️  Document worker started');
  return worker;
}