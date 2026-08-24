import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/complaints");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
          Streamline your society management.
        </h1>
        <p className="text-lg leading-8 text-slate-600 mb-10 max-w-xl mx-auto">
          A clean, modern platform to track complaints, view important notices, and manage your community efficiently.
        </p>
        
        <div className="flex items-center justify-center gap-x-6">
          <Link
            href="/register"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold leading-6 text-slate-900 hover:text-slate-600 transition-colors"
          >
            Sign in to your account <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
