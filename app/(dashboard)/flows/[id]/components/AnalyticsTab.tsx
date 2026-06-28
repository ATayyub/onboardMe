"use client";

interface FunnelStep {
  stepIndex: number;
  label: string;
  count: number;
  rate: number;
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
    steps: FunnelStep[];
    completed: number;
    completionRate: number;
  } | null;
}

interface Props {
  analytics: AnalyticsData | null;
  loading: boolean;
  onPageChange: (page: number) => void;
}

function pct(n: number): string {
  return (n * 100).toFixed(0) + "%";
}

export function AnalyticsTab({ analytics, loading, onPageChange }: Props) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-gray-500">No analytics data yet</div>;
  }

  const { pagination, funnel } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h2 className="font-bold">Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Events", value: analytics.summary.totalEvents },
              { label: "Started", value: analytics.summary.flowStarted },
              { label: "Steps", value: analytics.summary.stepViewed },
              { label: "Completed", value: analytics.summary.flowCompleted },
              { label: "Users", value: analytics.summary.uniqueUsers },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase font-medium">{label}</p>
                <p className="text-3xl font-bold mt-2">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel */}
      {funnel && funnel.started > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h2 className="font-bold">Conversion Funnel</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {/* Started row */}
              <FunnelRow
                label="Flow started"
                count={funnel.started}
                rate={1}
                baseline={funnel.started}
                isFirst
              />
              {/* Intermediate steps */}
              {funnel.steps.map((step) => (
                <FunnelRow
                  key={step.stepIndex}
                  label={step.label || `Step ${step.stepIndex + 1}`}
                  count={step.count}
                  rate={step.rate}
                  baseline={funnel.started}
                />
              ))}
              {/* Completed row */}
              <FunnelRow
                label="Completed"
                count={funnel.completed}
                rate={funnel.completionRate}
                baseline={funnel.started}
                isLast
              />
            </div>
          </div>
        </div>
      )}

      {/* Events table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold">Recent Events</h2>
          <p className="text-xs text-gray-500">
            Showing {analytics.events.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
        </div>
        <div className="p-6">
          {analytics.events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No events yet. Share your flow to start collecting data.
            </p>
          ) : (
            <>
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
                          {event.stepIndex !== null ? `Step ${event.stepIndex + 1}` : "—"}
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

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  count,
  rate,
  baseline,
  isFirst = false,
  isLast = false,
}: {
  label: string;
  count: number;
  rate: number;
  baseline: number;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const barWidth = baseline > 0 ? (count / baseline) * 100 : 0;

  return (
    <div className={`flex items-center gap-4 py-2 ${isLast ? "border-t border-gray-100 pt-4 mt-1" : ""}`}>
      <div className="w-36 shrink-0 text-sm text-gray-700 font-medium truncate">{label}</div>
      <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
        <div
          className={`h-full rounded transition-all ${isFirst ? "bg-blue-500" : isLast ? "bg-green-500" : "bg-blue-400"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right">
        <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>
        {!isFirst && (
          <span className="text-xs text-gray-400 ml-1">({pct(rate)})</span>
        )}
      </div>
    </div>
  );
}
