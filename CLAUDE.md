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

## Session Start Protocol
Run this at the start of every session — do not skip:

```bash
bash .claude/hooks/session-init.sh   # prints current phase, next task, test status
```

Then load context in this order:
1. Read **session-log.md** — find current phase and any open blockers
2. Read **memory/project.md** — scope, POC checklist, all 7 API routes
3. Read **memory/feedback.md** — patterns that work, gotchas to avoid
4. Read **memory/user.md** — communication style

Only read docs/plan.md and decision.md when you need them for a specific task.

## Skill Auto-Detection
Before building anything, check which skill applies:

| If the task involves... | Load this skill first |
|-------------------------|-----------------------|
| Any API route (GET/POST/PUT) | `.claude/skills/build-api-route.md` |
| `schema.prisma` or `migrate dev` | `.claude/skills/prisma-migration.md` |
| `sdk.js` or `/public/` | `.claude/skills/sdk-change.md` |
| Verifying a feature is done | `.claude/skills/verify-feature.md` |

Load the skill before writing any code. The skill is a checklist, not optional.

## When Building
| Task | Read This First |
|------|-----------------|
| Schema change | decision.md → .claude/skills/prisma-migration.md |
| API route | .claude/skills/build-api-route.md |
| SDK change | .claude/skills/sdk-change.md |
| Feature done | .claude/skills/verify-feature.md |

## Documentation
- **docs/API.md** — Complete API reference (all 7 endpoints, request/response shapes, error codes)
- **docs/DATABASE.md** — Schema design, table relationships, multi-tenancy, append-only rationale
- **docs/plan.md** — 9-phase implementation roadmap with checklists
- **decision.md** — Architectural decisions (append-only, CORS, flat routes, etc.)

## Phase-Based Organization

Work is organized into 9 phases (not days). Each phase is independent:
1. Foundation (setup, database)
2. Auth (signup, login)
3. CRUD API (create, read, update flows)
4. Publishing (publish endpoint, append-only versions)
5. SDK (vanilla JS, config serving)
6. Analytics (event tracking, dashboards)
7. Polish (error handling, UX)
8. Ship (verification, deployment)
9. Admin Dashboard (org visibility)

All 9 phases are complete. Read **session-log.md** to confirm before starting new work.

## Log Progress
Update **session-log.md** after each checkpoint. Append to Blockers if stuck.

## Deployment
- **Production**: https://onboardme-gules.vercel.app
- **Database**: Supabase project `yhrqsqugupsyywmpkikx` (us-east-1, pooler mode)
- **CI**: GitHub Actions — type-check + E2E on every push; nightly health check at 2am UTC
- **Staging**: set `STAGING_URL` as a GitHub repo variable to redirect CI tests away from production

## Sentry Error Tracking
Sentry is wired up but needs a DSN to activate. To complete setup:
1. Create a project at sentry.io (free tier)
2. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env vars (and `.env.local` for local dev)
3. Optionally add `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source map uploads
Sentry is a no-op when `NEXT_PUBLIC_SENTRY_DSN` is not set — the build always succeeds.
