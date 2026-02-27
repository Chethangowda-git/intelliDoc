# IntelliDoc

**AI-powered document intelligence platform with RAG pipeline**

Upload a PDF or DOCX, ask questions in natural language, and get answers grounded in your document — with source citations. Supports both open-source (HuggingFace) and proprietary (Gemini) model providers, switchable at runtime.

---

## Demo

> Upload a document → watch it process in real-time → ask anything → get a streamed answer with citations

**Core demo moments:**
- Upload a PDF and watch the status cycle: `Queued → Extracting → Embedding → Ready`
- Switch between 🤗 HuggingFace and ✨ Gemini using the header toggle
- Ask a question and watch the answer stream token by token
- See source citations below each answer showing exactly which chunks were used

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INGESTION PIPELINE                    │
│                                                             │
│  Upload ──► Fastify ──► Save to disk ──► MongoDB (queued)   │
│                                ↓                            │
│                          BullMQ Queue                       │
│                                ↓                            │
│                         Worker picks up                     │
│                                ↓                            │
│            pdf-parse / mammoth ──► Raw text                 │
│                                ↓                            │
│                    Chunker (500 chars, 50 overlap)           │
│                                ↓                            │
│         ┌──────────────────────┴──────────────────────┐    │
│         ▼                                              ▼    │
│  HF all-MiniLM-L6-v2                    Gemini embedding-001│
│  (384 dims)                             (3072 dims)         │
│         ↓                                              ↓    │
│  ChromaDB: doc_{id}_huggingface  ChromaDB: doc_{id}_gemini  │
│                                                             │
│                    File deleted from disk                   │
│                    MongoDB: status → ready                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         QUERY PIPELINE                       │
│                                                             │
│  User question                                              │
│        ↓                                                    │
│  Embed with selected provider (HF or Gemini)                │
│        ↓                                                    │
│  ChromaDB cosine similarity search (HNSW)                   │
│        ↓                                                    │
│  Top 5 semantically relevant chunks                         │
│        ↓                                                    │
│  Prompt: "Use ONLY this context to answer..."               │
│        ↓                                                    │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │ Qwen2.5-7B (HF) │   or    │ gemini-2.5-flash        │   │
│  └─────────────────┘         └─────────────────────────┘   │
│        ↓                                                    │
│  Streamed tokens via SSE ──► Frontend                       │
│        ↓                                                    │
│  Save to MongoDB Conversation                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Fastify (Node.js) | Faster than Express, built-in schema validation |
| **Frontend** | Vite + React | Fast dev server, no CRA bloat |
| **Job Queue** | BullMQ + Redis | Async processing — upload returns instantly, processing happens in background |
| **Vector DB** | ChromaDB | Local vector storage with cosine similarity search, no cloud needed |
| **Document DB** | MongoDB | Flexible schema for documents and conversation history |
| **Embeddings (OSS)** | HuggingFace all-MiniLM-L6-v2 | Fast, free, 384-dim, runs via HF Inference API |
| **Chat (OSS)** | Qwen2.5-7B-Instruct | Strong open-source model, available on HF free tier |
| **Embeddings (API)** | Gemini gemini-embedding-001 | 3072-dim embeddings, high quality |
| **Chat (API)** | Gemini 2.5 Flash | Fast, low cost, streaming support |
| **Streaming** | Server-Sent Events (SSE) | Real-time token streaming without WebSocket overhead |
| **Auth** | JWT | Stateless, works with any client |
| **Infra** | Docker Compose | One-command local setup for all services |

---

## Why RAG and not just "send the document to the LLM"?

Three reasons:

**1. Context window limits** — A 50-page PDF is ~100,000 tokens. Most models cap at 8k–32k tokens in practice. RAG retrieves only the 5 most relevant chunks (~2,500 tokens) regardless of document size.

**2. Cost** — Sending a full document on every query costs 40x more tokens than RAG retrieval. At scale this matters.

**3. Precision** — The model is forced to answer from retrieved chunks only. The system prompt says `"Use ONLY the context below"` — this grounds the answer in your document and prevents hallucination from training data.

The retrieval step uses **cosine similarity** between embedding vectors. When you embed `"invoice due within 30 days"` and later embed `"what are the payment terms?"`, both vectors land close together in 384-dimensional space because they share semantic meaning — even though they share zero keywords.

---

## Why Two Embedding Providers?

Both collections are built during ingestion so provider switching at query time is instant — no re-processing needed.

The embedding model must match between ingestion and query. If you embed documents with HuggingFace but query with Gemini, the vectors live in different mathematical spaces and similarity search returns garbage. This is why `doc_{id}_huggingface` and `doc_{id}_gemini` are separate ChromaDB collections.

---

## Project Structure

```
intellidoc/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   ├── redis.js           # Redis + BullMQ connections
│   │   │   ├── chroma.js          # ChromaDB client + collection helpers
│   │   │   ├── gemini.js          # Gemini embed + chat
│   │   │   └── huggingface.js     # HF embed + chat
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verification
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   ├── Document.js        # Document schema + status enum
│   │   │   └── Conversation.js    # Chat history schema
│   │   ├── routes/
│   │   │   ├── auth.js            # Register + login
│   │   │   ├── documents.js       # Upload + list + delete
│   │   │   └── chat.js            # RAG Q&A with SSE streaming
│   │   ├── utils/
│   │   │   ├── textExtractor.js   # pdf-parse + mammoth
│   │   │   └── chunker.js         # Fixed-size chunking with overlap
│   │   └── workers/
│   │       └── documentWorker.js  # BullMQ worker — extract, chunk, embed
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js          # Axios instance + JWT interceptor
│   │   ├── components/
│   │   │   ├── ChatPanel.jsx      # SSE streaming chat UI
│   │   │   ├── DocumentCard.jsx   # Status badge + click to chat
│   │   │   ├── EmptyState.jsx
│   │   │   ├── SkeletonCard.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── UploadZone.jsx     # react-dropzone
│   │   ├── hooks/
│   │   │   └── useToast.js
│   │   └── pages/
│   │       ├── AuthPage.jsx       # Register + login
│   │       └── DashboardPage.jsx  # Main app shell + provider toggle
│   └── package.json
└── docker-compose.yml
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Docker + Docker Compose
- HuggingFace API key (free) — [get one here](https://huggingface.co/settings/tokens)
- Gemini API key (free tier) — [get one here](https://aistudio.google.com/apikey)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/intellidoc.git
cd intellidoc

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/intellidoc
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this
CHROMA_URL=http://localhost:8000
HF_API_KEY=hf_your_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts MongoDB, Redis, and ChromaDB locally.

### 4. Start backend + frontend

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## Key Technical Decisions

### Why BullMQ instead of processing synchronously?

A large PDF can take 30–60 seconds to extract, chunk, and embed. Processing synchronously inside the HTTP handler would time out the upload request and block the server. BullMQ queues the job and returns the upload response instantly — the worker processes in the background and MongoDB status updates drive the UI polling.

### Why fixed-size chunking with overlap?

Semantic chunking (splitting on paragraph/sentence boundaries) produces more natural chunks but adds significant complexity. Fixed-size chunking with 50-character overlap is simpler and effective — the overlap ensures sentences that straddle a chunk boundary appear in both adjacent chunks, so no context is lost at edges.

### Why ChromaDB instead of MongoDB for vectors?

MongoDB stores documents. ChromaDB stores vectors and runs cosine similarity search efficiently using HNSW (Hierarchical Navigable Small World) indexing. HNSW finds nearest vectors in O(log n) instead of O(n) — irrelevant at 36 chunks but critical at millions. Using MongoDB for vector search would require full collection scans.

### Why SSE instead of WebSockets for streaming?

SSE is one-way (server → client), which is all that's needed for token streaming. WebSockets are bidirectional and add handshake overhead. SSE works over standard HTTP, is simpler to implement, and works through proxies and load balancers without special configuration.

### Why separate ChromaDB collections per provider?

Embedding vectors from different models are not comparable. `all-MiniLM-L6-v2` produces 384-dimensional vectors; `gemini-embedding-001` produces 3072-dimensional vectors. Even if dimensions matched, the vector spaces are different — similarity scores would be meaningless. Separate collections guarantee queries always use the correct vector space.

---

## Known Limitations

- **No OCR support** — scanned PDFs (image-based) return empty text. Only text-layer PDFs work.
- **Fixed chunking** — semantic chunking would produce better retrieval for documents with clear section boundaries.
- **Single document chat** — conversations are per-document. Cross-document Q&A is not supported.
- **HF free tier rate limits** — the HuggingFace Inference API has per-minute limits on the free tier. Heavy testing will hit these.
- **Local ChromaDB** — data is stored in a Docker volume. If the volume is deleted, all embeddings must be regenerated by re-uploading documents.

## What I Would Add in v2

- Semantic chunking using sentence boundaries
- OCR via Tesseract for scanned documents
- Cross-document Q&A — query across multiple uploaded documents simultaneously
- Streaming for HuggingFace (currently simulated word-by-word)
- Ollama support for fully offline local inference
- Pinecone integration for persistent cloud vector storage
