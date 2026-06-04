import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const response = await fetch(buildBackendUrl(`/blogs/${id}`), {
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
