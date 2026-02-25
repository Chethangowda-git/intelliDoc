import api from "./axios";
import type { User } from "../types";

export const registerApi = async (payload: { email: string; password: string; name: string }) => {
  const { data } = await api.post<{ user: User; accessToken: string }>("/api/auth/register", payload);
  return data;
};

export const loginApi = async (payload: { email: string; password: string }) => {
  const { data } = await api.post<{ user: User; accessToken: string }>("/api/auth/login", payload);
  return data;
};

export const refreshToken = async () => {
  const { data } = await api.post<{ accessToken: string }>("/api/auth/refresh");
  return data;
};

export const logoutApi = async () => api.post("/api/auth/logout");
