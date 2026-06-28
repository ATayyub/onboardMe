"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
        } else {
          setError("Login failed. Please try again.");
        }
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#e5e5e5] p-8 max-w-md w-full shadow-sm">
      <h1 className="text-2xl font-medium text-black mb-2">Sign in</h1>
      <p className="text-[#737373] text-sm mb-6">Access your flows and analytics</p>

      {error && (
        <div className="border border-[#ff5f56] bg-white px-4 py-3 rounded-lg mb-4 text-sm">
          <div className="font-medium text-black mb-1">Error</div>
          <div className="text-[#737373]">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm text-black placeholder-[#a3a3a3] focus:outline-none focus:border-black focus:ring-1 focus:ring-[rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="you@example.com"
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm text-black placeholder-[#a3a3a3] focus:outline-none focus:border-black focus:ring-1 focus:ring-[rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-black text-white font-medium text-sm rounded-full hover:bg-[#090909] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-[#737373] mt-6 text-center">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-medium text-black hover:text-[#525252] transition-colors">
          Create one
        </a>
      </p>
    </div>
  );
}
