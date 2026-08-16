import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { proxyToBackend } from "@/lib/backend-api";

// Availability across a date range (max 92 days) — powers the calendar, so the
// patient never clicks a day that has nothing on it.
export async function GET(request: NextRequest) {
  try {
    return await proxyToBackend(request, "/availability/range", { forwardSearch: true });
  } catch (error) {
    return serverError(error);
  }
}
