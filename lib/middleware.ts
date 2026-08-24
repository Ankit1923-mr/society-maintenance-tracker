import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest, JWTPayload } from "./auth";

export async function requireAuth(
  request: Request
): Promise<JWTPayload | NextResponse> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return payload;
}

export async function requireAdmin(
  request: Request
): Promise<JWTPayload | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (result.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
  }

  return result;
}

export function isErrorResponse(
  result: JWTPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
