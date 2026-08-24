"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Category, Priority, Status } from "@prisma/client";

interface Complaint {
  id: string;
  category: Category;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  resident: {
    name: string;
    flatNumber: string | null;
  };
  overdueDate?: string;
  hoursOverdue?: number;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [overdue, setOverdue] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const fetchData = async () => {
    try {
      const [complaintsRes, overdueRes] = await Promise.all([
        fetch("/api/complaints?limit=100"), // simplify with large limit for now
        fetch("/api/complaints/overdue")
      ]);
      const complaintsData = await complaintsRes.json();
      const overdueData = await overdueRes.json();

      if (complaintsData.complaints) setComplaints(complaintsData.complaints);
      if (overdueData.overdue) setOverdue(overdueData.overdue);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData(); // refresh list to recalculate overdue etc
    } catch (error) {
      console.error(error);
    }
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    try {
      await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    try {
      const res = await fetch(`/api/complaints/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete complaint");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete complaint");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Loading complaints...</div>
      </div>
    );
  }

  // Combine and sort: Overdue first, then by date desc
  // A complaint is overdue if it exists in the overdue array
  const overdueIds = new Set(overdue.map(c => c.id));
  
  const filtered = complaints.filter(c => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const aOverdue = overdueIds.has(a.id);
    const bOverdue = overdueIds.has(b.id);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Manage Complaints</h1>
        <p className="mt-1 text-sm text-slate-400">View and update resident issues</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border-white/10 bg-[#0a0a0f] text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Category</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border-white/10 bg-[#0a0a0f] text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition-colors"
          >
            <option value="ALL">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="CLEANLINESS">Cleanliness</option>
            <option value="SECURITY">Security</option>
            <option value="PARKING">Parking</option>
            <option value="LIFT">Lift</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Complaint</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Resident</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-transparent">
              {filtered.map((complaint) => {
                const isOverdue = overdueIds.has(complaint.id);
                const overdueDetails = overdue.find(o => o.id === complaint.id);

                return (
                  <tr key={complaint.id} className={`${isOverdue ? "bg-red-500/10" : "hover:bg-white/5"} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{complaint.category}</span>
                        <span className="text-sm text-slate-400 truncate max-w-[200px] mt-1">{complaint.description}</span>
                        {isOverdue && (
                          <span className="mt-2 text-xs font-semibold text-red-400 flex items-center bg-red-500/10 w-fit px-2 py-1 rounded-md border border-red-500/20">
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Overdue by {overdueDetails?.hoursOverdue}h
                          </span>
                        )}
                        <span className="text-xs text-slate-500 mt-2">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{complaint.resident.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{complaint.resident.flatNumber || "No flat"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        className={`text-xs rounded-full border border-white/10 py-1.5 pl-3 pr-8 font-semibold ring-0 focus:ring-2 focus:ring-inset sm:text-xs sm:leading-6 transition-colors ${
                          complaint.status === "OPEN" ? "bg-amber-500/10 text-amber-400 focus:ring-amber-500" :
                          complaint.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400 focus:ring-blue-500" :
                          "bg-emerald-500/10 text-emerald-400 focus:ring-emerald-500"
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={complaint.priority}
                        onChange={(e) => handlePriorityChange(complaint.id, e.target.value)}
                        className={`text-xs rounded-lg border border-white/10 py-1.5 pl-3 pr-8 font-semibold ring-0 focus:ring-2 focus:ring-inset sm:text-xs sm:leading-6 transition-colors ${
                          complaint.priority === "HIGH" ? "bg-[#0a0a0f] text-red-400 focus:ring-red-500" :
                          complaint.priority === "MEDIUM" ? "bg-[#0a0a0f] text-amber-400 focus:ring-amber-500" :
                          "bg-[#0a0a0f] text-emerald-400 focus:ring-emerald-500"
                        }`}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col gap-2 items-end">
                        <Link href={`/complaints/${complaint.id}`} className="text-slate-300 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1 rounded-md text-xs">
                          View
                        </Link>
                        <Link href={`/complaints/${complaint.id}/edit`} className="text-slate-300 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1 rounded-md text-xs">
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(complaint.id)}
                          className="text-red-400 hover:text-red-300 transition-colors bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-md text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                    No complaints found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
