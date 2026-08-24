"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Priority, Status, Category } from "@prisma/client";

interface ComplaintHistory {
  id: string;
  previousStatus: Status | null;
  newStatus: Status;
  note: string | null;
  timestamp: string;
  actor: {
    name: string;
    role: string;
  };
}

interface Complaint {
  id: string;
  category: Category;
  description: string;
  photoUrl: string | null;
  status: Status;
  priority: Priority;
  createdAt: string;
  history: ComplaintHistory[];
}

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  // Note form state
  const [adminNote, setAdminNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const res = await fetch(`/api/complaints/${params.id}`);
        const data = await res.json();
        if (data.complaint) {
          setComplaint(data.complaint);
          setIsAdmin(data.isAdmin);
          setIsOwner(data.isOwner);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaint();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/complaints/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(isAdmin ? "/admin/complaints" : "/complaints");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete complaint");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete complaint");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNote.trim()) return;
    setNoteLoading(true);
    
    try {
      const res = await fetch(`/api/complaints/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: adminNote }),
      });
      if (res.ok) {
        setAdminNote("");
        const data = await res.json();
        setComplaint(data.complaint); // Refresh data
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add note");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add note");
    } finally {
      setNoteLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "IN_PROGRESS": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "RESOLVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-white/5 text-slate-400 border-white/10";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Loading details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="text-lg font-semibold text-white">Complaint not found</h3>
        <Link href="/complaints" className="mt-4 text-slate-400 hover:text-white font-medium transition-colors">
          &larr; Back to complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link href={isAdmin ? "/admin/complaints" : "/complaints"} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          &larr; Back to complaints
        </Link>
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(complaint.status)}`}>
            {complaint.status.replace("_", " ")}
          </span>
          {((isOwner && complaint.status === "OPEN") || isAdmin) && (
            <div className="flex items-center gap-2 border-l pl-4 border-white/10">
              <Link 
                href={`/complaints/${complaint.id}/edit`}
                className="text-sm font-medium text-white hover:text-slate-300 bg-white/10 border border-white/20 px-4 py-1.5 rounded-lg transition-all hover:bg-white/20"
              >
                Edit
              </Link>
              <button 
                onClick={handleDelete}
                className="text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-lg transition-all hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
        {complaint.photoUrl && (
          <div className="aspect-[2/1] w-full overflow-hidden bg-white/5 border-b border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={complaint.photoUrl} alt="Complaint evidence" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">{complaint.category} Issue</h1>
            <span className="text-sm font-medium text-slate-400 border-l border-white/10 pl-4">
              Priority: <span className="text-white">{complaint.priority}</span>
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none text-slate-300">
            <p className="whitespace-pre-wrap">{complaint.description}</p>
          </div>
          
          <div className="mt-10 pt-10 border-t border-white/10">
            <h2 className="text-xl font-semibold text-white mb-8">Activity History</h2>
            
            <div className="flow-root">
              <ul className="-mb-8">
                {complaint.history.map((event, eventIdx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== complaint.history.length - 1 ? (
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-white/10" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex space-x-4">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-[#0a0a0f] ring-8 ring-white/5 flex items-center justify-center border border-white/20">
                            {event.newStatus === 'RESOLVED' ? (
                              <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            ) : event.newStatus === 'IN_PROGRESS' ? (
                              <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path></svg>
                            ) : (
                              <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                            )}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-slate-400">
                              Status changed to <span className="font-medium text-white">{event.newStatus.replace("_", " ")}</span> by{" "}
                              <span className="font-medium text-white">{event.actor.name}</span>
                            </p>
                            {event.note && (
                              <p className="mt-3 text-sm text-slate-300 bg-white/5 p-4 rounded-lg border border-white/10 shadow-inner">
                                &ldquo;{event.note}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-xs text-slate-500">
                            <time dateTime={event.timestamp}>
                              {new Date(event.timestamp).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                              })}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {isAdmin && (
              <div className="mt-10 pt-8 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-4">Add Note (Admin Only)</h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Write a message to the resident (does not change status)..."
                    rows={3}
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    disabled={noteLoading}
                    className="inline-flex justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-50 transition-all duration-200"
                  >
                    {noteLoading ? "Posting..." : "Post Note"}
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
