import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { proxyToBackend } from "@/lib/backend-api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await proxyToBackend(request, `/appointments/${id}/reschedule`, {
      method: "PATCH",
      forwardBody: true,
    });
  } catch (error) {
    return serverError(error);
  }
}
