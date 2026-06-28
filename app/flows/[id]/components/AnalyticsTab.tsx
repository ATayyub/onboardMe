"use client";

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

interface Props {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export function AnalyticsTab({ analytics, loading }: Props) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-gray-500">No analytics data yet</div>;
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="border-b bg-gray-50 px-6 py-4">
        <h2 className="font-bold">Analytics</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-5 gap-4 mb-8">
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
    </div>
  );
}
