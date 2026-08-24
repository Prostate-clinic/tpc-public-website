import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

export async function GET() {
  try {
    const response = await fetch(buildBackendUrl("/doctors"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
