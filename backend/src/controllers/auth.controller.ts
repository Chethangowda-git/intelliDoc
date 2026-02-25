import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../types/index.js";

const signAccessToken = (userId: string, email: string) =>
  jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

const signRefreshToken = (userId: string, email: string) =>
  jwt.sign({ userId, email }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email || !name || !password || password.length < 8) throw new AppError("Invalid input", 400);

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new AppError("Email already in use", 409);

    const user = await User.create({ email, password, name });
    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id, user.email);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw new AppError("Invalid credentials", 401);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) throw new AppError("Invalid credentials", 401);

    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id, user.email);
    setRefreshCookie(res, refreshToken);

    return res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError("Unauthorized", 401);
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; email: string };
    const accessToken = signAccessToken(payload.userId, payload.email);
    return res.json({ accessToken });
  } catch (error) {
    next(new AppError("Unauthorized", 401));
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out" });
};
