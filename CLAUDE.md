# OnboardMe — Build Instructions

No-code onboarding flow builder. Next.js + Supabase + Prisma + Vanilla JS SDK. 7-day schedule.

## Dev Commands
```bash
npm run dev                          # localhost:3000
npx prisma migrate dev --name <name> # create & apply migration
npx prisma studio                    # DB browser
npx tsc --noEmit                     # type-check
```

## Critical Rules (see decision.md for rationale)
1. **append-only**: flow_versions INSERT only, never UPDATE/DELETE
2. **CORS**: all /api/sdk/* routes must have Access-Control-Allow-Origin headers
3. **MVP only**: no features beyond the spec
4. **Schema-first**: edit schema.prisma → migrate → code
5. **Never run**: prisma migrate reset, prisma db push (PreToolUse hook blocks these)

## Before You Start
1. Read **memory/project.md** — scope, POC checklist, all 7 API routes
2. Read **memory/user.md** — how I like to work
3. Read **memory/feedback.md** — patterns that work, gotchas

## Documentation
- **docs/API.md** — Complete API reference (all 7 endpoints, request/response shapes, error codes)
- **docs/DATABASE.md** — Schema design, table relationships, multi-tenancy, append-only rationale
- **docs/plan.md** — 9-phase implementation roadmap with checklists
- **decision.md** — Architectural decisions (append-only, CORS, flat routes, etc.)

## Phase-Based Organization

Work is organized into 8 phases (not days). Each phase is independent:
1. Foundation (setup, database)
2. Auth (signup, login)
3. CRUD API (create, read, update flows)
4. Publishing (publish endpoint, append-only versions)
5. SDK (vanilla JS, config serving)
6. Analytics (event tracking, dashboards)
7. Polish (error handling, UX)
8. Ship (verification, deployment)

**Start a session**: Read **session-log.md** to find current phase. Read only THAT phase from docs/plan.md.

## When Building
| Task | Read This First |
|------|-----------------|
| Schema change | decision.md → .claude/skills/prisma-migration.md |
| API route | .claude/skills/build-api-route.md |
| SDK change | .claude/skills/sdk-change.md |
| Feature done | .claude/skills/verify-feature.md |

## Log Progress
Update **session-log.md** after each checkpoint. Append to Blockers if stuck.
