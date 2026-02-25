import axios from "axios";
import { getAccessToken } from "../store/auth.store";

let onAuthFail: (() => void) | null = null;
let refreshHandler: (() => Promise<string>) | null = null;

export const setAuthHooks = (onFail: () => void, onRefresh: () => Promise<string>) => {
  onAuthFail = onFail;
  refreshHandler = onRefresh;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && refreshHandler) {
      original._retry = true;
      try {
        const newToken = await refreshHandler();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        onAuthFail?.();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
