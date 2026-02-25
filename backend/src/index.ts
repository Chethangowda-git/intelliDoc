import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import { AppError } from "./types/index.js";
import { startDocumentWorker } from "./queues/document.worker.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

app.use((_req, _res, next) => next(new AppError("Not found", 404)));
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode || 500;
  const message = status === 500 && env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(status).json({ error: { message, code: err.code } });
});

const start = async () => {
  await connectDB();
  startDocumentWorker();
  app.listen(env.PORT, () => console.log(`Server listening on ${env.PORT}`));
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
