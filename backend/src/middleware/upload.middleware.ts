import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { AppError } from "../types/index.js";

const allowedMime = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const allowedExt = [".pdf", ".docx"];

if (!fs.existsSync(env.UPLOAD_DIR)) fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedMime.includes(file.mimetype) || !allowedExt.includes(ext)) {
    return cb(new AppError("Only PDF and DOCX files are allowed", 400));
  }
  cb(null, true);
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 }
}).single("file");
