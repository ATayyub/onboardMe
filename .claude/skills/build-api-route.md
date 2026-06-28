# Skill: Build an API Route

Work through this checklist in order every time you add a new route under `app/api/`.

---

## 1. Decide auth requirement

| Route type | Auth needed? | CORS needed? |
|------------|-------------|--------------|
| Dashboard / flow management | Yes — session | No |
| `/api/sdk/*` endpoints | No | **Yes — required** |
| Admin endpoints | Yes — session + ADMIN_EMAIL check | No |

---

## 2. Create the route file

Path: `app/api/<resource>/[id]/route.ts` (or without `[id]` for collection routes)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
```

---

## 3. Auth check (session-gated routes only)

```ts
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const orgId = (session as any).orgId as string;
```

---

## 4. CORS headers (SDK routes only — ADR-004)

```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
```

Add `headers: CORS_HEADERS` to every `NextResponse.json()` return in the handler.

---

## 5. Scope Prisma queries by orgId

Every query on flows must include `where: { orgId }` or verify ownership.
Never return data from a different org.

```ts
const flow = await prisma.flow.findUnique({
  where: { id: flowId, orgId }, // orgId scoping is mandatory
});
if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

---

## 6. Validate the request body

Parse and validate before touching the DB:

```ts
const body = await request.json().catch(() => null);
if (!body?.name) {
  return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
}
```

---

## 7. Wrap in try/catch

```ts
try {
  // ... prisma call
  return NextResponse.json({ result }, { status: 200 });
} catch (error) {
  console.error("POST /api/flows error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

## 8. Return the correct shape

Match the shape defined in `docs/API.md`. If the endpoint is new, add it to `docs/API.md` first.

---

## 9. Type-check

```bash
npx tsc --noEmit
```

Must pass with zero errors before the route is considered done.
