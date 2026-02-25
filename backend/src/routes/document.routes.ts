import { Router } from "express";
import { getDocument, listDocuments, uploadDocument } from "../controllers/document.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authMiddleware);
router.post("/upload", uploadSingle, uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);

export default router;
