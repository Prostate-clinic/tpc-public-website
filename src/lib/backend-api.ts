const DEFAULT_BACKEND_BASE_URL = "http://localhost:4000/api";

export function getBackendBaseUrl() {
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    DEFAULT_BACKEND_BASE_URL
  ).replace(/\/$/, "");
}

export function buildBackendUrl(path: string, search?: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getBackendBaseUrl()}${normalizedPath}`;
  if (!search) return url;
  return `${url}${search.startsWith("?") ? search : `?${search}`}`;
}
