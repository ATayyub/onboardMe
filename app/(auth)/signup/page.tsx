"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: unknown) => {
    const event = e as Event & { preventDefault: () => void };
    event.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Account created but login failed. Please log in manually.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-black hover:text-[#525252] mb-8 transition-colors"
      >
        <span>←</span>
        <span>Back to home</span>
      </Link>

      <div className="bg-white border border-[#e5e5e5] rounded-lg p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-black">Create your account</h1>
          <p className="text-[#737373] text-sm">
            Start building beautiful onboarding flows in minutes.
          </p>
        </div>

        {error && (
          <div className="border border-[#ff5f56] bg-white px-4 py-3 rounded-lg text-sm">
            <div className="font-medium text-black mb-1">Error</div>
            <div className="text-[#737373]">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">Email address</label>
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm text-black placeholder-[#a3a3a3] focus:outline-none focus:border-black focus:ring-1 focus:ring-[rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="At least 8 characters"
              disabled={loading}
              autoComplete="new-password"
            />
            <p className="text-xs text-[#a3a3a3]">Minimum 8 characters</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm text-black placeholder-[#a3a3a3] focus:outline-none focus:border-black focus:ring-1 focus:ring-[rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Confirm your password"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-black text-white font-medium text-sm rounded-full hover:bg-[#090909] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-[#737373] text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black hover:text-[#525252] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
