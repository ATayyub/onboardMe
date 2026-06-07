---
name: feedback_patterns
description: Established patterns that work, patterns to avoid, and known gotchas from the spec
metadata:
  type: feedback
---

# Feedback & Established Patterns

## Patterns That Work
- Always wrap Prisma calls in try/catch and return { error } shapes on failure
- Use NextResponse.json() consistently — never raw Response in App Router
- CORS headers belong in a shared lib/cors.ts helper, not duplicated per route
- flow_versions inserts use `data: { ...parsed, flowId, version: nextVersion }` pattern
- Dialog open/close state managed with data-attributes on the `<dialog>` element itself

## Patterns to Avoid
- Do not use `prisma.$executeRaw` for anything that can be done with the typed client
- Do not add middleware for CORS — handle it per-route in /api/sdk/* only
- Do not import server-only Prisma client into client components
- Do not use `router.refresh()` as a substitute for proper revalidation

## Known Gotchas
- Supabase free tier: connection pool limit is 20; always use prisma.$disconnect in
  serverless functions if connection pooling is not configured
- NextAuth session.user does not include orgId by default — extend the session callback
- The `<dialog>` element requires `dialog.showModal()` not `.show()` for proper backdrop
- sdk.js must be served from /public, not /app — Next.js does not process it
- Server components cannot have onClick handlers — must add "use client" directive at top

## Architectural Debt (Recorded, Not a Blocker)
- **Flat routes without (auth)/(dashboard) groups**: Works fine for POC, but will need
  refactoring before adding 3+ new features. The `/flows/[id]` page consolidates Editor,
  Analytics, Install tabs into one 500-line component — will become unmaintainable.
  **Refactor timeline**: Before Phase 2 features (A/B testing, scheduling, collaboration).
  **Migration path**: Move routes to `/(auth)` and `/(dashboard)` groups, split tabs into
  separate views/files. See ADR-006.
- **Single root layout**: Works for POC. Future sidebar/header variants needed? Create
  `(dashboard)/layout.tsx` with shared nav. Easy migration since routes already exist.
