"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface Flow {
  id: string;
  name: string;
  status: string;
}

interface AnalyticsData {
  summary: {
    totalEvents: number;
    flowStarted: number;
    stepViewed: number;
    flowCompleted: number;
    uniqueUsers: number;
  };
  events: Array<{
    id: string;
    eventType: string;
    stepIndex: number | null;
    userId: string | null;
    url: string | null;
    createdAt: string;
  }>;
}

export default function FlowEditorPage() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const { data: session } = useSession();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [view, setView] = useState<"editor" | "analytics" | "install">("editor");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedSnippet =
    typeof window !== "undefined"
      ? `<script src="${window.location.origin}/sdk.js"></script>\n<script>\n  OnboardMe.init('${flowId}', {\n    baseUrl: '${window.location.origin}'\n  });\n</script>`
      : "";

  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = embedSnippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (session) {
      fetchFlow();
    }
  }, [session, flowId]);

  useEffect(() => {
    if (view === "analytics") {
      fetchAnalytics();
    }
  }, [view, flowId]);

  const fetchFlow = async () => {
    try {
      const res = await fetch(`/api/flows/${flowId}`);
      if (res.ok) {
        const data = await res.json();
        setFlow(data);
        if (Array.isArray(data.config)) {
          setSteps(data.config);
        }
      }
    } catch (error) {
      console.error("Failed to fetch flow:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?flowId=${flowId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const addStep = () => {
    const newStep: Step = {
      id: Date.now().toString(),
      title: "New Step",
      description: "",
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, ...updates } : step)));
  };

  const reorderSteps = (fromIndex: number, toIndex: number) => {
    const newSteps = [...steps];
    const [removed] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, removed);
    setSteps(newSteps);
  };

  const handlePublish = async () => {
    setPublishError("");

    if (steps.length === 0) {
      setPublishError("Your flow must have at least one step to publish");
      return;
    }

    // Validate all steps have titles
    if (steps.some((s) => !s.title.trim())) {
      setPublishError("All steps must have a title");
      return;
    }

    setPublishing(true);

    try {
      const res = await fetch(`/api/flows/${flowId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: steps }),
      });

      if (res.ok) {
        // Success - redirect to dashboard
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setPublishError(data.error || "Failed to publish. Please try again.");
      }
    } catch (error) {
      console.error("Failed to publish:", error);
      setPublishError("Network error. Please check your connection and try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!flow) return <div className="p-8 text-center text-gray-500">Flow not found</div>;

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{flow.name}</h1>
          <p className="text-gray-600 text-sm">
            {view === "editor" ? "Build and publish your flow" : "View analytics and events"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("editor")}
            className={`px-4 py-2 rounded font-medium text-sm ${
              view === "editor"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setView("analytics")}
            className={`px-4 py-2 rounded font-medium text-sm ${
              view === "analytics"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setView("install")}
            className={`px-4 py-2 rounded font-medium text-sm ${
              view === "install"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            Install
          </button>
        </div>
      </div>

      {view === "editor" ? (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold mb-4">Steps ({steps.length})</h2>
              <div className="space-y-3 mb-4">
                {steps.length === 0 ? (
                  <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                    No steps yet. Add your first step below to get started.
                  </p>
                ) : (
                  steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setEditingStepId(step.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-400 text-sm">
                              Step {index + 1}
                            </span>
                            <h3 className="font-medium">{step.title}</h3>
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {index > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                reorderSteps(index, index - 1);
                              }}
                              className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                              title="Move up"
                            >
                              ↑
                            </button>
                          )}
                          {index < steps.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                reorderSteps(index, index + 1);
                              }}
                              className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                              title="Move down"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(step.id);
                            }}
                            className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={addStep}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
              >
                + Add Step
              </button>
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-8">
              {editingStepId ? (
                <>
                  <h2 className="text-lg font-bold mb-4">Edit Step</h2>
                  {steps.find((s) => s.id === editingStepId) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={steps.find((s) => s.id === editingStepId)?.title || ""}
                          onChange={(e) => updateStep(editingStepId, { title: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          placeholder="Step title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Description
                        </label>
                        <textarea
                          value={steps.find((s) => s.id === editingStepId)?.description || ""}
                          onChange={(e) =>
                            updateStep(editingStepId, { description: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none h-20 resize-none"
                          placeholder="Optional description"
                        />
                      </div>
                      <button
                        onClick={() => setEditingStepId(null)}
                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm"
                      >
                        Done Editing
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold mb-4">Publish</h2>
                  {publishError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                      {publishError}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    {steps.length === 0
                      ? "Add at least one step to publish."
                      : steps.some((s) => !s.title.trim())
                      ? "All steps need titles."
                      : `Ready to publish ${steps.length} step${steps.length !== 1 ? "s" : ""}. This will make your flow live.`}
                  </p>
                  <button
                    onClick={handlePublish}
                    disabled={
                      steps.length === 0 ||
                      steps.some((s) => !s.title.trim()) ||
                      publishing
                    }
                    className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    {publishing ? "Publishing..." : "Publish Flow"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : view === "analytics" ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          {analyticsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading analytics...</div>
          ) : analytics ? (
            <>
              <div className="border-b bg-gray-50 px-6 py-4">
                <h2 className="font-bold">Analytics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-5 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-medium">Events</p>
                    <p className="text-3xl font-bold mt-2">{analytics.summary.totalEvents}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-medium">Started</p>
                    <p className="text-3xl font-bold mt-2">{analytics.summary.flowStarted}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-medium">Steps</p>
                    <p className="text-3xl font-bold mt-2">{analytics.summary.stepViewed}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-medium">Completed</p>
                    <p className="text-3xl font-bold mt-2">{analytics.summary.flowCompleted}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-medium">Users</p>
                    <p className="text-3xl font-bold mt-2">{analytics.summary.uniqueUsers}</p>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-4">Recent Events</h3>
                {analytics.events.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No events yet. Share your flow to start collecting data.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-2 text-left font-medium">Event</th>
                          <th className="px-4 py-2 text-left font-medium">Step</th>
                          <th className="px-4 py-2 text-left font-medium">User</th>
                          <th className="px-4 py-2 text-left font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.events.map((event) => (
                          <tr key={event.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {event.eventType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {event.stepIndex !== null ? `Step ${event.stepIndex}` : "—"}
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-xs font-mono">
                              {event.userId ? event.userId.slice(0, 8) + "..." : "Anonymous"}
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              {new Date(event.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">No analytics data yet</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden max-w-3xl">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h2 className="font-bold">Install on your site</h2>
          </div>
          <div className="p-6">
            {flow.status !== "live" ? (
              <div className="text-center py-8">
                <p className="text-gray-700 font-medium mb-1">
                  Publish this flow to get its embed code
                </p>
                <p className="text-sm text-gray-500">
                  Go to the <button onClick={() => setView("editor")} className="underline font-medium">Editor</button> tab and click Publish. The embed code appears here once the flow is live.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Paste this snippet just before the closing{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code>{" "}
                  tag on any page where you want this flow to appear.
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
{embedSnippet}
                  </pre>
                  <button
                    onClick={copyEmbed}
                    className="absolute top-3 right-3 px-3 py-1 bg-white text-gray-900 rounded text-xs font-medium hover:bg-gray-100"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Flow ID:</span>{" "}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{flowId}</code>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
