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
    <html lang="en" className="bg-[#0a0a0f] text-slate-200 antialiased">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0f]/50 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
                SocietyApp
              </Link>
              {user && (
                <nav className="hidden md:flex gap-6">
                  {user.role === "ADMIN" ? (
                    <>
                      <Link href="/admin/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Dashboard</Link>
                      <Link href="/admin/complaints" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Complaints</Link>
                      <Link href="/admin/notices" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Notices</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/complaints" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">My Complaints</Link>
                      <Link href="/notices" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Notice Board</Link>
                    </>
                  )}
                </nav>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-slate-400 hidden sm:inline-block">
                    {user.name} <span className="px-2 py-0.5 ml-1 rounded text-xs bg-white/10 text-slate-300">{user.role}</span>
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign in</Link>
                  <Link href="/register" className="text-sm font-medium rounded-md bg-white text-black px-4 py-2 hover:bg-slate-200 transition-colors">Get Started</Link>
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
