export function buildCorsHeaders(
  allowedDomainsJson: string,
  requestOrigin: string | null,
  methods: string = "GET, OPTIONS"
): Record<string, string> {
  let domains: string[] = [];
  try {
    domains = JSON.parse(allowedDomainsJson || "[]");
  } catch {
    domains = [];
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (domains.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (requestOrigin && domains.includes(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
    headers["Vary"] = "Origin";
  }
  // If origin is not in the allowlist, omit ACAO header — browser blocks it.

  return headers;
}
