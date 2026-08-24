"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Priority, Status, Category } from "@prisma/client";

interface Complaint {
  id: string;
  category: Category;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const res = await fetch("/api/complaints");
        const data = await res.json();
        if (data.complaints) {
          setComplaints(data.complaints);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-amber-100 text-amber-800 border-amber-200";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
      case "RESOLVED": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-600";
      case "MEDIUM": return "text-amber-600";
      case "LOW": return "text-green-600";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage your requests</p>
        </div>
        <Link
          href="/complaints/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Raise a Complaint
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center shadow-sm">
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No complaints</h3>
          <p className="mt-1 text-sm text-slate-500">You haven&apos;t raised any complaints yet.</p>
          <div className="mt-6">
            <Link
              href="/complaints/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {complaints.map((complaint) => (
            <Link
              key={complaint.id}
              href={`/complaints/${complaint.id}`}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace("_", " ")}
                </span>
                <span className={`text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{complaint.category}</h3>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-grow">
                {complaint.description}
              </p>
              <div className="text-xs text-slate-400 mt-auto">
                {new Date(complaint.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
