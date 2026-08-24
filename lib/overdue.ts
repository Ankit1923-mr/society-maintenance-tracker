import { Priority } from "@prisma/client";

// Overdue thresholds in hours based on priority
const OVERDUE_THRESHOLDS: Record<Priority, number> = {
  HIGH: 24,    // 1 day
  MEDIUM: 72,  // 3 days
  LOW: 168,    // 7 days
};

export function getOverdueThreshold(priority: Priority): number {
  return OVERDUE_THRESHOLDS[priority];
}

export function isOverdue(createdAt: Date, priority: Priority, status: string): boolean {
  if (status === "RESOLVED") return false;

  const thresholdHours = getOverdueThreshold(priority);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > thresholdHours;
}

export function getOverdueDate(createdAt: Date, priority: Priority): Date {
  const thresholdHours = getOverdueThreshold(priority);
  return new Date(createdAt.getTime() + thresholdHours * 60 * 60 * 1000);
}
