"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white h-14 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="text-xl">🦙</span>
            <span className="font-medium text-sm text-black">OnboardMe</span>
          </Link>
          <button
            onClick={() => signOut({ redirect: true })}
            className="text-sm text-[#737373] hover:text-black transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
