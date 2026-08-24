import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(buildBackendUrl("/blogs", request.nextUrl.search), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
