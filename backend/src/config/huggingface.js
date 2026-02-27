import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_API_KEY);

const EMBED_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const CHAT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

export async function embedText(text) {
  const result = await hf.featureExtraction({
    model: EMBED_MODEL,
    inputs: text,
  });

  const vector = Array.isArray(result[0]) ? result[0] : result;
  return vector;
}

export async function generateAnswer(prompt) {
  try {
    const response = await hf.chatCompletion({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions about documents. Use only the provided context. Be concise.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    // Log full error details
    console.error('HF generateAnswer error:', JSON.stringify(err, null, 2));
    throw err;
  }
}