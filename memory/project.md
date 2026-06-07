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

**Verified 2026-05-31** via comprehensive E2E verification:
- Signup: Created `poc-test-2026@example.com`, auto-logged in ✅
- Flow CRUD: Created "POC Test Flow", edited title/description, published (Draft→Live) ✅
- SDK: Opened test.html, loaded flow via SDK, modal rendered with correct step content ✅
- Analytics: Dashboard showed 2 events (flow_started, flow_completed) with correct user ID ✅
- API routes: Tested `/api/sdk/[flowId]/config` returned `{id, name, version, config}` with HTTP 200 and CORS headers ✅
- Bug fixed: Home page had onClick in server component → converted to "use client" ✅

Running on local PostgreSQL (localhost:5432/onboardme).

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
