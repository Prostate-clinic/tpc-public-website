import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(buildBackendUrl("/patients/verify-email-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
