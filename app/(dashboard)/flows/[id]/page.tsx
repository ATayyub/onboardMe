"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { EditorTab } from "./components/EditorTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { InstallTab } from "./components/InstallTab";

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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  funnel: {
    started: number;
    steps: Array<{ stepIndex: number; label: string; count: number; rate: number }>;
    completed: number;
    completionRate: number;
  } | null;
}

type View = "editor" | "analytics" | "install";

const draftKey = (id: string) => `onboardme-draft-${id}`;

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
  const [view, setView] = useState<View>("editor");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (session) fetchFlow();
  }, [session, flowId]);

  useEffect(() => {
    if (view === "analytics") fetchAnalytics(analyticsPage);
  }, [view, flowId]);

  useEffect(() => {
    if (!loading && steps.length >= 0) {
      localStorage.setItem(draftKey(flowId), JSON.stringify({ steps, savedAt: Date.now() }));
    }
  }, [steps, flowId, loading]);

  const fetchFlow = async () => {
    try {
      const res = await fetch(`/api/flows/${flowId}`);
      if (res.ok) {
        const data = await res.json();
        setFlow(data);

        const raw = localStorage.getItem(draftKey(flowId));
        if (raw) {
          try {
            const { steps: draftSteps } = JSON.parse(raw);
            if (Array.isArray(draftSteps)) {
              setSteps(draftSteps);
              setHasDraft(true);
              return;
            }
          } catch {
            localStorage.removeItem(draftKey(flowId));
          }
        }

        if (Array.isArray(data.config)) setSteps(data.config);
      }
    } catch (error) {
      console.error("Failed to fetch flow:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = useCallback(async (page: number) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?flowId=${flowId}&page=${page}&limit=50`);
      if (res.ok) {
        setAnalytics(await res.json());
        setAnalyticsPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [flowId]);

  const discardDraft = () => {
    localStorage.removeItem(draftKey(flowId));
    setHasDraft(false);
    if (flow && Array.isArray((flow as Flow & { config?: Step[] }).config)) {
      setSteps((flow as Flow & { config?: Step[] }).config || []);
    } else {
      setSteps([]);
    }
  };

  const addStep = () =>
    setSteps((prev) => [...prev, { id: Date.now().toString(), title: "New Step", description: "" }]);

  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

  const updateStep = (id: string, updates: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

  const reorderSteps = (from: number, to: number) => {
    setSteps((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  };

  const handlePublish = async () => {
    setPublishError("");
    if (steps.length === 0) { setPublishError("Your flow must have at least one step to publish"); return; }
    if (steps.some((s) => !s.title.trim())) { setPublishError("All steps must have a title"); return; }
    setPublishing(true);
    try {
      const res = await fetch(`/api/flows/${flowId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: steps }),
      });
      if (res.ok) {
        localStorage.removeItem(draftKey(flowId));
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setPublishError(data.error || "Failed to publish. Please try again.");
      }
    } catch {
      setPublishError("Network error. Please check your connection and try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!flow) return <div className="p-8 text-center text-gray-500">Flow not found</div>;

  const tabs: { key: View; label: string }[] = [
    { key: "editor", label: "Editor" },
    { key: "analytics", label: "Analytics" },
    { key: "install", label: "Install" },
  ];

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
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-4 py-2 rounded font-medium text-sm ${
                view === key ? "bg-black text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasDraft && view === "editor" && (
        <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-amber-800">You have an unsaved draft. Changes are auto-saved locally.</span>
          <button
            onClick={discardDraft}
            className="ml-4 text-amber-700 underline hover:text-amber-900 whitespace-nowrap"
          >
            Discard draft
          </button>
        </div>
      )}

      {view === "editor" && (
        <EditorTab
          steps={steps}
          editingStepId={editingStepId}
          publishing={publishing}
          publishError={publishError}
          onAddStep={addStep}
          onRemoveStep={removeStep}
          onUpdateStep={updateStep}
          onReorderSteps={reorderSteps}
          onSelectStep={setEditingStepId}
          onPublish={handlePublish}
        />
      )}

      {view === "analytics" && (
        <AnalyticsTab
          analytics={analytics}
          loading={analyticsLoading}
          onPageChange={(page) => fetchAnalytics(page)}
        />
      )}

      {view === "install" && (
        <InstallTab
          flowId={flowId}
          flowStatus={flow.status}
          onSwitchToEditor={() => setView("editor")}
        />
      )}
    </div>
  );
}
