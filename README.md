# IntelliDoc

Phase 1, Step 1 scaffold for a monorepo setup with separate API and worker processes.

## Project Structure

```text
intellidoc/
├── packages/
│   └── shared/
│       ├── src/
│       │   └── types/
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── queues/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── worker/
│       ├── src/
│       │   ├── jobs/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── package.json
```

## Why API + Worker split?

A t2.micro instance has limited memory. Running API request handling and document processing in one process can cause memory spikes from large uploads and affect all users. Splitting API and worker isolates failures and is production-friendly.

## Why `packages/shared`?

Both API and worker can import shared types and utilities from one place so contracts stay consistent and avoid drift.
