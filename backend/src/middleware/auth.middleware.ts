import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError, AuthenticatedRequest, JwtPayload } from "../types/index.js";

export const authMiddleware = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return next(new AppError("Unauthorized", 401));
  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
};
