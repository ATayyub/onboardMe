import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="text-xl">🦙</span>
            <span className="font-medium text-sm text-black">OnboardMe</span>
          </Link>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        {children}
      </div>
    </div>
  );
}
