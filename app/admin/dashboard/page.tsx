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
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Overview of your society&apos;s activity</p>
      </div>

      {/* Priority Action Area */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/admin/complaints?overdue=true" className="group rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.05)] transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/10 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(239,68,68,0.15)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-400">Overdue Complaints</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight text-white group-hover:text-red-100 transition-colors">{stats.complaints.overdue}</h2>
            </div>
            <div className="rounded-full bg-red-500/10 p-4 text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300 transition-colors border border-red-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <p className="mt-6 text-sm font-medium text-red-400/80 group-hover:text-red-400 transition-colors">Requires immediate attention &rarr;</p>
        </Link>
        
        <Link href="/admin/complaints?status=OPEN" className="group rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(245,158,11,0.15)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">Open Complaints</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight text-white group-hover:text-amber-100 transition-colors">{stats.complaints.open}</h2>
            </div>
            <div className="rounded-full bg-amber-500/10 p-4 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors border border-amber-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
          </div>
          <p className="mt-6 text-sm font-medium text-amber-400/80 group-hover:text-amber-400 transition-colors">View new requests &rarr;</p>
        </Link>
      </div>

      {/* Secondary Stats */}
      <h2 className="text-xl font-semibold text-white mt-10 mb-6">General Overview</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:border-white/20">
          <p className="text-sm font-medium text-slate-400">Total Complaints</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{stats.complaints.total}</p>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:border-white/20">
          <p className="text-sm font-medium text-slate-400">In Progress</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{stats.complaints.inProgress}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:border-white/20">
          <p className="text-sm font-medium text-slate-400">Resolved</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{stats.complaints.resolved}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:border-white/20">
          <p className="text-sm font-medium text-slate-400">Total Users</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{stats.users}</p>
        </div>
      </div>
    </div>
  );
}
