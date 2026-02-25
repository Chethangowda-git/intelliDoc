import path from "node:path";
import { NextFunction, Response } from "express";
import { documentQueue } from "../queues/document.queue.js";
import { DocumentModel } from "../models/Document.js";
import { AppError, AuthenticatedRequest } from "../types/index.js";

const getFileType = (filename: string): "pdf" | "docx" => {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".pdf" ? "pdf" : "docx";
};

export const uploadDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    if (!req.file) throw new AppError("File is required", 400);

    const document = await DocumentModel.create({
      userId: req.user.userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileType: getFileType(req.file.originalname),
      fileSize: req.file.size,
      status: "queued"
    });

    await documentQueue.add("process-document", {
      documentId: document.id,
      userId: req.user.userId,
      filePath: req.file.path,
      fileType: document.fileType
    });

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
};

export const listDocuments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const documents = await DocumentModel.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const document = await DocumentModel.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!document) throw new AppError("Document not found", 404);
    res.json({ document });
  } catch (error) {
    next(error);
  }
};
