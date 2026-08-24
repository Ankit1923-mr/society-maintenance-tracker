import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/middleware";
import { isOverdue, getOverdueDate } from "@/lib/overdue";

// GET /api/complaints/overdue - List overdue complaints (admin only)
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isErrorResponse(auth)) return auth;

  const complaints = await prisma.complaint.findMany({
    where: {
      status: { not: "RESOLVED" },
    },
    include: {
      resident: {
        select: { id: true, name: true, email: true, flatNumber: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const overdueComplaints = complaints
    .filter((c) => isOverdue(c.createdAt, c.priority, c.status))
    .map((c) => ({
      ...c,
      overdueDate: getOverdueDate(c.createdAt, c.priority),
      hoursOverdue: Math.round(
        (Date.now() - getOverdueDate(c.createdAt, c.priority).getTime()) /
          (1000 * 60 * 60)
      ),
    }));

  return NextResponse.json({
    overdue: overdueComplaints,
    total: overdueComplaints.length,
  });
}
