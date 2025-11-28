const DEFAULT_API_URL = "http://localhost:3001";

const sanitizeBase = (url: string) => url.replace(/\/+$/, "");

const computeApiBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  const trimmed = sanitizeBase(raw);
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = computeApiBaseUrl();

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
