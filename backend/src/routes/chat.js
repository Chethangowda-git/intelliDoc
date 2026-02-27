import { authenticate } from '../middleware/auth.js';
import { Document } from '../models/Document.js';
import { Conversation } from '../models/Conversation.js';
import { embedText as hfEmbed, generateAnswer } from '../config/huggingface.js';
import { embedText as geminiEmbed, chatModel } from '../config/gemini.js';
import { getOrCreateCollection } from '../config/chroma.js';

export async function chatRoutes(fastify) {

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

  fastify.post('/api/chat/:documentId/ask', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const { question, provider = 'huggingface' } = request.body;

    if (!question?.trim())
      return reply.status(400).send({ error: 'Question is required' });

    const doc = await Document.findOne({
      _id: request.params.documentId,
      userId: request.user.userId,
    });
    if (!doc) return reply.status(404).send({ error: 'Document not found' });
    if (doc.status !== 'ready')
      return reply.status(400).send({ error: 'Document is still processing' });

    // SSE setup
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
      const isGemini = provider === 'gemini';
      console.log(`🤖 Using provider: ${provider}`);

      // Step 1 — Embed question with the correct provider
      send('status', { message: `Searching document via ${isGemini ? 'Gemini' : 'HuggingFace'}...` });

      const questionEmbedding = isGemini
        ? await geminiEmbed(question)
        : await hfEmbed(question);

      console.log('✅ Question embedded, dims:', questionEmbedding.length);

      // Step 2 — Query ChromaDB
      // Note: collection name includes provider so embeddings don't mix
      const collectionName = `doc_${doc._id}_${provider}`;
      const collection = await getOrCreateCollection(collectionName, isGemini ? 3072 : 384);

      const results = await collection.query({
        queryEmbeddings: [questionEmbedding],
        nResults: Math.min(5, doc.chunkCount),
      });

      const topChunks = results.documents[0];
      const topMetas = results.metadatas[0];

      if (!topChunks || topChunks.length === 0) {
        send('error', { message: 'No relevant content found. Try re-uploading the document.' });
        reply.raw.end();
        return;
      }

      console.log(`✅ Retrieved ${topChunks.length} chunks`);

      // Step 3 — Build prompt
      send('status', { message: 'Generating answer...' });

      const context = topChunks
        .map((chunk, i) => `[Source ${i + 1}]: ${chunk}`)
        .join('\n\n');

      // Step 4 — Generate with selected provider
      let fullAnswer = '';

      if (isGemini) {
        const prompt = `You are a helpful assistant answering questions about a document.

Use ONLY the context below to answer the question. Be concise and direct.
If the answer is not in the context, say "I couldn't find that in the document."
At the end, list which sources you used as: Sources: [1], [2] etc.

Context:
${context}

Question: ${question}

Answer:`;

        const streamResult = await chatModel.generateContentStream(prompt);
        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            fullAnswer += text;
            send('token', { text });
          }
        }
      } else {
        const prompt = `<s>[INST] You are a helpful assistant answering questions about a document.

Use ONLY the context below to answer the question. Be concise and direct.
If the answer is not in the context, say "I couldn't find that in the document."
At the end, list which sources you used as: Sources: [1], [2] etc.

Context:
${context}

Question: ${question} [/INST]`;

        fullAnswer = await generateAnswer(prompt);

        // Simulate streaming word by word
        const words = fullAnswer.split(' ');
        for (let i = 0; i < words.length; i++) {
          const text = i === words.length - 1 ? words[i] : words[i] + ' ';
          send('token', { text });
          await new Promise(r => setTimeout(r, 20));
        }
      }

      // Step 5 — Save conversation
      const sources = topChunks.map((text, i) => ({
        chunkIndex: topMetas[i]?.chunkIndex ?? i,
        text: text.slice(0, 200),
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
      conversation.messages.push({
        role: 'assistant',
        content: fullAnswer,
        sources,
        provider, // save which model was used
      });
      await conversation.save();

      send('done', { sources, provider });
      reply.raw.end();

    } catch (err) {
      console.error('Chat error:', err.message);

      let userMessage = 'Something went wrong. Please try again.';
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests')) {
        userMessage = '⏳ Rate limit reached. Please wait a minute and try again.';
      } else if (err.message?.includes('503') || err.message?.includes('loading')) {
        userMessage = '⏳ Model is loading, please retry in 20 seconds.';
      }

      send('error', { message: userMessage });
      reply.raw.end();
    }
  });
}