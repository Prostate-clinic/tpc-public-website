import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl, proxyToBackend } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/patients/change-password", { method: "POST", forwardBody: true });
}
