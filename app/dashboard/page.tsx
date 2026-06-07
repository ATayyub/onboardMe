"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface Flow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFlowName, setNewFlowName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetchFlows();
    }
  }, [session]);

  const fetchFlows = async () => {
    try {
      const res = await fetch("/api/flows");
      if (res.ok) {
        const data = await res.json();
        setFlows(data);
      }
    } catch (error) {
      console.error("Failed to fetch flows:", error);
      setError("Failed to load flows. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = async (e: unknown) => {
    const event = e as Event & { preventDefault: () => void };
    event.preventDefault();
    setError("");

    if (!newFlowName.trim()) {
      setError("Flow name is required");
      return;
    }

    if (newFlowName.trim().length > 100) {
      setError("Flow name must be 100 characters or less");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFlowName.trim() }),
      });

      if (res.ok) {
        setNewFlowName("");
        fetchFlows();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create flow");
      }
    } catch (error) {
      console.error("Failed to create flow:", error);
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white h-14 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦙</span>
            <span className="font-medium text-sm text-black">OnboardMe</span>
          </div>
          <button
            onClick={() => signOut({ redirect: true })}
            className="text-sm text-[#737373] hover:text-black transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16">
        {/* Page Header */}
        <div className="mb-16">
          <h2 className="text-3xl font-medium text-black mb-2">Your flows</h2>
          <p className="text-[#737373]">
            Create and manage beautiful onboarding experiences
          </p>
        </div>

        {/* Create Flow Section */}
        <div className="mb-16">
          <h3 className="text-xl font-medium text-black mb-6">Create a new flow</h3>

          {error && (
            <div className="border border-[#ff5f56] bg-white text-[#737373] px-4 py-3 rounded-lg mb-6 text-sm">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleCreateFlow} className="flex gap-3 max-w-2xl">
            <input
              type="text"
              value={newFlowName}
              onChange={(e) => {
                setNewFlowName(e.target.value);
                setError("");
              }}
              placeholder="e.g., Product Onboarding, Free Trial Signup"
              className="flex-1 px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm text-black placeholder-[#a3a3a3] focus:outline-none focus:border-black focus:ring-1 focus:ring-[rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={creating}
              maxLength={100}
              autoFocus
            />
            <button
              type="submit"
              disabled={creating || !newFlowName.trim()}
              className="px-6 py-2 bg-black text-white font-medium text-sm rounded-full hover:bg-[#090909] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 whitespace-nowrap"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
          <p className="text-xs text-[#a3a3a3] mt-3">
            Give your flow a descriptive name. You can edit it later.
          </p>
        </div>

        {/* Flows List Section */}
        <div>
          <h3 className="text-xl font-medium text-black mb-6">Your flows</h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-white border border-[#e5e5e5] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-24 bg-white border border-[#e5e5e5] rounded-lg">
              <div className="text-4xl mb-4">🦙</div>
              <h4 className="text-lg font-medium text-black mb-2">No flows yet</h4>
              <p className="text-[#737373] max-w-sm mx-auto">
                Create your first onboarding flow above to get started. It takes just a few minutes.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#e5e5e5]">
              {flows.map((flow) => (
                <Link
                  key={flow.id}
                  href={`/flows/${flow.id}`}
                  className="group block p-4 hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-black group-hover:text-[#525252] transition-colors truncate">
                        {flow.name}
                      </h4>
                      <p className="text-sm text-[#a3a3a3] mt-1">
                        Created{" "}
                        {new Date(flow.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year:
                            new Date(flow.createdAt).getFullYear() !== new Date().getFullYear()
                              ? "numeric"
                              : undefined,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          flow.status === "live"
                            ? "bg-[#fafafa] text-black border border-[#e5e5e5]"
                            : "bg-[#fafafa] text-[#a3a3a3] border border-[#e5e5e5]"
                        }`}
                      >
                        {flow.status === "live" ? "Live" : "Draft"}
                      </span>
                      <svg
                        className="w-5 h-5 text-[#a3a3a3] group-hover:text-black transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
