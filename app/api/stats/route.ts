import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/middleware";
import { isOverdue } from "@/lib/overdue";

// GET /api/stats - Admin dashboard stats
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isErrorResponse(auth)) return auth;

  try {
    const [totalComplaints, openComplaints, inProgressComplaints, resolvedComplaints, totalUsers, totalNotices] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: "OPEN" } }),
      prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.user.count(),
      prisma.notice.count(),
    ]);

    // Calculate overdue (need to fetch all unresolved to check thresholds)
    const unresolvedComplaints = await prisma.complaint.findMany({
      where: { status: { not: "RESOLVED" } },
      select: { createdAt: true, priority: true, status: true },
    });

    const overdueCount = unresolvedComplaints.filter((c) =>
      isOverdue(c.createdAt, c.priority, c.status)
    ).length;

    // Get category breakdown
    const categoryCounts = await prisma.complaint.groupBy({
      by: ["category"],
      _count: { id: true },
    });

    const categories = categoryCounts.reduce((acc, curr) => {
      acc[curr.category] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      stats: {
        complaints: {
          total: totalComplaints,
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          overdue: overdueCount,
        },
        categories,
        users: totalUsers,
        notices: totalNotices,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
