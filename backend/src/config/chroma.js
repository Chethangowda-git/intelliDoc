import { ChromaClient } from 'chromadb';

export const chroma = new ChromaClient({ path: process.env.CHROMA_URL });

function noopFn(dims) {
  return { generate: async (texts) => texts.map(() => new Array(dims).fill(0)) };
}

export async function getOrCreateCollection(name, dims = 384) {
  return await chroma.getOrCreateCollection({
    name,
    metadata: { 'hnsw:space': 'cosine' },
    embeddingFunction: noopFn(dims),
  });
}

export async function deleteCollection(name) {
  try {
    await chroma.deleteCollection({ name });
  } catch {}
}