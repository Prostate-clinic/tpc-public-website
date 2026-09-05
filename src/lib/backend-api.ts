import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "http://localhost:4000/api";

export function getBackendBaseUrl() {
  return (
    process.env.BACKEND_API_URL || DEFAULT_BACKEND_BASE_URL
  ).replace(/\/$/, "");
}

export function buildBackendUrl(path: string, search?: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getBackendBaseUrl()}${normalizedPath}`;
  if (!search) return url;
  return `${url}${search.startsWith("?") ? search : `?${search}`}`;
}

/**
 * Headers passed straight through to the backend.
 *
 * `x-idempotency-key` matters as much as the token: dropping it here would turn
 * a retried booking into a second appointment.
 */
const FORWARDED_HEADERS = ["authorization", "x-idempotency-key"] as const;

/**
 * Proxy a request to the NestJS backend, preserving its status code.
 *
 * The status must survive: the booking flow branches on 409 (slot taken) and
 * 403 (cancellation window closed), so collapsing everything to 500 would make
 * those indistinguishable from a crash.
 */
export async function proxyToBackend(
  request: NextRequest,
  path: string,
  options: { method?: string; forwardSearch?: boolean; forwardBody?: boolean } = {},
) {
  const { method = "GET", forwardSearch = false, forwardBody = false } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }

  const body = forwardBody
    ? JSON.stringify(await request.json().catch(() => ({})))
    : undefined;

  // Only disable cache for non-GET requests. GET requests benefit from
  // Next.js fetch cache — the backend now has its own TTL cache, so
  // allowing the frontend layer to cache too eliminates redundant round-trips.
  const cacheMode = method === "GET" ? "default" : "no-store";

  const response = await fetch(
    buildBackendUrl(path, forwardSearch ? request.nextUrl.search : undefined),
    { method, headers, body, cache: cacheMode },
  );

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
