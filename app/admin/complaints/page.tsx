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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Complaints</h1>
        <p className="mt-1 text-sm text-slate-500">View and update resident issues</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Category</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Resident</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((complaint) => {
                const isOverdue = overdueIds.has(complaint.id);
                const overdueDetails = overdue.find(o => o.id === complaint.id);

                return (
                  <tr key={complaint.id} className={isOverdue ? "bg-red-50/50" : ""}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{complaint.category}</span>
                        <span className="text-sm text-slate-500 truncate max-w-[200px]">{complaint.description}</span>
                        {isOverdue && (
                          <span className="mt-1 text-xs font-semibold text-red-600 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Overdue by {overdueDetails?.hoursOverdue}h
                          </span>
                        )}
                        <span className="text-xs text-slate-400 mt-1">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{complaint.resident.name}</div>
                      <div className="text-sm text-slate-500">{complaint.resident.flatNumber || "No flat"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        className={`text-sm rounded-full border-0 py-1 pl-3 pr-8 font-semibold ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                          complaint.status === "OPEN" ? "bg-amber-50 text-amber-700 ring-amber-200 focus:ring-amber-500" :
                          complaint.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 ring-blue-200 focus:ring-blue-500" :
                          "bg-green-50 text-green-700 ring-green-200 focus:ring-green-500"
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
                        className={`text-sm rounded-md border-0 py-1.5 pl-3 pr-8 font-medium ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                          complaint.priority === "HIGH" ? "text-red-700 ring-red-200 focus:ring-red-500" :
                          complaint.priority === "MEDIUM" ? "text-amber-700 ring-amber-200 focus:ring-amber-500" :
                          "text-green-700 ring-green-200 focus:ring-green-500"
                        }`}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/complaints/${complaint.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View <span className="sr-only">, {complaint.id}</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
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
