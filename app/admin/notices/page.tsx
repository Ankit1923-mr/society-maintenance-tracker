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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Notices</h1>
        <p className="mt-1 text-sm text-slate-500">Post announcements to the society notice board</p>
      </div>

      {/* Create / Edit Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editId ? "Edit Notice" : "Post New Notice"}
          </h2>
          {editId && (
            <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g. Scheduled Power Outage"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-slate-700">Message</label>
            <textarea
              id="body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="Provide details..."
            />
          </div>
          <div className="flex items-center">
            <input
              id="isImportant"
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="isImportant" className="ml-2 block text-sm font-medium text-slate-900">
              Pin to top (Mark as Important)
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="pt-2">
            <button
              type="submit"
              disabled={formLoading}
              className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {formLoading ? (editId ? "Updating..." : "Posting...") : (editId ? "Update Notice" : "Post Notice")}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={formLoading}
                className="ml-3 inline-flex justify-center rounded-md bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notices List */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Past Notices</h2>
        {loading ? (
          <div className="text-sm text-slate-500">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="text-sm text-slate-500 border border-slate-200 rounded-md p-4 bg-slate-50">No notices posted yet.</div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className={`rounded-xl border p-5 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-start justify-between ${notice.isImportant ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{notice.title}</h3>
                    {notice.isImportant && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pinned</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{notice.body}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Posted by {notice.createdBy.name} on {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(notice)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors text-right"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors text-right"
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
