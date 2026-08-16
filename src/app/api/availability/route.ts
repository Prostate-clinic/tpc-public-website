import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { proxyToBackend } from "@/lib/backend-api";

// Computed slots for one doctor, one consultation type, one day.
// Replaces the deleted /api/slots: slots are derived, never stored.
export async function GET(request: NextRequest) {
  try {
    return await proxyToBackend(request, "/availability", { forwardSearch: true });
  } catch (error) {
    return serverError(error);
  }
}
