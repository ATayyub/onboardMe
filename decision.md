# Architectural Decision Record — OnboardMe

---

## ADR-001: Append-Only flow_versions

**Decision**: The flow_versions table is append-only. Published versions are never
updated or deleted. A new publish always inserts a new row with an incremented version
number. The active version is the row with the highest version for a given flowId.

**Why**: Preserves audit trail. Allows rollback by pointing the SDK to a prior version
number. Prevents accidental data loss from a mis-fired update. Aligns with event-sourcing
principles without the full complexity of an event store.

**Consequences**:
- Storage grows with every publish (acceptable on Supabase free tier for POC scale).
- Queries for the active version must ORDER BY version DESC LIMIT 1.
- No UPDATE or DELETE may ever be issued against flow_versions — enforce via DB role
  permissions if possible, and enforce in code via Prisma middleware.

---

## ADR-002: Native `<dialog>` Element for SDK Modals

**Decision**: The vanilla JS SDK uses the native HTML `<dialog>` element for rendering
onboarding modals, not a custom div overlay.

**Why**: Zero dependencies. Works in all modern browsers. Provides native focus trapping
and backdrop. No CSS z-index wars with host page styles when used with `showModal()`.

**Consequences**:
- `dialog.showModal()` must be called, not `dialog.show()`, to get the backdrop.
- Host pages using very old browsers (pre-2022) may not support `<dialog>` — acceptable
  for POC. A polyfill can be added later.
- SDK styles must scope everything inside `dialog` to avoid leaking into host page.

---

## ADR-003: Supabase Free Tier Awareness

**Decision**: The POC targets the Supabase free tier. All design decisions account for
its limits: 500 MB storage, 20 connection pool limit, no read replicas.

**Why**: Minimises cost for the POC phase. Supabase free tier is sufficient for a demo
with fewer than a few hundred organisations.

**Consequences**:
- Prisma must be configured with connection pooling (pgbouncer=true in DATABASE_URL).
- Long-running connections must be avoided in serverless (call prisma.$disconnect or
  use a singleton pattern with connection reuse).
- If the POC succeeds and scales, a paid Supabase plan or self-hosted Postgres is needed.

---

## ADR-004: CORS on Public SDK Endpoints Only

**Decision**: CORS headers (Access-Control-Allow-Origin: *) are set only on
/api/sdk/flow and /api/sdk/event. No other routes allow cross-origin requests.

**Why**: The SDK is embedded on third-party websites that need to call these two
endpoints. Dashboard API routes are same-origin and must not be publicly accessible
from external domains.

**Consequences**:
- A shared cors.ts helper must be imported by both SDK routes.
- OPTIONS preflight requests must be handled by both SDK routes.
- Any new route added under /api/sdk/ must explicitly include CORS — it is not
  automatic.

---

## ADR-005: Single /publish Endpoint (No Module Split)

**Decision**: There is one POST /api/flows/[id]/publish endpoint that handles the entire
publish operation: validate, increment version, insert flow_version row, return the new
version. There is no separate endpoint for draft saving vs. publishing.

**Why**: Simplicity for POC. Splitting into draft/publish/activate modules adds
complexity without POC-phase value. The append-only constraint already provides a
version history.

**Consequences**:
- Every click of "Publish" in the dashboard creates a new immutable version row.
- There is no draft state in the DB — drafts are UI-only (local state or localStorage)
  until publish is clicked.
- If draft persistence is needed later, a `drafts` table or a `status` column on
  flow_versions can be added without breaking the append-only constraint.

---

## ADR-006: Flat Page Routes (No (auth) / (dashboard) Groups)

**Decision**: The POC uses a flat page directory structure: `/signup`, `/login`, `/dashboard`,
`/flows/[id]` instead of route groups like `/(auth)/signup` and `/(dashboard)/flows/[id]`.
Similarly, there is one root `app/layout.tsx` instead of separate layout files for auth
and dashboard sections. The flow editor page (`/flows/[id]/page.tsx`) consolidates Editor,
Analytics, and Install views into tabs rather than separate routes.

**Why**: Speed for POC. Route groups and layout files add boilerplate without POC-phase
value. Auth protection is enforced via middleware + per-route checks, not layout-level
redirects. Consolidating views into one component keeps things simple for the MVP.

**Consequences**:
- As features grow (A/B testing, scheduled flows, team collaboration, version history),
  the `/flows/[id]` component will balloon and become hard to maintain. **Refactor needed
  before Phase 2 feature work**: split into separate views and move to `/(dashboard)` route
  group.
- Can't apply different layouts to different page groups (e.g., auth pages vs. dashboard).
  **Future work**: create `(auth)/layout.tsx` and `(dashboard)/layout.tsx` to isolate
  concerns when sidebar/header variants are needed.
- All pages share the root layout. **Migration path**: straightforward file moves from
  `/signup` → `/(auth)/signup` and `/dashboard` → `/(dashboard)/dashboard`.

**Timeline**: This is NOT a blocker for the POC. Refactor before adding 3+ new features
to `/flows/[id]` or when layout variants are needed for dashboard sections.
