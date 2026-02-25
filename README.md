# IntelliDoc — Phase 1 Foundation

Monorepo skeleton with:
- Backend (Express + MongoDB + Redis/BullMQ)
- Frontend (React + Vite + Tailwind)
- Docker Compose (MongoDB, Redis, ChromaDB)

## Run

```bash
docker-compose up -d
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5001
