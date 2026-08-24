import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/middleware";

// GET /api/notices - List all notices (any authenticated user)
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const important = searchParams.get("important");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (important === "true") where.isImportant = true;

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notice.count({ where }),
  ]);

  return NextResponse.json({ notices, total, page, limit });
}

// POST /api/notices - Create a notice (admin only)
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { title, body: noticeBody, isImportant } = body;

    if (!title || !noticeBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        body: noticeBody,
        isImportant: isImportant || false,
        authorId: auth.userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error("Create notice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
