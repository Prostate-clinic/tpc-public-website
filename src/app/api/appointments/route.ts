import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const authHeader = request.headers.get("Authorization");
    const response = await fetch(buildBackendUrl("/appointments"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
