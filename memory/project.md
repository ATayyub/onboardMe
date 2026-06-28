---
name: project_onboardme_mvp
description: MVP goals, POC definition, scope boundaries, all 4 DB tables and 7 API routes
metadata:
  type: project
---

# Project Memory

## MVP Goals
1. Organisations can sign up and create onboarding flows in a dashboard.
2. Each flow has versions; new publishes create a new flow_version row (append-only).
3. An embedded SDK (single JS file) fetches and renders the active flow version.
4. Basic analytics events (flow_started, step_viewed, flow_completed/dismissed) are recorded.

## Build Structure
Work is organized into **9 phases** (not days), each deliverable independently:
1. **Foundation** — Project setup, database, migrations
2. **Auth** — Signup, login, sessions with orgId
3. **CRUD API** — Flows endpoints (GET/POST/PUT/list)
4. **Publishing** — Publish endpoint, append-only flow_versions
5. **SDK** — Vanilla JS embed script, config serving with CORS
6. **Analytics** — Event tracking, dashboards, SDK install screen
7. **Polish** — Error handling, UX fixes
8. **Ship** — Full E2E testing, Vercel deployment
9. **Admin Dashboard** — Track signups, org analytics (post-launch visibility)

## POC Definition (done when all of these pass)
- [x] An org can sign up and log in
- [x] A flow can be created, edited, and published
- [x] The SDK renders a published flow on an external page
- [x] Analytics events appear in the dashboard
- [x] All 7 API routes return correct shapes under happy-path manual tests

**Verified 2026-06-28** via live E2E smoke test on production (https://onboardme-gules.vercel.app):
- Signup: Created `smoke-test-2026-06-28@example.com`, auto-redirected to dashboard ✅
- Flow CRUD: Created "Smoke Test Onboarding" (2 steps), published (Draft→Live) ✅
- SDK: Opened `/test.html`, loaded flow, modal rendered Step 1 of 2 → Next → Step 2 → Done ✅
- Analytics: Dashboard showed 3 events — `flow_started`, `step_viewed`, `flow_completed` ✅
- SDK config: `GET /api/sdk/[flowId]/config` returned `{id, name, version:1, config:[...]}` with CORS headers ✅
- Health endpoint: `GET /api/health` returns `{"status":"ok","db":"ok"}` ✅
- Vercel Analytics + Speed Insights: active and collecting ✅

Previous local verification: 2026-05-31 (local PostgreSQL).
Production database: Supabase project `yhrqsqugupsyywmpkikx` (us-east-1, pooler mode).
Note: Supabase free tier pauses after 7 days of inactivity — set up UptimeRobot on `/api/health` to prevent.

## Scope Boundaries (hard stops)
- No A/B testing
- No multi-user orgs (one owner per org for POC)
- No video/image uploads in flow steps
- No billing or payment flows
- No white-labelling

## DB Tables
- organisations — one per client account
- flows — container for versions, status draft/live/archived
- flow_versions — append-only, no UPDATE or DELETE
- analytics_events — simple event log

## API Routes (7 total)
- POST /api/auth/[...nextauth]
- GET/POST /api/flows
- GET/PUT /api/flows/[id]
- POST /api/flows/[id]/publish
- GET /api/sdk/flow (public, CORS required)
- POST /api/sdk/event (public, CORS required)
- GET /api/dashboard/analytics
