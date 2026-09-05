const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://127.0.0.1:8000"
  : "";

const trimTrailingSlashes = (value) =>
  value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlashes(
  import.meta.env.VITE_API_BASE_URL ||
    DEFAULT_API_BASE_URL
);

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
};
