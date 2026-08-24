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
      case "OPEN": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "IN_PROGRESS": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "RESOLVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-white/5 text-slate-400 border-white/10";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-400";
      case "MEDIUM": return "text-amber-400";
      case "LOW": return "text-emerald-400";
      default: return "text-slate-400";
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Complaints</h1>
          <p className="mt-1 text-sm text-slate-400">Track and manage your requests</p>
        </div>
        <Link
          href="/complaints/new"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0f] transition-all duration-200"
        >
          Raise a Complaint
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-16 text-center backdrop-blur-md">
          <h3 className="mt-2 text-sm font-semibold text-white">No complaints</h3>
          <p className="mt-1 text-sm text-slate-400">You haven&apos;t raised any complaints yet.</p>
          <div className="mt-6">
            <Link
              href="/complaints/new"
              className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-slate-200 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {complaints.map((complaint) => (
            <Link
              key={complaint.id}
              href={`/complaints/${complaint.id}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace("_", " ")}
                </span>
                <span className={`text-xs font-semibold tracking-wider ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-2">{complaint.category}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-grow">
                {complaint.description}
              </p>
              
              <div className="mt-auto border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {new Date(complaint.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                  
                  {complaint.status === "OPEN" && (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/complaints/${complaint.id}/edit`;
                        }}
                        className="font-medium text-slate-300 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!confirm("Are you sure you want to delete this complaint?")) return;
                          try {
                            const res = await fetch(`/api/complaints/${complaint.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setComplaints(prev => prev.filter(c => c.id !== complaint.id));
                            } else {
                              alert("Failed to delete");
                            }
                          } catch {
                            alert("Failed to delete");
                          }
                        }}
                        className="font-medium text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
