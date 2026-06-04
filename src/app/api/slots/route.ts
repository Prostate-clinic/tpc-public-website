import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(buildBackendUrl("/slots", request.nextUrl.search), {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
