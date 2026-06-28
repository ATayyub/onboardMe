"use client";
import { useState } from "react";

interface Props {
  flowId: string;
  flowStatus: string;
  onSwitchToEditor: () => void;
}

export function InstallTab({ flowId, flowStatus, onSwitchToEditor }: Props) {
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

  return (
    <div className="bg-white rounded-lg border overflow-hidden max-w-3xl">
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
  );
}
