import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(buildBackendUrl("/patients/history"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
