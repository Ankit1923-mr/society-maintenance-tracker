import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/middleware";

// GET /api/complaints - List complaints (residents see own, admins see all)
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};

  // Residents can only see their own complaints
  if (auth.role !== "ADMIN") {
    where.residentId = auth.userId;
  }

  if (status) where.status = status;
  if (category) where.category = category;

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);

  return NextResponse.json({ complaints, total, page, limit });
}

// POST /api/complaints - Create a new complaint
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { category, description, photoUrl, priority } = body;

    if (!category || !description) {
      return NextResponse.json(
        { error: "Category and description are required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "PLUMBING", "ELECTRICAL", "CLEANLINESS", "SECURITY",
      "PARKING", "LIFT", "OTHER",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        residentId: auth.userId,
        category,
        description,
        photoUrl: photoUrl || null,
        priority: priority || "MEDIUM",
        status: "OPEN",
      },
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true },
        },
      },
    });

    // Create initial history entry
    await prisma.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        actorId: auth.userId,
        previousStatus: null,
        newStatus: "OPEN",
        note: "Complaint created",
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("Create complaint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
