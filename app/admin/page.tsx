"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface OrgData {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  flowCount: number;
  liveFlowCount: number;
  totalEvents: number;
}

interface AdminStats {
  totalOrgs: number;
  totalFlows: number;
  totalEvents: number;
  orgs: OrgData[];
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/orgs");
      if (res.status === 403) {
        setError("Access denied. You do not have admin permissions.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to load admin data");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError("Error loading admin data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-center text-gray-500">No data</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Track OnboardMe signups and usage</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 uppercase font-medium">Total Signups</p>
          <p className="text-4xl font-bold text-black mt-2">{stats.totalOrgs}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 uppercase font-medium">Total Flows</p>
          <p className="text-4xl font-bold text-black mt-2">{stats.totalFlows}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 uppercase font-medium">Total Events</p>
          <p className="text-4xl font-bold text-black mt-2">{stats.totalEvents}</p>
        </div>
      </div>

      {/* Orgs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h2 className="font-bold text-gray-900">All Organisations</h2>
        </div>

        {stats.orgs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No organisations yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">
                    Signed Up
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Flows</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Events</th>
                </tr>
              </thead>
              <tbody>
                {stats.orgs.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900 font-mono text-xs">
                      {org.email}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{org.name}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {new Date(org.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {org.liveFlowCount} live / {org.flowCount} total
                    </td>
                    <td className="px-6 py-3 text-gray-600">{org.totalEvents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-black transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
