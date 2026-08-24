import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/middleware";
import { sendComplaintStatusUpdateEmail } from "@/lib/email";

// GET /api/complaints/[id] - Get single complaint with history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      resident: {
        select: { id: true, name: true, email: true, flatNumber: true },
      },
      history: {
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  // Residents can only see their own complaints
  if (auth.role !== "ADMIN" && complaint.residentId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    complaint,
    isAdmin: auth.role === "ADMIN",
    isOwner: complaint.residentId === auth.userId,
  });
}

// PATCH /api/complaints/[id] - Update complaint (status change by admin, edit by owner)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status, note, priority, description, category, photoUrl } = body;

  // Status changes are admin-only
  if (status && auth.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can change complaint status" },
      { status: 403 }
    );
  }

  // Residents can only edit their own complaints and only if OPEN
  if (auth.role !== "ADMIN") {
    if (complaint.residentId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if ((description || category || photoUrl !== undefined) && complaint.status !== "OPEN") {
      return NextResponse.json({ error: "Cannot edit complaint after work has started" }, { status: 403 });
    }
  }

  const updateData: Record<string, unknown> = {};

  if (description) updateData.description = description;
  if (category && auth.role === "ADMIN") updateData.category = category;
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

  if (priority && auth.role === "ADMIN") {
    updateData.priority = priority;
  }

  let isNoteOnly = false;

  if (status) {
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    updateData.status = status;

    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }

    // Create history entry for status change
    await prisma.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        actorId: auth.userId,
        previousStatus: complaint.status,
        newStatus: status,
        note: note || null,
      },
    });
  } else if (note && auth.role === "ADMIN") {
    // Admin adding a note without status change
    isNoteOnly = true;
    await prisma.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        actorId: auth.userId,
        previousStatus: complaint.status,
        newStatus: complaint.status,
        note,
      },
    });
  }

  const updated = await prisma.complaint.update({
    where: { id: params.id },
    data: updateData,
    include: {
      resident: {
        select: { id: true, name: true, email: true, flatNumber: true },
      },
      history: {
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  // Handle emails
  if (status && status !== complaint.status) {
    void sendComplaintStatusUpdateEmail(
      updated.resident.email,
      updated.id,
      status,
      note
    );
  } else if (isNoteOnly && note) {
    const { sendComplaintNoteEmail } = await import("@/lib/email");
    void sendComplaintNoteEmail(updated.resident.email, updated.id, note);
  }
  
  if (priority && priority !== complaint.priority) {
    const { sendComplaintPriorityUpdateEmail } = await import("@/lib/email");
    void sendComplaintPriorityUpdateEmail(updated.resident.email, updated.id, priority);
  }

  return NextResponse.json({ complaint: updated });
}

// DELETE /api/complaints/[id] - Delete complaint (admin only or owner)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  if (auth.role !== "ADMIN") {
    if (complaint.residentId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (complaint.status !== "OPEN") {
      return NextResponse.json({ error: "Cannot delete complaint after work has started" }, { status: 403 });
    }
  }

  // Delete history first (foreign key constraint)
  await prisma.complaintHistory.deleteMany({
    where: { complaintId: params.id },
  });

  await prisma.complaint.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Complaint deleted" });
}
