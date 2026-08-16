import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { proxyToBackend } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  try {
    return await proxyToBackend(request, "/appointments/me", { forwardSearch: true });
  } catch (error) {
    return serverError(error);
  }
}
