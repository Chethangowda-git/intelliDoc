import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import { authenticate } from '../middleware/auth.js';
import { Document } from '../models/Document.js';
// import { redis } from '../config/redis.js';
import { bullMQConnection } from '../config/redis.js';
import { deleteCollection } from '../config/chroma.js';

const UPLOAD_DIR = path.resolve('src/uploads');
const processingQueue = new Queue('document-processing', { connection: bullMQConnection });

export async function documentRoutes(fastify) {
  // Upload document
  fastify.post('/api/documents/upload', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(data.mimetype))
      return reply.status(400).send({ error: 'Only PDF and DOCX files are supported' });

    const ext = path.extname(data.filename);
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Save file to disk
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      data.file.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stats = fs.statSync(filePath);

    // Create document record
    const doc = new Document({
      userId: request.user.userId,
      filename: uniqueName,
      originalName: data.filename,
      mimetype: data.mimetype,
      size: stats.size,
      status: 'queued',
    });
    await doc.save();

    // Enqueue processing job
    await processingQueue.add('process-document', {
      documentId: doc._id.toString(),
      filePath,
      mimetype: data.mimetype,
    });

    return reply.status(201).send({ document: doc });
  });

  // List documents for current user
  fastify.get('/api/documents', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const documents = await Document.find({ userId: request.user.userId })
      .sort({ createdAt: -1 });
    return reply.send({ documents });
  });

  // Get single document
  fastify.get('/api/documents/:id', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const doc = await Document.findOne({
      _id: request.params.id,
      userId: request.user.userId,
    });
    if (!doc) return reply.status(404).send({ error: 'Document not found' });
    return reply.send({ document: doc });
  });

  // Delete document
  fastify.delete('/api/documents/:id', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const doc = await Document.findOneAndDelete({
      _id: request.params.id,
      userId: request.user.userId,
    });
    if (!doc) return reply.status(404).send({ error: 'Document not found' });

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    // await deleteCollection(doc._id.toString());
    // Replace the single deleteCollection call with:
await deleteCollection(`doc_${doc._id}_huggingface`);
await deleteCollection(`doc_${doc._id}_gemini`);

    return reply.send({ message: 'Document deleted' });
  });
}