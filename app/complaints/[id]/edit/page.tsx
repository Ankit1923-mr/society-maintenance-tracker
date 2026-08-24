"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Category } from "@prisma/client";

const CATEGORIES: Category[] = [
  "PLUMBING", "ELECTRICAL", "CLEANLINESS", "SECURITY",
  "PARKING", "LIFT", "OTHER"
];

export default function EditComplaintPage() {
  const router = useRouter();
  const params = useParams();
  
  const [category, setCategory] = useState<Category>("PLUMBING");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const res = await fetch(`/api/complaints/${params.id}`);
        const data = await res.json();
        if (data.complaint) {
          if (!data.isAdmin && (!data.isOwner || data.complaint.status !== "OPEN")) {
            router.push(`/complaints/${params.id}`);
            return;
          }
          setCategory(data.complaint.category);
          setDescription(data.complaint.description);
          if (data.complaint.photoUrl) setPreview(data.complaint.photoUrl);
          setIsAdmin(data.isAdmin);
        } else {
          setError("Complaint not found");
        }
      } catch (error) {
        console.error(error);
        setError("Failed to load complaint");
      } finally {
        setLoading(false);
      }
    }
    fetchComplaint();
  }, [params.id, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    try {
      let photoUrl = preview; // keep existing if no new file

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || "Upload failed");
        }
        
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.url;
      } else if (!preview) {
        photoUrl = null;
      }

      const payload: Record<string, string | null> = { description, photoUrl };
      if (isAdmin) {
        payload.category = category;
      }

      const res = await fetch(`/api/complaints/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update complaint");
      }

      router.push(`/complaints/${params.id}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Complaint</h1>
          <p className="mt-1 text-sm text-slate-500">Update the details of this complaint.</p>
        </div>
        <Link href={`/complaints/${params.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Cancel
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              disabled={!isAdmin}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {!isAdmin && <p className="text-xs text-slate-500 mt-1">Only admins can change the category.</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Photo Evidence</label>
            <div className="flex items-center justify-center w-full">
              {preview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="object-contain w-full h-full" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 rounded-full bg-white p-1 text-slate-600 shadow hover:text-slate-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload new photo</span> or drag and drop</p>
                    <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitLoading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
