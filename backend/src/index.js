import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { connectDB } from './config/db.js';
import { authRoutes } from './routes/auth.js';
import { documentRoutes } from './routes/documents.js';
import { startWorker } from './workers/documentWorker.js';
import { chatRoutes } from './routes/chat.js';

const fastify = Fastify({ logger: true });

// Plugins
// await fastify.register(cors, { origin: 'http://localhost:5173', credentials: true });
await fastify.register(cors, {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
await fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
await fastify.register(jwt, { secret: process.env.JWT_SECRET });

// Routes
await fastify.register(authRoutes);
await fastify.register(documentRoutes);
await fastify.register(chatRoutes);

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

// Start
try {
  await connectDB();
  startWorker();
  await fastify.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}