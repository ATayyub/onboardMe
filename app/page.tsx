"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white h-14 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦙</span>
            <span className="font-medium text-sm text-black">OnboardMe</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="text-sm text-black hover:text-[#525252] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-black hover:text-[#525252] transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 w-full flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full text-center">
          {/* Llama Icon */}
          <div className="text-6xl mb-6 flex justify-center">🦙</div>

          {/* Main Heading */}
          <h1 className="text-5xl font-medium text-black mb-4 leading-tight">
            Ship onboarding flows in minutes
          </h1>

          {/* Description */}
          <p className="text-base text-[#737373] mb-12 max-w-lg mx-auto leading-relaxed">
            No code required. Create beautiful, interactive onboarding experiences that guide users through your product without writing a single line of code.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {session ? (
              <div className="text-center">
                <p className="text-sm text-[#737373] mb-4">
                  Welcome back, {session.user?.email}
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-black px-6 font-medium text-sm hover:bg-[#090909] active:scale-95 transition-all duration-150"
                  style={{ color: 'white' }}
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-black px-6 font-medium text-sm hover:bg-[#090909] active:scale-95 transition-all duration-150"
                  style={{ color: 'white' }}
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-[#e5e5e5] px-6 font-medium text-black text-sm hover:bg-[#fafafa] active:scale-95 transition-all duration-150"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-[#a3a3a3]">
            © 2026 OnboardMe · Built to make onboarding effortless
          </p>
        </div>
      </footer>
    </div>
  );
}
