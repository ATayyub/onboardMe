"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

// globals.css has an unlayered `a { color:#000; text-decoration:underline }` that
// overrides Tailwind utilities, so anchor color/underline must be set inline here.
const linkReset = { textDecoration: "none" } as const;
const darkBtn = { color: "#ffffff", textDecoration: "none" } as const;
const lightBtn = { color: "#000000", textDecoration: "none" } as const;

export default function Home() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";

  return (
    <div className="flex flex-col min-h-screen bg-[linear-gradient(180deg,#f4f3fd_0%,#eaeefb_55%,#e7ecfb_100%)]">
      {/* Top accent bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 w-full flex items-center justify-between">
          {/* Left: logo */}
          <Link href="/" style={linkReset} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 text-lg">
              🦙
            </span>
            <span className="font-semibold text-base text-black">OnboardMe</span>
          </Link>

          {/* Right: single action button */}
          <Link
            href={session ? "/dashboard" : "/login"}
            style={darkBtn}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-black px-4 font-semibold text-sm hover:bg-[#111] active:scale-95 transition-all duration-150"
          >
            {session ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 w-full flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl w-full text-center">
          {/* App icon */}
          <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white shadow-xl ring-1 ring-black/5">
            <span className="text-5xl">🦙</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-black leading-[1.05]">
            Ship onboarding flows <span className="text-blue-600">in minutes</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg text-[#52525b] max-w-xl mx-auto leading-relaxed">
            No code required. Create beautiful, interactive onboarding experiences that guide users through your product without writing a single line of code.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            {session ? (
              <Link
                href="/dashboard"
                style={darkBtn}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-7 font-semibold text-base hover:bg-[#111] active:scale-95 transition-all duration-150 shadow-sm"
              >
                Go to Dashboard <span aria-hidden>→</span>
              </Link>
            ) : (
              <Link
                href="/signup"
                style={darkBtn}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-7 font-semibold text-base hover:bg-[#111] active:scale-95 transition-all duration-150 shadow-sm"
              >
                Get started <span aria-hidden>→</span>
              </Link>
            )}
            <Link
              href="/test.html"
              style={lightBtn}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white border border-black/10 px-7 font-semibold text-base hover:bg-black/[0.03] active:scale-95 transition-all duration-150 shadow-sm"
            >
              View Demo
            </Link>
          </div>

          {session && (
            <p className="mt-5 text-sm text-[#71717a]">
              Welcome back, <span className="font-semibold text-[#3f3f46]">{email}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
