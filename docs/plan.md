# OnboardMe — Agentic Workflow Scaffolding Plan

## Context
Setting up the Claude Code autonomous agent configuration for the OnboardMe MVP project
(Next.js + Supabase + Prisma + Vanilla JS SDK, 7-day build target). This creates all guidance
and memory files so an agent can build the app autonomously without repeated explanations.

No application code is written here — only the agentic harness (CLAUDE.md, skills, hooks,
memory, decisions, session log).

---

## File Hierarchy

```
/Users/aminatayyub/Desktop/onboardMe/
├── CLAUDE.md                          # <100 lines, project instructions for Claude
├── decision.md                        # ADR log — 5 decisions from the spec
├── session-log.md                     # Daily build tracker (Day 1–7 + current session)
├── memory/
│   ├── MEMORY.md                      # Index of memory sub-files
│   ├── user.md                        # Developer profile and preferences
│   ├── project.md                     # MVP goals, POC checklist, scope boundaries
│   ├── feedback.md                    # Established patterns, known gotchas
│   └── reference.md                   # Docs URLs, key commands, Supabase notes
├── .claude/
│   ├── settings.json                  # Hooks: PostToolUse tsc, PreToolUse DB guard, Stop summary
│   └── skills/
│       ├── build-api-route.md         # Checklist: auth, CORS, Prisma, error handling
│       ├── prisma-migration.md        # Checklist: schema edit → migrate dev → studio verify
│       ├── sdk-change.md              # Checklist: test.html test, CORS, dialog styling
│       └── verify-feature.md         # Checklist: tsc, manual test, DB verify, POC tick
└── docs/plan.md                       # This file — build roadmap (accessible to agent)
```

---

## Design Philosophy

### Hooks as Guardrails
The `.claude/settings.json` file implements:
- **PostToolUse (tsc)**: Type-check runs automatically after every TS file edit. Errors surface immediately.
- **PostToolUse (logging)**: Each bash command is logged to session-commands.log for debugging.
- **PreToolUse (DB guard)**: Any bash command containing `prisma migrate reset`, `DROP TABLE`, etc. is blocked with a clear error message referencing ADR-001.
- **Stop**: Reminder to review session-log.md and verify database state before exiting.

### Skills as Checklists
Each skill is a sequential, self-contained checklist the agent works through:
- **build-api-route.md**: 8 steps covering auth, validation, Prisma, CORS, errors, return shapes.
- **prisma-migration.md**: 6 steps covering schema validation, migration creation, studio verification, and hard rules.
- **sdk-change.md**: 7 steps covering file integrity, DOM scoping, test.html smoke test, CORS cross-origin check.
- **verify-feature.md**: 8 steps covering type checking, manual tests, API tests, database verification, POC checklist ticks.

### Memory as Context
Four sub-files in `memory/` are selectively loaded based on relevance:
- **user.md**: Developer preferences (concise comms, type errors surfaced, no feature creep).
- **project.md**: Scope anchors (POC checklist, hard scope boundaries, all 7 API routes).
- **feedback.md**: Patterns and gotchas (CORS helper, NextAuth orgId, Supabase pooling).
- **reference.md**: External docs and commands.

### Decisions as Constraints
Five ADRs in `decision.md` encode the non-negotiables:
- **ADR-001**: flow_versions is append-only. Enforced by PreToolUse hook.
- **ADR-002**: Native `<dialog>` for SDK. Enforced in sdk-change.md checklist.
- **ADR-003**: Supabase free tier pooling. Enforced in reference.md notes.
- **ADR-004**: CORS on SDK endpoints only. Enforced in build-api-route.md.
- **ADR-005**: Single /publish endpoint. Enforced by API route spec in project.md.

---

## How the Agent Uses This

### Session Start
1. Load memory/project.md — anchors scope.
2. Load memory/user.md — confirms communication style.
3. Load CLAUDE.md — reviews dev commands and agent instructions.
4. Read decision.md — understands non-negotiables.

### Building a Feature
1. Before any schema change: run `.claude/skills/prisma-migration.md` checklist.
2. Before any API route: run `.claude/skills/build-api-route.md` checklist.
3. Before any SDK change: run `.claude/skills/sdk-change.md` checklist.
4. After finishing a feature: run `.claude/skills/verify-feature.md` checklist.

### Logging Progress
- Update `session-log.md` Current Day section after each completed item.
- If blocked, append to the Blockers table with description, day, and status.
- Hooks automatically log bash commands and remind on session exit.

### Protection
- PreToolUse hook blocks `prisma migrate reset` and destructive SQL automatically.
- PostToolUse (tsc) surfaces type errors immediately after every TS file write.
- No skill or decision can be overridden — they are the source of truth.

---

## MVP Task Breakdown (Phase-Based)

**Read only the phase you're currently working on** to optimize token usage. Each phase is independent and deliverable.

### Testing Strategy

**Every phase has BDD (Behavior-Driven Development) test cases.** After completing a phase:

1. Read `.claude/skills/test-phase.md` for testing instructions
2. Open the corresponding test file: `tests/phase-[N]-[name].feature`
3. Run each scenario manually using the Given-When-Then format
4. Check the box for each passing test
5. All tests must pass before moving to the next phase

**Test files**:
- `tests/phase-1-foundation.feature` (6 scenarios)
- `tests/phase-2-auth.feature` (10 scenarios)
- `tests/phase-3-crud-api.feature` (9 scenarios)
- `tests/phase-4-publishing.feature` (13 scenarios)
- `tests/phase-5-sdk.feature` (17 scenarios)
- `tests/phase-6-analytics.feature` (16 scenarios)
- `tests/phase-7-polish.feature` (15 scenarios)
- `tests/phase-8-ship.feature` (12 scenarios)

Total: 98 BDD scenarios covering the entire POC.

---

### Phase 1: Foundation — Project Setup & Database

**Duration**: ~1 day | **Skills to use**: `.claude/skills/prisma-migration.md`

**What it delivers**: Database schema initialized, migrations working, ready for auth.

| Task | Subtasks | Done |
|------|----------|------|
| **1.1 Init Next.js + dependencies** | - `npx create-next-app@latest onboardme --typescript --tailwind --eslint`<br>- Add Prisma: `npm install @prisma/client`<br>- Add NextAuth: `npm install next-auth`<br>- Add Supabase: `npm install @supabase/auth-helpers-nextjs` | [ ] |
| **1.2 Set up Prisma + Supabase** | - Create `.env.local` with Supabase DATABASE_URL (pgbouncer=true) and DIRECT_URL<br>- Run `npx prisma init`<br>- Point `datasource db` to Supabase PostgreSQL | [ ] |
| **1.3 Create database schema** | - Edit `prisma/schema.prisma` with 4 tables: organisations, flows, flow_versions, analytics_events<br>- Run `npx prisma migrate dev --name init`<br>- Verify tables in `npx prisma studio` | [ ] |
| **1.4 Commit** | - `git add -A && git commit -m "Phase 1: Project init, database schema"` | [ ] |

**Verification**: Tables exist in Prisma Studio, migrations applied cleanly.

**Phase 1 BDD Tests**: Open `tests/phase-1-foundation.feature` and run all scenarios manually.
Use `.claude/skills/test-phase.md` for testing instructions. All tests must pass before Phase 2.

---

### Phase 2: Authentication — Login, Signup, Sessions

**Duration**: ~1 day | **Skills to use**: `.claude/skills/build-api-route.md`

**What it delivers**: Users can sign up, log in, and session includes orgId for multi-tenancy.

| Task | Subtasks | Done |
|------|----------|------|
| **2.1 Set up NextAuth** | - Create `app/api/auth/[...nextauth]/route.ts`<br>- Configure CredentialsProvider (email + password)<br>- Set JWT secret in `.env.local`<br>- Extend session callback to include orgId | [ ] |
| **2.2 Build signup page** | - Create `app/(auth)/signup/page.tsx`<br>- Form with email + password<br>- On submit: insert organisations row, call signIn()<br>- Generate and store API key with org | [ ] |
| **2.3 Build login page** | - Create `app/(auth)/login/page.tsx`<br>- Form with email + password<br>- Call `signIn("credentials", {...})`<br>- Redirect to `/dashboard` on success | [ ] |
| **2.4 Build layout wrappers** | - Create `app/(auth)/layout.tsx` (no auth required)<br>- Create `app/(dashboard)/layout.tsx` (auth required, redirect to /login)<br>- Navigation links in dashboard layout | [ ] |
| **2.5 Test auth flow** | - Signup with new email → verify organisations row in Prisma Studio<br>- Login with that email → see dashboard<br>- Logout → redirect to login | [ ] |
| **2.6 Commit** | - `git commit -m "Phase 2: Authentication, signup, login, session"` | [ ] |

**Verification**: Can sign up, log in, see blank dashboard. orgId in session.

**Phase 2 BDD Tests**: Open `tests/phase-2-auth.feature` and run all 10 scenarios manually.
All tests must pass before Phase 3.

---

### Phase 3: Flow CRUD API — Create, Read, Update, List Flows

**Duration**: ~1 day | **Skills to use**: `.claude/skills/build-api-route.md`, `.claude/skills/verify-feature.md`

**What it delivers**: Full CRUD endpoints for flows; dashboard can list and create flows.

| Task | Subtasks | Done |
|------|----------|------|
| **3.1 GET /api/flows** | - Create `app/api/flows/route.ts` with GET export<br>- Check session, scope to `orgId`<br>- Return `{ flows: [...], error?: string }`<br>- Test: `curl -H "Authorization: Bearer $SESSION"` | [ ] |
| **3.2 POST /api/flows (create)** | - POST handler in same file<br>- Validate body has `name` (string)<br>- Insert new flow with `status: 'draft'`<br>- Return created flow | [ ] |
| **3.3 GET /api/flows/[id]** | - Create `app/api/flows/[id]/route.ts`<br>- Fetch single flow, scope by orgId<br>- Return flow + latest version if published | [ ] |
| **3.4 PUT /api/flows/[id]** | - PUT handler in same file<br>- Update flow name or status (draft/live/archived)<br>- Never touch flow_versions (append-only rule) | [ ] |
| **3.5 Build flow list screen** | - Create `app/(dashboard)/flows/page.tsx`<br>- Fetch flows from GET /api/flows<br>- Display table: name, status badge, created_at<br>- "New Flow" button calls POST /api/flows | [ ] |
| **3.6 Test all CRUD operations** | - Create 3 flows via dashboard<br>- Verify rows in Prisma Studio<br>- Edit one flow's name<br>- Archive one flow | [ ] |
| **3.7 Commit** | - `git commit -m "Phase 3: Flow CRUD endpoints and list screen"` | [ ] |

**Verification**: Can create, list, edit flows. All 4 GET/POST/PUT endpoints working.

---

### Phase 4: Publishing System — Publish Flows (Append-Only Versions)

**Duration**: ~1 day | **Skills to use**: `.claude/skills/build-api-route.md`

**What it delivers**: Flows can be published; creates immutable flow_version records.

| Task | Subtasks | Done |
|------|----------|------|
| **4.1 Build flow builder UI** | - Create `app/(dashboard)/flows/[id]/page.tsx`<br>- Left sidebar: list of steps<br>- Middle: form to edit selected step (title, body, cta_label, dismiss_label)<br>- Auto-save to local state on blur | [ ] |
| **4.2 Step list controls** | - Add button: insert new step<br>- Remove button: delete step<br>- Reorder buttons (up/down for MVP) | [ ] |
| **4.3 POST /api/flows/[id]/publish** | - Create `app/api/flows/[id]/publish/route.ts`<br>- Validate flow has at least 1 step<br>- Calculate next `version_num`<br>- **INSERT** new flow_version (append-only)<br>- Set flow.status = 'live'<br>- Return published version | [ ] |
| **4.4 Wire publish button** | - Add "Publish" button in builder<br>- On click: POST to /api/flows/[id]/publish<br>- On success: show "Copy this script tag" modal<br>- On error: show error message | [ ] |
| **4.5 Test publish flow** | - Build 2-step flow in UI<br>- Click Publish<br>- Verify flow_versions table: new row with version_num=1<br>- Verify flow.status = 'live'<br>- Check `/api/flows/[id]/config` returns JSON | [ ] |
| **4.6 Commit** | - `git commit -m "Phase 4: Flow builder UI and append-only publishing"` | [ ] |

**Verification**: Can publish flows; flow_versions is append-only (never UPDATE/DELETE).

---

### Phase 5: SDK Integration — Embed Script & Config Serving

**Duration**: ~1 day | **Skills to use**: `.claude/skills/sdk-change.md`, `.claude/skills/verify-feature.md`

**What it delivers**: Vanilla JS SDK can be dropped into external pages; fetches and renders flows.

| Task | Subtasks | Done |
|------|----------|------|
| **5.1 Build GET /api/sdk/[flow_id]/config** | - Create `app/api/sdk/[flow_id]/config/route.ts`<br>- **Public endpoint** (no auth)<br>- Add CORS: `Access-Control-Allow-Origin: *`<br>- Handle OPTIONS preflight<br>- Find latest flow_version (ORDER BY version DESC LIMIT 1)<br>- Return config JSON | [ ] |
| **5.2 Build POST /api/sdk/[flow_id]/events** | - Create `app/api/sdk/[flow_id]/events/route.ts`<br>- **Public endpoint**, add CORS<br>- Accept: `{ event_type, user_id?, step_index?, url? }`<br>- Insert into analytics_events<br>- Return 200 | [ ] |
| **5.3 Write /public/sdk.js** | - Create `/public/sdk.js` (~80 lines)<br>- Read flow_id + user_id from script tag attributes<br>- Fetch config from /api/sdk/[flow_id]/config<br>- If empty/no steps: stop silently<br>- Render first step in `<dialog>` with `showModal()`<br>- On CTA: move to next step<br>- On dismiss/last step: close dialog<br>- Fire events: flow_started, step_viewed, flow_completed/flow_dismissed | [ ] |
| **5.4 Test SDK locally** | - Create `/public/test.html` with script tag<br>- Open in browser, verify modal appears<br>- Click through steps, verify navigation<br>- DevTools Network: verify /api/sdk/config and /api/sdk/events calls | [ ] |
| **5.5 Test SDK on external page** | - Create separate HTML file (outside this project)<br>- Add script tag with your SDK URL<br>- Verify modal appears and works | [ ] |
| **5.6 CORS cross-origin test** | - Serve test.html from different port (Python http.server)<br>- Verify CORS headers accepted<br>- Confirm no CORS errors in console | [ ] |
| **5.7 Commit** | - `git commit -m "Phase 5: SDK endpoints and vanilla JS embed"` | [ ] |

**Verification**: Modal appears when SDK embedded on external page. Events fire correctly.

---

### Phase 6: Analytics & Dashboards — Event Tracking & Display

**Duration**: ~1 day | **Skills to use**: `.claude/skills/build-api-route.md`, `.claude/skills/verify-feature.md`

**What it delivers**: Flows can track user interactions; dashboard shows events and SDK install instructions.

| Task | Subtasks | Done |
|------|----------|------|
| **6.1 Build GET /api/dashboard/analytics** | - Create `app/api/dashboard/analytics/route.ts` with `?flow_id=...` param<br>- Fetch analytics_events, order by created_at DESC<br>- Return last 50 events | [ ] |
| **6.2 Build analytics dashboard screen** | - Create `app/(dashboard)/flows/[id]/analytics/page.tsx`<br>- Fetch events from GET /api/dashboard/analytics<br>- Display table: event_type, step_index, user_id, timestamp<br>- Show last 50 events | [ ] |
| **6.3 Build SDK install screen** | - Create `app/(dashboard)/sdk-install/page.tsx`<br>- Display org's API key<br>- Show pre-filled script tag with flow_id<br>- "SDK detected" indicator: query events from last 24h | [ ] |
| **6.4 Test analytics** | - Click through a flow on test.html<br>- Verify events appear in analytics dashboard<br>- Check all event types: flow_started, step_viewed, flow_completed | [ ] |
| **6.5 Commit** | - `git commit -m "Phase 6: Analytics endpoints, event dashboard, SDK install screen"` | [ ] |

**Verification**: Events from SDK appear in dashboard. Can see flow engagement data.

---

### Phase 7: Error Handling & UX Polish

**Duration**: ~0.5 day | **Skills to use**: `.claude/skills/verify-feature.md`

**What it delivers**: Graceful error messages; polished UI without rough edges.

| Task | Subtasks | Done |
|------|----------|------|
| **7.1 Publish error handling** | - Publish with 0 steps → show "Flow must have at least 1 step"<br>- Network error on publish → show "Retry" button<br>- SDK fetch fails → log warning, don't break page | [ ] |
| **7.2 UI polish** | - Remove placeholder text throughout<br>- Fix spacing/alignment issues<br>- Not a redesign, just clean rough edges<br>- Quick mobile layout check | [ ] |
| **7.3 Test with someone else** | - Have a teammate use dashboard without help<br>- Note 2-3 most confusing parts<br>- Add to phase 8 improvements | [ ] |
| **7.4 Commit** | - `git commit -m "Phase 7: Error handling, UX polish"` | [ ] |

**Verification**: All flows complete without errors. UI looks clean.

---

### Phase 8: Verification & Ship — Full End-to-End Testing

**Duration**: ~1 day | **Skills to use**: `.claude/skills/verify-feature.md`

**What it delivers**: POC complete and deployed to production.

| Task | Subtasks | Done |
|------|----------|------|
| **8.1 Apply improvements from Phase 7 feedback** | - Implement the 2-3 most confusing UX items noted<br>- Don't redesign; just fix what was confusing | [ ] |
| **8.2 Full end-to-end POC test** | - Signup → create flow → add 2 steps → publish → copy script tag → drop into test.html → open → see modal → click CTA → see step 2 → click CTA → see completion → open analytics → see events | [ ] |
| **8.3 Type check & build** | - Run `npx tsc --noEmit` (zero errors?)<br>- Run `npm run build` (no build errors?) | [ ] |
| **8.4 Verify all 7 API routes** | - GET /api/flows ✓<br>- POST /api/flows ✓<br>- GET /api/flows/[id] ✓<br>- PUT /api/flows/[id] ✓<br>- POST /api/flows/[id]/publish ✓<br>- GET /api/sdk/[flow_id]/config ✓<br>- POST /api/sdk/[flow_id]/events ✓ | [ ] |
| **8.5 Test on real external app** | - Deploy to Vercel<br>- Create onboarding flow (2-3 steps)<br>- Install SDK on real project you own<br>- Verify works correctly | [ ] |
| **8.6 Update POC checklist** | - Check off all 5 items in memory/project.md<br>- Confirm all requirements met | [ ] |
| **8.7 Write README** | - Clone repo → create Supabase project → npm install → .env.local → npx prisma migrate deploy → npm run dev → localhost:3000 | [ ] |
| **8.8 Deploy to Vercel** | - Set env vars in Vercel dashboard<br>- Push to main branch<br>- Vercel auto-deploys | [ ] |
| **8.9 Final commit** | - `git commit -m "Phase 8: Full verification, POC complete, shipped"` | [ ] |

**Verification**: POC checklist 100% complete. App deployed and working on real external page.

---

### Phase 9: Admin Dashboard — Track Signups

**Duration**: ~0.5 day | **Skills to use**: `.claude/skills/build-api-route.md`

**What it delivers**: A `/admin` page (only you can access) showing all OnboardMe signups with flow counts and event stats. No schema changes required.

**Protection strategy**: `ADMIN_EMAIL` env var. The API route checks `session.user.email === process.env.ADMIN_EMAIL`. Non-admins get 403. Unauthenticated users are already blocked by middleware.

| Task | Subtasks | Done |
|------|----------|------|
| **9.1 Add ADMIN_EMAIL to env** | - Add `ADMIN_EMAIL=amina.tayyub@taleemabad.com` to `.env.local`<br>- Add same to Vercel environment variables | [x] |
| **9.2 Build GET /api/admin/orgs** | - Create `app/api/admin/orgs/route.ts`<br>- Check session, return 401 if not logged in<br>- Check `session.user.email === process.env.ADMIN_EMAIL`, return 403 if not admin<br>- Query all orgs with `_count` of flows<br>- For each org, count analytics_events via nested flowIds<br>- Return `{ totalOrgs, orgs: [{ id, email, name, createdAt, flowCount, liveFlowCount, totalEvents }] }` | [x] |
| **9.3 Build /admin page** | - Create `app/admin/page.tsx` (client component)<br>- Fetch `/api/admin/orgs` on load<br>- Show 3 stat cards: Total Signups, Total Flows, Total Events<br>- Show table: Email, Name, Signed up, Flows (live/total), Events<br>- Sort newest first<br>- If API returns 403, show "Access denied" | [x] |
| **9.4 Protect /admin in middleware** | - Edit `middleware.ts` to add `/admin` to the protected paths matcher<br>- Unauthenticated visits → redirect to `/login` | [x] |
| **9.5 Test admin flow** | - Log in as non-admin → visit `/admin` → see "Access denied"<br>- Log in as admin email → visit `/admin` → see org table<br>- Verify counts match `SELECT count(*) FROM organisations` in psql<br>- Signup with new account → refresh `/admin` → count increments | [ ] |
| **9.6 Commit** | - `git commit -m "Phase 9: Admin dashboard for tracking signups"` | [ ] |

**Verification**: Signed-in admin sees org list with correct counts. Non-admins and unauthenticated users cannot access the page or API.

---

### Phase 10: Per-Flow Theming — Backend & SDK

**Duration**: ~0.5 day | **Skills to use**: `.claude/skills/prisma-migration.md`, `.claude/skills/build-api-route.md`, `.claude/skills/sdk-change.md`

**What it delivers**: Each published flow can carry brand colors (accent, background, text); the SDK renders the modal in those colors. Strictly additive — flows with no theme render exactly as today.

**Design decisions** (chosen with the user):
- **Manual theme config**, not auto-inheritance from the host page.
- **Scope**: `primaryColor` (accent / buttons), `backgroundColor` (dialog), `textColor` (title + body). Button label color auto-contrasts for readability.
- **Storage**: nullable `theme Json?` on `FlowVersion` — respects append-only (theme rides each published version); `null` ⇒ SDK uses current hardcoded defaults. No backfill.
- **Theme shape**: `{ "primaryColor": "#000000", "backgroundColor": "#ffffff", "textColor": "#1a1a1a" }`.

| Task | Subtasks | Done |
|------|----------|------|
| **10.1 Schema + migration** | - Add `theme Json?` (nullable) to `FlowVersion` in `prisma/schema.prisma`<br>- Applied to local Postgres as migration `2_add_flow_version_theme` (via `migrate diff` + `migrate deploy`, since `migrate dev` needs an interactive shell)<br>- Verified column `theme jsonb` (nullable) present; existing versions `null` | [x] |
| **10.2 Publish API accepts theme** | - In `app/api/flows/[id]/publish/route.ts`, read optional `theme` from body<br>- `validateTheme()` rejects malformed (non-hex / unknown keys); omitted ⇒ store `null`<br>- Persist on the new `FlowVersion` (append-only preserved) | [x] |
| **10.3 Config endpoint returns theme** | - In `app/api/sdk/[flowId]/config/route.ts`, added `theme` to the version `select` and response (`null` when absent)<br>- CORS headers unchanged | [x] |
| **10.4 SDK applies theme** | - In `public/sdk.js`, reads `config.theme`; applies to dialog background, title/body text, and buttons via existing inline styles<br>- Falls back to defaults when theme is `null`/missing<br>- Added `contrastColor()` helper for button label readability<br>- Zero deps, `showModal()`, styles scoped to the dialog | [x] |
| **10.5 Smoke test (sdk-change skill)** | - Themed flow rendered via `test.html`: bg `#f5f3ff`, title `#2e1065`, button `#6d28d9` + white label; Next advances<br>- Un-themed flow confirmed unchanged (white/black/#1a1a1a) — no regression<br>- Config endpoint returns `theme`; `tsc` clean | [x] |
| **10.6 Commit** | - Committed locally. **NOT pushed** — must apply the prod migration first (see deploy note) | [x] |

**Verification**: A themed flow renders in its colors; un-themed flows are visually unchanged; `npx tsc --noEmit` clean. ✅

> **⚠️ Deploy ordering (prod):** The publish + config routes now `SELECT theme`. Deploying this code to prod **before** the `theme` column exists there would 500 the live config endpoint and break the SDK for existing flows. Run `prisma migrate deploy` against production (needs the Supabase **direct** connection string) **before/with** pushing this code.

---

### Phase 11: Per-Flow Theming — Editor UI

**Duration**: ~0.5 day | **Skills to use**: `.claude/skills/verify-feature.md`

**What it delivers**: Clients pick their brand colors in the flow editor and publish them with the flow.

| Task | Subtasks | Done |
|------|----------|------|
| **11.1 Theme controls in editor** | - Add a "Theme" section to `app/(dashboard)/flows/[id]/components/EditorTab.tsx`<br>- 3 × `<input type="color">` with hex display for primary / background / text<br>- Extend `Props` with `theme` + `onUpdateTheme` | [ ] |
| **11.2 Theme state in parent** | - In `app/(dashboard)/flows/[id]/page.tsx`, hold `theme` state (default to current look)<br>- Pass `theme`/`onUpdateTheme` to `EditorTab`<br>- Include `theme` in the publish request body | [ ] |
| **11.3 Load saved theme on edit** | - Confirm `app/api/flows/[id]/route.ts` returns the latest version's `theme`<br>- Initialize editor state from it (defaults when `null`) so re-editing shows saved colors | [ ] |
| **11.4 Verify (verify-feature skill)** | - `npx tsc --noEmit`<br>- Set colors → publish → reload editor shows them → load via `test.html` shows them<br>- Update `session-log.md` (theming is a deliberate post-MVP feature add) | [ ] |
| **11.5 Commit** | - `git commit -m "Phase 11: per-flow theming — editor UI"` | [ ] |

**Verification**: Colors set in the editor persist across publish/reload and render correctly via the SDK.

---

## POC Completion Criteria (from memory/project.md)

All of these must be ✅ before shipping:

- [ ] An org can sign up and log in
- [ ] A flow can be created, edited, and published
- [ ] The SDK renders a published flow on an external page
- [ ] Analytics events appear in the dashboard
- [ ] All 7 API routes return correct shapes under happy-path tests

---

## Verification

After setup, confirm:
- `ls /Users/aminatayyub/Desktop/onboardMe/` shows CLAUDE.md, decision.md, session-log.md, memory/, .claude/, docs/
- `wc -l /Users/aminatayyub/Desktop/onboardMe/CLAUDE.md` ≤ 100 lines
- `cat .claude/settings.json` is valid JSON (no parse errors)
- All 4 skill files exist under `.claude/skills/`
- All 4 memory sub-files exist under `memory/`
- This plan.md is accessible at `docs/plan.md`
