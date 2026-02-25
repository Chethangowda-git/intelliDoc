const CHUNK_SIZE = 500;     // characters
const CHUNK_OVERLAP = 50;   // characters of overlap between chunks

export function chunkText(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = start + CHUNK_SIZE;
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}