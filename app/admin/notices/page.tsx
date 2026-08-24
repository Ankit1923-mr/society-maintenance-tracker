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

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const fetchNotices = async () => {
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
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const url = editId ? `/api/notices/${editId}` : "/api/notices";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, isImportant }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${editId ? 'update' : 'create'} notice`);
      }

      resetForm();
      fetchNotices();
      fetchNotices();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setIsImportant(false);
    setEditId(null);
    setError("");
  };

  const handleEdit = (notice: Notice) => {
    setTitle(notice.title);
    setBody(notice.body);
    setIsImportant(notice.isImportant);
    setEditId(notice.id);
    setError("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchNotices();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Manage Notices</h1>
        <p className="mt-1 text-sm text-slate-400">Post announcements to the society notice board</p>
      </div>

      {/* Create / Edit Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {editId ? "Edit Notice" : "Post New Notice"}
          </h2>
          {editId && (
            <button onClick={resetForm} className="text-sm text-slate-400 hover:text-white transition-colors">
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
              placeholder="e.g. Scheduled Power Outage"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-slate-300">Message</label>
            <textarea
              id="body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
              placeholder="Provide details..."
            />
          </div>
          <div className="flex items-center">
            <input
              id="isImportant"
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-[#0a0a0f] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#0a0a0f]"
            />
            <label htmlFor="isImportant" className="ml-2 block text-sm font-medium text-slate-300">
              Pin to top (Mark as Important)
            </label>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-50 transition-all duration-200"
            >
              {formLoading ? (editId ? "Updating..." : "Posting...") : (editId ? "Update Notice" : "Post Notice")}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={formLoading}
                className="inline-flex justify-center rounded-lg bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notices List */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">Past Notices</h2>
        {loading ? (
          <div className="text-sm text-slate-400">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="text-sm text-slate-400 border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur-md">No notices posted yet.</div>
        ) : (
          <div className="space-y-6">
            {notices.map((notice) => (
              <div key={notice.id} className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-md flex flex-col sm:flex-row gap-6 sm:items-start justify-between transition-all ${notice.isImportant ? 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-white/10 bg-white/5 shadow-lg'}`}>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{notice.title}</h3>
                    {notice.isImportant && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/20">Pinned</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{notice.body}</p>
                  <p className="text-xs text-slate-500 mt-4">
                    Posted by {notice.createdBy.name} on {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-3 shrink-0 pt-1">
                  <button
                    onClick={() => handleEdit(notice)}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors text-right bg-white/5 border border-white/10 px-4 py-1.5 rounded-lg hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors text-right bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-lg hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
