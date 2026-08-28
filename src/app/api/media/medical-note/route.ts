import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api-response";
import { buildBackendUrl } from "@/lib/backend-api";

// Forward a multipart medical-note upload to the backend's public
// POST /media/medical-note, preserving the raw multipart body. The backend
// (NestJS Multer) reads the buffer from the stream; forwarding the FormData
// wholesale keeps fields and filename intact.
export async function POST(request: NextRequest) {
  try {
    const body = await request.arrayBuffer();
    const contentType = request.headers.get("content-type") || "application/octet-stream";

    const response = await fetch(buildBackendUrl("/media/medical-note"), {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: body as unknown as BodyInit,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return serverError(error);
  }
}
