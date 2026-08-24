import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ txRef: string }> },
) {
  try {
    const { txRef } = await params;
    const response = await fetch(buildBackendUrl(`/payments/verify/${encodeURIComponent(txRef)}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
