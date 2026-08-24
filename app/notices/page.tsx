"use client";

import { useEffect, useState } from "react";

interface Notice {
  id: string;
  title: string;
  body: string;
  isImportant: boolean;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      try {
        const res = await fetch("/api/notices");
        const data = await res.json();
        if (data.notices) {
          setNotices(data.notices);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Loading notices...</div>
      </div>
    );
  }

  const importantNotices = notices.filter(n => n.isImportant);
  const regularNotices = notices.filter(n => !n.isImportant);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Notice Board</h1>
        <p className="mt-1 text-sm text-slate-400">Important announcements from your society admin</p>
      </div>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-16 text-center shadow-sm backdrop-blur-md">
          <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
          <h3 className="text-sm font-semibold text-white">No notices</h3>
          <p className="mt-1 text-sm text-slate-400">There are no announcements at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {importantNotices.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Pinned Notices</h2>
              {importantNotices.map((notice) => (
                <div key={notice.id} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{notice.title}</h3>
                    <span className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full flex items-center border border-amber-500/20">
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                      Important
                    </span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap text-sm mb-6 leading-relaxed">{notice.body}</p>
                  <div className="flex items-center text-xs text-slate-400">
                    <span className="font-medium text-slate-300 mr-2">{notice.createdBy.name}</span> &bull; 
                    <time className="ml-2">
                      {new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}

          {regularNotices.length > 0 && (
            <div className="space-y-6">
              {importantNotices.length > 0 && (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 pt-6">Other Notices</h2>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                {regularNotices.map((notice) => (
                  <div key={notice.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md flex flex-col transition-all hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">{notice.title}</h3>
                    <p className="text-slate-400 text-sm mb-6 line-clamp-4 leading-relaxed">{notice.body}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-4 border-t border-white/10">
                      <span className="font-medium text-slate-400">{notice.createdBy.name}</span>
                      <time>
                        {new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
