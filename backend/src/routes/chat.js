import { authenticate } from '../middleware/auth.js';
import { Document } from '../models/Document.js';
import { Conversation } from '../models/Conversation.js';
import { embedText, chatModel } from '../config/gemini.js';
import { getOrCreateCollection } from '../config/chroma.js';

export async function chatRoutes(fastify) {

  // Get or create conversation for a document
  fastify.get('/api/chat/:documentId', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const doc = await Document.findOne({
      _id: request.params.documentId,
      userId: request.user.userId,
    });
    if (!doc) return reply.status(404).send({ error: 'Document not found' });

    let conversation = await Conversation.findOne({
      documentId: request.params.documentId,
      userId: request.user.userId,
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: request.user.userId,
        documentId: request.params.documentId,
        messages: [],
      });
      await conversation.save();
    }

    return reply.send({ conversation });
  });

  // Ask a question — streams SSE response
  fastify.post('/api/chat/:documentId/ask', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const { question } = request.body;

    if (!question?.trim())
      return reply.status(400).send({ error: 'Question is required' });

    const doc = await Document.findOne({
      _id: request.params.documentId,
      userId: request.user.userId,
    });
    if (!doc) return reply.status(404).send({ error: 'Document not found' });
    if (doc.status !== 'ready')
      return reply.status(400).send({ error: 'Document is still processing' });

    // Set up SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:5173',
    });

    const send = (event, data) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Step 1 — Embed the question
      send('status', { message: 'Searching document...' });
      const questionEmbedding = await embedText(question);

      // Step 2 — Query ChromaDB for top chunks
      const collection = await getOrCreateCollection(doc._id.toString());
      const results = await collection.query({
        queryEmbeddings: [questionEmbedding],
        nResults: Math.min(5, doc.chunkCount),
      });

      const topChunks = results.documents[0];
      const topMetas = results.metadatas[0];

      if (!topChunks || topChunks.length === 0) {
        send('error', { message: 'No relevant content found in document' });
        reply.raw.end();
        return;
      }

      // Step 3 — Build prompt with context
      const context = topChunks
        .map((chunk, i) => `[Source ${i + 1}]: ${chunk}`)
        .join('\n\n');

      const prompt = `You are a helpful assistant answering questions about a document.

Use ONLY the context below to answer the question. If the answer is not in the context, say "I couldn't find that in the document."

At the end of your answer, list which sources you used as: **Sources: [1], [2]** etc.

Context:
${context}

Question: ${question}

Answer:`;

      // Step 4 — Stream response from Gemini
      send('status', { message: 'Generating answer...' });

      const streamResult = await chatModel.generateContentStream(prompt);
      let fullResponse = '';

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          send('token', { text });
        }
      }

      // Step 5 — Save to conversation history
      const sources = topChunks.map((text, i) => ({
        chunkIndex: topMetas[i]?.chunkIndex ?? i,
        text: text.slice(0, 200), // preview
      }));

      let conversation = await Conversation.findOne({
        documentId: doc._id,
        userId: request.user.userId,
      });

      if (!conversation) {
        conversation = new Conversation({
          userId: request.user.userId,
          documentId: doc._id,
          messages: [],
        });
      }

      conversation.messages.push({ role: 'user', content: question });
      conversation.messages.push({ role: 'assistant', content: fullResponse, sources });
      await conversation.save();

      send('done', { sources });
      reply.raw.end();

    } catch (err) {
      console.error('Chat error:', err.message);
      send('error', { message: 'Something went wrong. Please try again.' });
      reply.raw.end();
    }
  });
}