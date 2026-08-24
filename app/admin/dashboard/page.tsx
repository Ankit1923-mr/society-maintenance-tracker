"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    overdue: number;
  };
  users: number;
  notices: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your society&apos;s activity</p>
      </div>

      {/* Priority Action Area */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/complaints?overdue=true" className="group rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm transition-all hover:border-red-300 hover:bg-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-600">Overdue Complaints</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-red-900">{stats.complaints.overdue}</h2>
            </div>
            <div className="rounded-full bg-red-100 p-3 text-red-600 group-hover:bg-red-200 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-red-700">Requires immediate attention &rarr;</p>
        </Link>
        
        <Link href="/admin/complaints?status=OPEN" className="group rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">Open Complaints</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-amber-900">{stats.complaints.open}</h2>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-600 group-hover:bg-amber-200 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-amber-700">View new requests &rarr;</p>
        </Link>
      </div>

      {/* Secondary Stats */}
      <h2 className="text-lg font-semibold text-slate-900 mt-8 mb-4">General Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Complaints</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stats.complaints.total}</p>
        </div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stats.complaints.inProgress}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Resolved</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stats.complaints.resolved}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stats.users}</p>
        </div>
      </div>
    </div>
  );
}
