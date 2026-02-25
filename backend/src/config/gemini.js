import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
export const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

export async function embedText(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Embedding failed: ${err.error?.message}`);
  }

  const data = await response.json();
  return data.embedding.values;
}