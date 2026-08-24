import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/middleware";

// GET /api/notices/[id] - Get single notice
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const notice = await prisma.notice.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!notice) {
    return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  }

  return NextResponse.json({ notice });
}

// DELETE /api/notices/[id] - Delete notice (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (isErrorResponse(auth)) return auth;

  const notice = await prisma.notice.findUnique({
    where: { id: params.id },
  });

  if (!notice) {
    return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  }

  await prisma.notice.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Notice deleted" });
}
