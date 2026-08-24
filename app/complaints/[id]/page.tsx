"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const res = await fetch(`/api/complaints/${params.id}`);
        const data = await res.json();
        if (data.complaint) {
          setComplaint(data.complaint);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaint();
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-amber-100 text-amber-800 border-amber-200";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
      case "RESOLVED": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
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
        <h3 className="text-lg font-semibold text-slate-900">Complaint not found</h3>
        <Link href="/complaints" className="mt-4 text-indigo-600 hover:text-indigo-500 font-medium">
          &larr; Back to complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/complaints" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          &larr; Back to complaints
        </Link>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(complaint.status)}`}>
          {complaint.status.replace("_", " ")}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {complaint.photoUrl && (
          <div className="aspect-[2/1] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={complaint.photoUrl} alt="Complaint evidence" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{complaint.category} Issue</h1>
            <span className="text-sm font-medium text-slate-500 border-l border-slate-300 pl-4">
              Priority: <span className="text-slate-900">{complaint.priority}</span>
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none text-slate-600">
            <p className="whitespace-pre-wrap">{complaint.description}</p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Activity History</h2>
            
            <div className="flow-root">
              <ul className="-mb-8">
                {complaint.history.map((event, eventIdx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== complaint.history.length - 1 ? (
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-slate-100 ring-8 ring-white flex items-center justify-center border border-slate-200">
                            {event.newStatus === 'RESOLVED' ? (
                              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            ) : event.newStatus === 'IN_PROGRESS' ? (
                              <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path></svg>
                            ) : (
                              <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                            )}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-slate-600">
                              Status changed to <span className="font-medium text-slate-900">{event.newStatus.replace("_", " ")}</span> by{" "}
                              <span className="font-medium text-slate-900">{event.actor.name}</span>
                            </p>
                            {event.note && (
                              <p className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">
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
            
          </div>
        </div>
      </div>
    </div>
  );
}
