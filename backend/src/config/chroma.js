import { ChromaClient } from 'chromadb';

export const chroma = new ChromaClient({ path: process.env.CHROMA_URL });

// Noop embedding function — we always provide embeddings ourselves
const noopEmbeddingFunction = {
  generate: async (texts) => texts.map(() => new Array(3072).fill(0)),
};

export async function getOrCreateCollection(documentId) {
  return await chroma.getOrCreateCollection({
    name: `doc_${documentId}`,
    metadata: { 'hnsw:space': 'cosine' },
    embeddingFunction: noopEmbeddingFunction,
  });
}

export async function deleteCollection(documentId) {
  try {
    await chroma.deleteCollection({ name: `doc_${documentId}` });
  } catch (err) {
    // Safe to ignore — collection may not exist yet
  }
}