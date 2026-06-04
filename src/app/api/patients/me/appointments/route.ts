import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const res = await fetch(buildBackendUrl("/patients/me/appointments"), {
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
