import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { proxyToBackend } from "@/lib/backend-api";

// Forwards Authorization and x-idempotency-key. The latter is what makes a
// double-click or a retried request return the ORIGINAL appointment instead of
// booking a second one.
export async function POST(request: NextRequest) {
  try {
    return await proxyToBackend(request, "/appointments", {
      method: "POST",
      forwardBody: true,
    });
  } catch (error) {
    return serverError(error);
  }
}
