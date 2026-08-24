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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notice Board</h1>
        <p className="mt-1 text-sm text-slate-500">Important announcements from your society admin</p>
      </div>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center shadow-sm">
          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
          <h3 className="text-sm font-semibold text-slate-900">No notices</h3>
          <p className="mt-1 text-sm text-slate-500">There are no announcements at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {importantNotices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600">Pinned Notices</h2>
              {importantNotices.map((notice) => (
                <div key={notice.id} className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{notice.title}</h3>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                      Important
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap text-sm mb-4">{notice.body}</p>
                  <div className="flex items-center text-xs text-slate-500">
                    <span className="font-medium mr-2">{notice.createdBy.name}</span> &bull; 
                    <time className="ml-2">
                      {new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}

          {regularNotices.length > 0 && (
            <div className="space-y-4">
              {importantNotices.length > 0 && (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 pt-4">Other Notices</h2>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {regularNotices.map((notice) => (
                  <div key={notice.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{notice.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">{notice.body}</p>
                    <div className="flex justify-between items-center text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100">
                      <span>{notice.createdBy.name}</span>
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
