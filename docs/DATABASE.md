# OnboardMe Database Schema

PostgreSQL schema with 4 tables. All tables use CUID for primary keys and standard timestamps.

---

## Table: organisations

Represents a customer account (org).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | STRING | PK | CUID, auto-generated |
| email | STRING | UNIQUE, NOT NULL | Login email, case-sensitive |
| password | STRING | NOT NULL | bcryptjs hash (cost 10) |
| name | STRING | NOT NULL | Display name (derived from email) |
| apiKey | STRING | UNIQUE, NOT NULL | Used for future API authentication |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | ISO 8601 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW | ISO 8601 |

**Indexes:**
- `email` — for signup/login lookups
- `apiKey` — for future API key validation

**Design Notes:**
- One org per account (no multi-user teams in MVP)
- `apiKey` is generated at signup and never shown again (store securely on client)
- `name` is auto-derived from email (e.g., "user@example.com" → name: "user")

---

## Table: flows

Represents an onboarding flow (container for versions).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | STRING | PK | CUID, auto-generated |
| orgId | STRING | FK → organisations(id) ON DELETE CASCADE | Multi-tenancy |
| name | STRING | NOT NULL | Flow title (e.g., "Welcome Onboarding") |
| config | JSON | NOT NULL, DEFAULT '[]' | Array of step objects |
| status | STRING | NOT NULL, DEFAULT 'draft' | 'draft', 'live', 'archived' |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | ISO 8601 |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW | ISO 8601 |

**Indexes:**
- `(orgId, id)` — compound for org-scoped queries
- `status` — for filtering live flows

**Design Notes:**
- `config` stores step definitions as JSON array. Schema TBD (flexible for MVP).
- `status` tracks flow lifecycle. SDK only serves flows with status='live'.
- `orgId` FK has CASCADE delete — deleting an org removes all its flows.
- Drafts are UI-only (local state) until publish is clicked.

---

## Table: flow_versions

Append-only version history for published flows.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | STRING | PK | CUID, auto-generated |
| flowId | STRING | FK → flows(id) ON DELETE CASCADE | Which flow |
| versionNumber | INT | NOT NULL | Auto-incremented per flow (1, 2, 3...) |
| config | JSON | NOT NULL | Snapshot of flow config at publish time |
| publishedAt | TIMESTAMP | NOT NULL, DEFAULT NOW | ISO 8601 |

**Indexes:**
- `(flowId, versionNumber DESC)` — for fetching latest version
- `flowId` — for listing all versions of a flow

**Constraints:**
- **APPEND-ONLY**: No UPDATE or DELETE ever issued on this table. INSERT only.
- **NO UPDATE ALLOWED**: Enforced via Prisma middleware + code review.

**Design Rationale (ADR-001):**
- Preserves audit trail — every publish is immutable.
- Enables rollback — point SDK to prior version by specifying versionNumber.
- Prevents accidental data loss — no updates means no overwriting past publishes.
- Aligns with event-sourcing principles without full CQRS overhead.

**Query Pattern:**
```sql
SELECT config FROM flow_versions 
WHERE flowId = $1 
ORDER BY versionNumber DESC 
LIMIT 1
```
Always fetches the highest version_number (active version).

---

## Table: analytics_events

Event log for SDK interactions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | STRING | PK | CUID, auto-generated |
| flowId | STRING | FK → flows(id) ON DELETE CASCADE | Which flow |
| userId | STRING | NOT NULL | External user ID (from your system) |
| eventType | STRING | NOT NULL | 'flow_started', 'step_viewed', 'flow_completed', 'flow_dismissed' |
| stepIndex | INT | DEFAULT NULL | Step number (0-indexed), NULL for flow-level events |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | ISO 8601 |

**Indexes:**
- `(flowId, createdAt DESC)` — for analytics queries
- `(userId, createdAt DESC)` — for user-level analytics
- `eventType` — for filtering by event type

**Design Notes:**
- `userId` is free-form string (not a FK). Allows any user ID format from embedding domain.
- `stepIndex` is nullable — flow-level events (flow_started, flow_completed) have NULL.
- All timestamps in UTC ISO 8601.
- No user PII stored (email, IP, etc.) to keep GDPR simple.

**Event Types:**
| Type | When | stepIndex |
|------|------|-----------|
| `flow_started` | User opens the modal | NULL |
| `step_viewed` | User views a step | 0, 1, 2... (step number) |
| `flow_completed` | User completes all steps | NULL |
| `flow_dismissed` | User closes the modal | NULL |

---

## Schema Diagram

```
┌──────────────────┐
│  organisations   │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ password         │
│ name             │
│ apiKey (UNIQUE)  │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
    (1:N)│orgId
         │
    ┌────▼──────────┐          ┌───────────────┐
    │     flows     │(1:N)     │ flow_versions │
    ├───────────────┤─flowId─→─┤───────────────┤
    │ id (PK)       │          │ id (PK)       │
    │ orgId (FK)    │          │ flowId (FK)   │
    │ name          │          │ versionNumber │
    │ config        │          │ config        │
    │ status        │          │ publishedAt   │
    │ createdAt     │          └───────────────┘
    │ updatedAt     │
    └────┬──────────┘
         │
    (1:N)│flowId
         │
    ┌────▼──────────────┐
    │ analytics_events  │
    ├───────────────────┤
    │ id (PK)           │
    │ flowId (FK)       │
    │ userId            │
    │ eventType         │
    │ stepIndex         │
    │ createdAt         │
    └───────────────────┘
```

---

## Multi-Tenancy Design

All tables include `orgId` (directly or via FK), ensuring complete data isolation:

- A user can only see their own org's flows, versions, and events.
- API layer enforces: `WHERE orgId = session.orgId` on all queries.
- Deleting an org cascades to flows, versions, and events (clean removal).

Example query:
```typescript
const flows = await prisma.flow.findMany({
  where: { orgId: session.orgId }, // ← Multi-tenancy boundary
  include: { _count: { select: { versions: true } } }
});
```

---

## Data Growth Estimates (Free Tier)

Supabase free tier: 500 MB storage.

- 1 org = ~1 KB
- 1 flow = ~2 KB (with config)
- 1 version = ~2 KB
- 1 event = ~200 B

**MVP Scale (100 orgs, 10 flows/org, 100 versions/org, 1000 events/org):**
- organisations: 100 KB
- flows: 20 MB
- flow_versions: 20 MB
- analytics_events: 20 MB
- **Total: ~60 MB** ← Well under 500 MB limit

Scales comfortably to ~1,000 orgs or ~10M events before hitting free tier limits.

---

## Migrations

Schema is defined in `prisma/schema.prisma`. To apply changes:

```bash
npx prisma migrate dev --name <descriptive-name>
```

This:
1. Creates a migration file in `prisma/migrations/`
2. Applies it to the local dev database
3. Generates Prisma Client types

**For production (Supabase):**
```bash
npx prisma migrate deploy
```

Applies all pending migrations to the remote database.

---

## Constraints & Rules

| Rule | Enforcement | Rationale |
|------|-------------|-----------|
| flow_versions is append-only | Prisma middleware (code review enforces) | Audit trail |
| orgId on every table | Schema design + API scoping | Multi-tenancy isolation |
| userId in events has no FK | Intentional (free-form string) | Supports any user ID format |
| status='live' required for SDK | API layer checks status before serving | Prevents draft leakage |
| apiKey is unique | DB constraint | Enables future API key auth |

---

## Future Extensions (Post-MVP)

- **flow_drafts table** — Store draft versions if users need persistent drafts
- **audit_log table** — Record who changed what flow when (for collaboration)
- **team_members table** — Support multiple users per org (for multi-user teams)
- **webhooks table** — Let users subscribe to events (flow_completed → notify their service)
