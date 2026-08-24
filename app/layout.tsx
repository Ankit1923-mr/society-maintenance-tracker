import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Society Complaint Tracker",
  description: "Manage and track society complaints efficiently",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="bg-slate-50">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
                SocietyApp
              </Link>
              {user && (
                <nav className="hidden md:flex gap-6">
                  {user.role === "ADMIN" ? (
                    <>
                      <Link href="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link>
                      <Link href="/admin/complaints" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Complaints</Link>
                      <Link href="/admin/notices" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Notices</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/complaints" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">My Complaints</Link>
                      <Link href="/notices" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Notice Board</Link>
                    </>
                  )}
                </nav>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-slate-500 hidden sm:inline-block">
                    {user.name} ({user.role})
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
                  <Link href="/register" className="text-sm font-medium rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-colors">Register</Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
