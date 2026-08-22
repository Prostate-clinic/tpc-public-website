import { NextRequest } from "next/server";
import { serverError } from "@/lib/api-response";
import { proxyToBackend } from "@/lib/backend-api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    return await proxyToBackend(_request, `/payments/initiate/${appointmentId}`, {
      method: "POST",
    });
  } catch (error) {
    return serverError(error);
  }
}
