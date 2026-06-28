"use client";
import { useState, useEffect } from "react";

interface Props {
  flowId: string;
  flowStatus: string;
  onSwitchToEditor: () => void;
  justPublished?: boolean;
}

export function InstallTab({ flowId, flowStatus, onSwitchToEditor, justPublished = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [saving, setSaving] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<"loading" | "active" | "none" | "error">("loading");
  const [sessionCount, setSessionCount] = useState(0);

  const embedSnippet =
    typeof window !== "undefined"
      ? `<script src="${window.location.origin}/sdk.js"></script>\n<script>\n  OnboardMe.init('${flowId}', {\n    baseUrl: '${window.location.origin}'\n  });\n</script>`
      : "";

  useEffect(() => {
    fetch("/api/org/domains")
      .then((r) => r.json())
      .then((d) => setDomains(d.domains || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (flowStatus !== "live") return;
    fetch(`/api/dashboard/analytics?flowId=${flowId}&page=1&limit=1`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        const count: number = d?.summary?.flowStarted ?? 0;
        setSessionCount(count);
        setIntegrationStatus(count > 0 ? "active" : "none");
      })
      .catch(() => setIntegrationStatus("error"));
  }, [flowId, flowStatus]);

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

  const addDomain = async () => {
    setDomainError("");
    const trimmed = newDomain.trim().replace(/\/$/, "");
    if (!trimmed) return;

    if (!/^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9\-.]*(\:\d+)?$/.test(trimmed)) {
      setDomainError("Use the full origin: https://yourdomain.com");
      return;
    }

    if (domains.includes(trimmed)) {
      setDomainError("Domain already in the list");
      return;
    }

    const updated = [...domains, trimmed];
    await saveDomains(updated);
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    saveDomains(domains.filter((d) => d !== domain));
  };

  const saveDomains = async (list: string[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/org/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: list }),
      });
      if (res.ok) {
        setDomains(list);
      } else {
        const data = await res.json();
        setDomainError(data.error || "Failed to save");
      }
    } catch {
      setDomainError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Just-published success banner */}
      {justPublished && flowStatus === "live" && (
        <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-lg px-5 py-4">
          <span className="text-lg" aria-hidden>🎉</span>
          <div>
            <p className="font-medium text-black text-sm">Your flow is live!</p>
            <p className="text-xs text-[#737373] mt-0.5">
              Follow the steps below to add it to your website.
            </p>
          </div>
        </div>
      )}

      {/* Embed snippet */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h2 className="font-bold">Install on your site</h2>
        </div>
        <div className="p-6">
          {flowStatus !== "live" ? (
            <div className="text-center py-8">
              <p className="text-gray-700 font-medium mb-1">
                Publish this flow to get its embed code
              </p>
              <p className="text-sm text-gray-500">
                Go to the{" "}
                <button onClick={onSwitchToEditor} className="underline font-medium">
                  Editor
                </button>{" "}
                tab and click Publish. The embed code appears here once the flow is live.
              </p>
            </div>
          ) : (
            <>
              {/* Numbered steps */}
              <ol className="flex items-start gap-4 mb-6">
                {[
                  { n: "1", text: "Copy the code snippet below" },
                  { n: "2", text: "Paste it before </body> on your page" },
                  { n: "3", text: "Your flow will appear automatically" },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-2 flex-1">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {n}
                    </span>
                    <span className="text-sm text-[#525252]">{text}</span>
                  </li>
                ))}
              </ol>

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

              {/* Flow ID + integration status */}
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Flow ID:</span>{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{flowId}</code>
              </div>
              <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
                {integrationStatus === "loading" && (
                  <p className="text-xs text-[#a3a3a3]">Checking integration status...</p>
                )}
                {integrationStatus === "none" && (
                  <p className="text-xs text-[#737373]">
                    No events detected yet — paste the snippet to your site to get started.
                  </p>
                )}
                {integrationStatus === "active" && (
                  <p className="text-xs text-black font-medium">
                    Integration active —{" "}
                    {sessionCount.toLocaleString()} session{sessionCount !== 1 ? "s" : ""} detected
                  </p>
                )}
                {integrationStatus === "error" && (
                  <p className="text-xs text-[#a3a3a3]">Could not load integration status.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Domain allowlist */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h2 className="font-bold">Allowed domains</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Restrict which domains can load your flows. Leave empty to allow any origin (default).
          </p>

          {domains.length > 0 && (
            <ul className="space-y-2 mb-4">
              {domains.map((domain) => (
                <li
                  key={domain}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                >
                  <code className="text-gray-800">{domain}</code>
                  <button
                    onClick={() => removeDomain(domain)}
                    disabled={saving}
                    className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => { setNewDomain(e.target.value); setDomainError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDomain(); } }}
              placeholder="https://yourdomain.com"
              className="flex-1 px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm text-black placeholder-[#a3a3a3] focus:outline-none focus:border-black transition-all"
              disabled={saving}
            />
            <button
              onClick={addDomain}
              disabled={saving || !newDomain.trim()}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving..." : "Add"}
            </button>
          </div>

          {domainError && (
            <p className="mt-2 text-xs text-red-600">{domainError}</p>
          )}

          {domains.length === 0 && (
            <p className="mt-3 text-xs text-gray-400">
              No restrictions — all origins can load your flows.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
