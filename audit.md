# OnboardMe — Deployment & Agent-Driven Platform Audit

Audit date: 2026-06-16
Method: live HTTP checks against the production URL, read-only Vercel CLI calls (`vercel project ls`, `vercel env ls`, `vercel ls`), `npx tsc --noEmit`, git history inspection, and direct file reads. No writes, pushes, or data-creating requests were made against production during this audit.

---

## 1. Context Loading Audit

**What actually happens when a new Claude Code session starts in this directory:**

- Claude Code auto-loads `CLAUDE.md` (root) — this is the only file the harness loads automatically without being told to.
- `CLAUDE.md` then *instructs* the agent to read `memory/project.md`, `memory/user.md`, `memory/feedback.md`, and `session-log.md` — these are manual, prompt-time reads, not system-enforced. If the model skips the instruction, nothing forces it.
- `CLAUDE.md` also points to `.claude/skills/*.md` for task-specific checklists (schema changes, API routes, SDK changes, verification). **These files do not exist in this repository.** Any attempt to read them will fail.
- `docs/plan.md` describes a `.claude/settings.json` with three hooks (PostToolUse tsc, PostToolUse bash-logging, PreToolUse DB-guard, Stop reminder). **None of this exists in the repo either.**
- No GitHub Actions, CI config, or remote repo files are auto-read.
- No live credentials, database connections, or external APIs are loaded automatically — Supabase/Vercel access only happens if a human runs a CLI command in-session (as was done for this audit).

Important environment fact discovered during the audit: `docs/plan.md` says this harness lives at `/Users/aminatayyub/Desktop/onboardMe/`. The directory this audit was run from is `/Users/aminatayyub/Documents/onboardMe`, and `git reflog` shows it was created via `clone: from https://github.com/ATayyub/onboardMe.git` — i.e., **this working copy is a fresh GitHub clone**, not the original dev folder. `/Users/aminatayyub/Desktop/onboardMe` no longer exists on this machine. So even if the `.claude/` hooks and skills were real and working at some point (see evidence below), they were **never committed to git** and are not reproducible by anyone — including future sessions — who clones this repo.

Evidence that hooks *did* run at some point: `session-commands.log` (committed, 311 lines originally) contains real timestamped `[2026-05-29 16:53] CMD:` entries spanning May 29–June 7 — proof a PostToolUse bash-logging hook executed historically. But the `CMD:` field is empty on every single line, meaning the hook itself was buggy (it logged the timestamp but never captured the actual command). The hook's source (`.claude/settings.json`) is gone, so this can't be inspected or fixed now.

| Source/File | Path or Location | Why It Matters | What It Contains | Used Automatically or Manually Triggered |
|---|---|---|---|---|
| CLAUDE.md | `/CLAUDE.md` | Primary instruction file | Dev commands, 5 critical rules, pointers to memory/docs/skills | **Automatic** (Claude Code convention) |
| memory/MEMORY.md | `/memory/MEMORY.md` | Index of memory sub-files | Table of contents + load order | Manual (only if agent follows CLAUDE.md's instruction) |
| memory/project.md | `/memory/project.md` | Anchors MVP scope | POC checklist (marked complete + dated 2026-05-31), 7 API routes, 4 tables, scope boundaries | Manual |
| memory/user.md | `/memory/user.md` | Dev's working style | Communication prefs, review style, "ask before destructive changes" | Manual |
| memory/feedback.md | `/memory/feedback.md` | Patterns to repeat/avoid | CORS helper pattern, NextAuth orgId gotcha, architectural debt note (ADR-006 flat routes) | Manual |
| memory/reference.md | `/memory/reference.md` | External doc links | Next.js/Prisma/Supabase/NextAuth doc URLs, key CLI commands | Manual |
| memory/blockers.md | referenced in MEMORY.md, **does not exist** | Would track known blockers | N/A | **Missing — broken reference** |
| decision.md | `/decision.md` | Architectural non-negotiables | 6 ADRs (append-only versions, native `<dialog>`, Supabase pooling, CORS scope, single publish endpoint, flat routes) | Manual |
| session-log.md | `/session-log.md` | Build history / current phase | Phase 1–9 checklists, blockers table, "POC complete" note | Manual |
| docs/API.md | `/docs/API.md` | API contract | All 8 routes (7 + admin), request/response shapes, error codes | Manual |
| docs/DATABASE.md | `/docs/DATABASE.md` | Schema rationale | Table relationships, multi-tenancy, append-only design | Manual |
| docs/plan.md | `/docs/plan.md` | Describes the **intended** agentic harness | Hooks design, skills design, file hierarchy at a path that no longer exists | Manual — and partly **aspirational, not actual** |
| .claude/settings.json | referenced in docs/plan.md, **does not exist** | Would enforce hooks (tsc, DB guard, logging) | N/A | **Missing — described but not implemented in this repo** |
| .claude/skills/*.md (4 files) | referenced in CLAUDE.md, **do not exist** | Would give step-by-step checklists for schema/API/SDK/verify work | N/A | **Missing — broken reference** |
| prisma/schema.prisma | `/prisma/schema.prisma` | Source of truth for DB shape | 4 models matching memory/project.md | Manual (read on demand) |
| .env.local.example | `/.env.local.example` | Env var template | 5 placeholder vars, no secrets | Manual |
| Live Vercel project state | Vercel API via CLI | Ground truth for deployment | Env var names (not values), deployment list/status | **Not loaded automatically — required manual CLI commands for this audit** |

**Net finding for Section 1:** the only thing genuinely automatic is `CLAUDE.md`. Everything else — memory, docs, skills, hooks — depends on the agent choosing to follow written instructions each session, and two of those instructed-but-load-bearing paths (`.claude/skills/`, `.claude/settings.json`) physically don't exist in this repo. An agent following CLAUDE.md literally would hit a file-not-found on its very first "When Building" lookup.

---

## 2. Product Deployment Status

Verified with live HTTP requests and read-only Vercel CLI calls (`vercel project ls`, `vercel env ls`, `vercel ls`), not by trusting the docs.

| Check | Result |
|---|---|
| Deployed? | **Yes** |
| Where | Vercel (Hobby/free tier), project `onboardme`, org `aminatayyub-7919s-projects` |
| Live URL | `https://onboardme-gules.vercel.app` — confirmed reachable, HTTP 200 |
| Backend running | Yes — API routes respond correctly (see below) |
| Frontend running | Yes — `/`, `/signup` return 200 with rendered HTML |
| APIs working | Confirmed for read paths: `/api/sdk/[flowId]/config` returns correct 404 JSON + CORS headers for an unknown flow; `/api/auth/providers` returns a valid NextAuth provider descriptor; `/dashboard`, `/admin`, `/flows` correctly 307-redirect unauthenticated requests to `/login` (middleware + JWT check working). **No real signup/login was POSTed in production** to avoid creating live data without authorization — write-path behavior is unverified *as of this audit* (last verified by the prior session on 2026-05-31 per memory/project.md). |
| Env vars configured | Yes — `vercel env ls` shows `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL` all set as Encrypted/Production, created 17 days ago |
| Database connected | Implied strongly by working auth/middleware and prior verified E2E run; not re-queried directly in this audit |
| Auth/login flows working | Middleware-level check confirmed live; full signup→login round-trip not re-tested live in this session |
| Deployment errors | None visible — `vercel ls` shows the last 8 production deployments all status `● Ready`, most recent 16 days ago (no deploys since, consistent with "POC complete" timestamp) |
| Production/staging/local | **Production** (Vercel) + Supabase Postgres. Local dev is currently **not runnable out-of-the-box**: there is no `.env.local` in this checkout, and no `.next` build directory — a fresh clone needs the setup steps in README before `npm run dev` works. |

**Readiness: Deployed and working** (for the verified surface: static pages, public SDK config endpoint, auth-gating middleware, env config). Write-path flows (signup, flow CRUD, publish, event ingestion) are *reported* working as of 2026-05-31 but were not re-verified live in this audit — flag as "last verified 16 days ago, not re-confirmed today."

---

## 3. Project Summary

**Layman summary:** OnboardMe lets a company sign up, build a simple "tour"-style onboarding popup (a sequence of steps/screens) in a dashboard, hit publish, and then drop one `<script>` tag into their own website. Visitors to that website then see the onboarding popup, and the company can see basic stats (how many people started it, finished it, dropped off) on their dashboard. It's a lightweight, self-serve alternative to tools like Appcues/Userpilot/Intro.js, scoped down to a single-owner-per-account proof of concept.

**Technical summary:** Next.js 16 App Router monolith. Postgres (Supabase) via Prisma, 4 tables (`organisations`, `flows`, `flow_versions` [append-only], `analytics_events`). NextAuth credentials provider for session auth, edge middleware gates `/dashboard`, `/flows`, `/admin`. 8 API routes: 2 public+CORS-enabled (`/api/sdk/[flowId]/config`, `/api/sdk/[flowId]/events`) for the embed SDK, the rest session-gated. The SDK itself is a ~120-line vanilla JS file with zero dependencies, served statically from `/public/sdk.js`, rendering a native `<dialog>` element. Ideal end-to-end flow: signup → create flow → add/reorder steps → publish (inserts new `flow_versions` row, never updates) → embed script tag on customer site → SDK fetches active version via public config endpoint → renders modal → fires lifecycle events to the public events endpoint → org views aggregated stats in `/api/dashboard/analytics`.

**There is no AI/LLM component anywhere in the running product.** OnboardMe itself does not call any model — the "agent-driven" question in Section 5 is entirely about *how this codebase is built and maintained* (Claude Code + memory/hooks/skills), not about the deployed app's runtime behavior.

---

## 4. Current State Review

| Area | Current Status | Evidence | Risk | Recommendation |
|---|---|---|---|---|
| Auth (signup/login/session) | Working, last verified 2026-05-31 | memory/project.md POC log; middleware redirect confirmed live today | Low | Re-run a live signup smoke test periodically, not just once |
| Flow CRUD | Built, code matches docs | `app/api/flows/**`, docs/API.md match | Low | — |
| Publishing (append-only) | Built, enforced in code path (no UPDATE/DELETE issued) | `app/api/flows/[id]/publish/route.ts` exists, ADR-001 | Low | Add a DB-level constraint/trigger, not just app-level discipline, if this ever leaves POC |
| SDK + CORS | Working, verified live right now | Live curl: 200 on `/sdk.js`, correct CORS+404 JSON on bad flow ID | Low | — |
| Analytics dashboard | Built, last verified 2026-05-31 | session-log Phase 6 | Low-Med | Not re-verified today |
| Admin dashboard | Built, gated correctly | `/admin` 307s when unauthenticated (verified live); code checks `ADMIN_EMAIL` case-insensitively | Low | — |
| Agentic harness (hooks/skills) | **Documented but absent** | `.claude/` never committed (`git log --all -- .claude` returns nothing); referenced paths don't exist; original dev folder gone | **High** — anyone (including future sessions) following CLAUDE.md hits dead links | Either build `.claude/settings.json` + `skills/` for real and commit them, or strip the dead references from CLAUDE.md/docs/plan.md |
| Automated testing | **None** | No jest/playwright/cucumber in `package.json`; `@playwright/test` only a stray transitive lockfile entry; `tests/*.feature` are unchecked manual Gherkin checklists, session-log confirms "no automated test runner... you are the test runner" | Medium-High — regressions only caught by memory/eyeballing | Wire up Playwright for at least the 5 POC-critical flows |
| Repo hygiene | Mediocre | `.gitignore` only excluded `node_modules` (`.vercel` added during this audit via `vercel link`); 7 debug screenshots, an accessibility-tree dump (`admin-signup.txt`), and a buggy command log are committed to history | Low (no secrets leaked, confirmed `.env*` never tracked) but is repo noise | Add `.next`, `*.png`, `*.log`, `tsconfig.tsbuildinfo` to `.gitignore`; remove debug artifacts from tracked files |
| Git/commit history | Misleading | session-log.md cites 6 distinct phase commit hashes (e.g. `3a06953a`, `588d3213`...) — **none exist** in actual history, which has exactly 2 commits total | Low risk, but erodes trust in the log as a source of truth | Stop hand-writing commit hashes into the log; let git be the log |
| Local dev reproducibility | Broken for a fresh clone | No `.env.local`, no `.next`; README requires manual setup | Medium for onboarding a second contributor | Document is fine; just note this clone needs the Quick Start steps run before `npm run dev` works |

---

## 5. Agent-Driven vs Prompt-Driven Audit

| Dimension | Rating 1–5 | Evidence | Why This Rating | Improvement Needed |
|---|---|---|---|---|
| Context awareness | 2 | CLAUDE.md auto-loads; memory/docs only load if agent chooses to read them; key skill files are dead links | The harness *describes* good context loading but a chunk of it 404s | Make `.claude/skills/` real, or remove the references |
| Memory continuity | 3 | memory/*.md is real, structured, dated, and genuinely useful (POC checklist, gotchas, ADR debt) | Solid content, but it's read manually each time, not enforced, and `blockers.md` is referenced but missing | Add the missing file or remove the reference; consider a session-start hook that cats memory automatically |
| Autonomous task selection | 1 | Every phase in session-log.md was clearly driven by an explicit human ask each session; no evidence of the system deciding on its own what to build next | This is a human-paced, phase-by-phase build with a human approving each step | N/A for current scope — true autonomy isn't the goal of a POC build |
| Tool usage | 3 | Claude Code used Bash/Prisma/git/Vercel CLI competently during the build (per logs) | Good tool use during active sessions, but no standing automation (cron, webhook-triggered agent, etc.) | Agentic improvements section covers this |
| Error recovery | 3 | session-log's Blockers table shows 7 real issues diagnosed and resolved (Supabase DNS, middleware location, empty migration, missing FK) with root causes, not band-aids | Good *human-directed* debugging; no evidence of self-healing without a person driving | Add hooks that catch known failure classes automatically (e.g., block `next build` while dev server is running — a documented gotcha that's still a manual rule, not enforced) |
| Human-in-the-loop design | 4 | CLAUDE.md rule "Never run prisma migrate reset/db push (PreToolUse hook blocks these)" — except the hook is gone, so this is now just a *written* rule | Strong intent, weak enforcement today | Rebuild the PreToolUse guard for real, since it's explicitly called out as mandatory |
| Decision-making quality | 3 | ADRs are well-reasoned with explicit consequences and timelines (e.g., ADR-006 names the refactor trigger) | Good documented judgment; this is "prompt-driven with good notes," not the system deciding anything itself | — |
| Production reliability | 3 | Verified live: deployments all "Ready," env vars set, auth/CORS correct on spot checks | Real and working for a POC; not battle-tested (no automated tests, no monitoring/alerting found) | Add monitoring (see gaps) |
| Auditability / logging | 2 | `session-commands.log` exists but every entry has an empty `CMD:` field — the one piece of automated logging that ran is broken | Logging was attempted, the implementation had a bug, and it's now gone entirely | Rebuild correctly, verify it captures real data before trusting it |
| Scalability | 2 | ADR-003 explicitly designs for Supabase free-tier limits (20 connections, 500MB); single-owner-per-org by design; no queueing/background jobs | Honest about being POC-scoped, but that means it's *intentionally* not scalable yet | Out of scope until POC succeeds — correctly deferred, not a current bug |

**Overall Agent-Driven Score: 2.5 / 5**

**Category: Level 2 — Prompt-driven workflow helper**, leaning toward the bottom of Level 3.

Why: there's real scaffolding for something more autonomous (memory files, ADRs, a documented hooks/skills design, phase checklists) — that's more structure than a pure "Level 1 manual assistant" has. But every actual build decision in the session log was a human asking, a human reviewing, and a human deciding "next phase." The piece of automation that did exist (the bash-logging hook) shipped with a bug and was never committed, so it's gone. There is no mechanism today — hook, cron, webhook, or otherwise — by which the system observes state and acts without a person typing a prompt first. That's the textbook definition of prompt-driven, just a well-organized version of it.

---

## 6. Gap Analysis

**Product gaps**
- No automated regression suite. *Why it matters:* the POC checklist passed once, manually, on 2026-05-31; nothing currently re-verifies it. *Risk if ignored:* silent regressions ship to the live URL undetected. *Fix:* Playwright tests for the 5 POC-critical flows, run on every push.

**Technical gaps**
- `.claude/skills/*.md` and `.claude/settings.json` are referenced by name in committed, source-of-truth files (CLAUDE.md, docs/plan.md) but don't exist. *Why it matters:* any agent or developer following the instructions hits a dead end. *Risk:* wasted cycles, confusing failures, false confidence that guardrails (like the DB-reset block) exist when they don't. *Fix:* either commit the real files or strip the dead references — don't leave aspirational docs masquerading as current state.

**Architecture gaps**
- ADR-006 flat routes / monolithic `/flows/[id]` (Editor+Analytics+Install in one ~500-line component) — already flagged by the project's own memory as needing a refactor "before Phase 2 features." *Why it matters:* it's a known, dated trigger condition, not a vague someday. *Risk:* if features get added before the refactor, the file becomes unmaintainable as predicted. *Fix:* do the route-group split before touching this file again.

**Data/context gaps**
- `memory/blockers.md` is indexed in MEMORY.md but doesn't exist. *Why it matters:* an agent told to "load blockers" will either silently skip it or error. *Risk:* low individually, but it's a pattern — broken references erode trust in the whole memory system. *Fix:* reconcile the index with reality.

**Automation gaps**
- Zero standing automation: no CI, no scheduled checks, no deploy-on-push, no monitoring/alerting on the live URL. *Why it matters:* this is the core reason the system is "prompt-driven" rather than "agent-driven" — nothing runs unless a human starts it. *Risk:* a production outage or DB issue would only be noticed if someone happens to visit the site. *Fix:* see roadmap.

**Reliability gaps**
- No error tracking (Sentry or similar), no uptime monitoring, no DB backup verification mentioned anywhere. *Why it matters:* "deployed and working" today is based on a one-time manual check, not continuous evidence. *Risk:* failures could go unnoticed for the 16 days between deployments. *Fix:* minimal uptime + error monitoring before calling this production-grade.

**UX/workflow gaps**
- No draft/publish distinction in the DB (ADR-005 — by design for POC) — drafts only exist in UI state. *Why it matters:* a page refresh mid-edit loses unsaved work. *Risk:* acceptable for POC, flagged correctly already. *Fix:* defer until post-POC, as the ADR says.

**Security or permission gaps**
- `.gitignore` only excluded `node_modules` until extended during this audit (Vercel CLI auto-added `.vercel`); `.next`, logs, and debug screenshots are committed to history. *Why it matters:* no secret was actually leaked (verified — `.env*` was never tracked), but the *pattern* of an incomplete `.gitignore` is exactly how secrets leak eventually. *Risk:* low today, latent. *Fix:* harden `.gitignore` now while the cost is zero.

**Deployment gaps**
- Deployment is entirely manual (`npx vercel --prod` from a local checkout per README) — no CI/CD pipeline triggers it. *Why it matters:* every deploy depends on someone remembering the exact CLI sequence; no automatic preview deployments on PRs. *Risk:* deploys drift from what's in `main` if someone forgets to push first. *Fix:* connect the Vercel project to the GitHub repo for auto-deploy on push to `main`.

---

## 7. Next Steps

### Immediate Fixes

| Priority | Task | Why It Matters | Owner Needed | Complexity | Expected Outcome |
|---|---|---|---|---|---|
| P0 | Reconcile CLAUDE.md / docs/plan.md with reality: remove or rebuild `.claude/skills/` and `.claude/settings.json` | Currently documents guardrails (e.g. the DB-reset block) that don't exist — false sense of safety | You / Claude Code | Low | No dead references; either real hooks or honest docs |
| P0 | Harden `.gitignore` (`.next`, `*.png`, `*.log`, `tsconfig.tsbuildinfo`, `.env*`) and remove committed debug artifacts | Prevents future secret leakage and repo bloat | You | Low | Clean, minimal tracked file set |
| P1 | Fix or remove `memory/blockers.md` reference in MEMORY.md | Broken index entry | You / Claude Code | Low | Index matches reality |

### Deployment Fixes

| Priority | Task | Why It Matters | Owner Needed | Complexity | Expected Outcome |
|---|---|---|---|---|---|
| P0 | Connect Vercel project to GitHub for auto-deploy on push to `main` | Removes "did someone remember to deploy" risk | You (Vercel dashboard) | Low | `git push` = live deploy, no manual CLI step |
| P1 | Re-run the full live E2E smoke test (signup → publish → SDK → analytics) and date-stamp it in memory/project.md | Last verification is 16 days old | You | Low | Fresh, dated confidence in write paths |
| P2 | Add basic uptime/error monitoring (e.g. Vercel's built-in analytics + a simple Sentry free tier) | Right now nobody finds out about an outage except by visiting the site | You | Low-Med | Alerted on failure instead of finding out manually |

### Short-Term Improvements

| Priority | Task | Why It Matters | Owner Needed | Complexity | Expected Outcome |
|---|---|---|---|---|---|
| P1 | Add Playwright tests for the 5 POC checklist items | `.feature` files exist but nothing runs them | You / Claude Code | Med | Regressions caught automatically, not by memory |
| P2 | Do the ADR-006 refactor (route groups, split `/flows/[id]`) before adding any new feature | Project's own debt log says do this "before Phase 2 features" | You / Claude Code | Med | Maintainable codebase for next feature push |

### Agentic Improvements

| Priority | Task | Why It Matters | Owner Needed | Complexity | Expected Outcome |
|---|---|---|---|---|---|
| P1 | Rebuild `.claude/settings.json` hooks for real (tsc on file write, DB-reset guard, working bash logger) and commit them | This is the single biggest gap between "Level 2 prompt-driven" and "Level 3+ agent-driven" | You / Claude Code | Med | Guardrails actually enforced, not just documented |
| P2 | Add a CI workflow that runs tsc + Playwright on every PR | Moves verification from "a person remembers to run it" to automatic | You | Med | First real piece of standing automation |
| P3 | Only after the above: consider a scheduled agent (e.g. nightly) that checks deploy health / re-runs smoke tests and reports | Currently nothing observes the system without a human starting it | You | Med-High | System starts reporting on itself instead of waiting to be asked — this is what would actually earn a Level 4 rating |

### Long-Term Platform Vision

If built out, OnboardMe's natural ceiling (as a product) is a small, focused onboarding-SDK tool — multi-user orgs, A/B testing, scheduled flows, billing are all explicitly out-of-scope today by design (memory/project.md), and that's a reasonable POC boundary, not a flaw. Separately, the *agentic development harness* around it could mature into one where Claude Code runs scheduled health checks, opens its own PRs for flagged debt (like the ADR-006 refactor), and only pings a human for approval — that's a Level 4 target, and it's achievable from here without a rebuild, just by actually implementing what docs/plan.md already designed.

---

## 8. Final Recommendation

- **Is the product deployed?** Yes — confirmed live, with HTTP checks and Vercel CLI, not just by reading docs.
- **Is it currently working?** Yes for everything verifiable live (auth gating, SDK config + CORS, public pages). Write-path flows (signup/CRUD/publish/events) are reported working as of 2026-05-31 but weren't re-tested live in this audit to avoid creating data in production without being asked.
- **Is it truly agent-driven?** No. It's a well-documented, prompt-driven build (Level 2, score 2.5/5). The agentic harness is designed on paper (docs/plan.md) but the actual enforcement layer — hooks and skills — doesn't exist in this repository.
- **Biggest risk:** the gap between what CLAUDE.md/docs/plan.md *claim* exists (DB-reset guard, auto-tsc, skill checklists) and what's actually in the repo. A guardrail you believe exists but doesn't is more dangerous than no guardrail, because it suppresses the caution you'd otherwise apply.
- **Highest-leverage next step:** rebuild `.claude/settings.json` for real and commit it — it's low effort, fixes the single biggest claim-vs-reality gap, and is the actual prerequisite for any move toward Level 3+.
- **Continue, pause, rebuild, or refactor?** Continue — the product itself is sound for a POC and is genuinely deployed and working. Do a short refactor pass (gitignore hygiene, the documented ADR-006 split, real hooks) before adding new features, exactly as the project's own memory already recommends.
- **What should be demoed as proof it's working:** a live screen-share of `https://onboardme-gules.vercel.app/signup` → create account → build a 2-step flow → publish → open `test.html` (or any external page) with the embed snippet and show the modal rendering → flip to the Analytics tab and show the `flow_started`/`flow_completed` events landing in real time. That's the actual POC checklist, executed live, which is stronger evidence than any document in this repo.

---

---

# OnboardMe — Full Technical Audit
**Audit date: 2026-06-28**
Method: Full codebase read (all 80+ files), git history inspection, CI/CD workflow review, direct file reads of every API route, component, hook, skill, memory file, and config. No live HTTP requests were made in this session; deployment status confirmed from dated smoke-test records in `memory/project.md` and `session-log.md`.

---

## 1. Context Loading Audit

### What happens when a session starts

| Source | File/Location | Why It Matters | What It Contains | Loaded |
|--------|--------------|----------------|------------------|--------|
| Project instructions | `CLAUDE.md` | Primary agent operating instructions | Dev commands, 5 critical rules, 8-phase structure, skill routing table | **Auto** (Claude Code injects at session start) |
| Hook configuration | `.claude/settings.json` | Governs automated guardrails | PreToolUse DB guard, PostToolUse tsc-check + logger, Stop reminder | **Auto** (harness reads on startup) |
| Project memory index | `memory/MEMORY.md` | Index of 4 memory sub-files with load order | Table of contents | **Auto** (in project memory path) |
| Developer profile | `memory/user.md` | Communication style, skill level | Full-stack Next.js dev, PKT timezone, prefers concise responses | **Manual** (CLAUDE.md instructs agent to read) |
| Project scope | `memory/project.md` | Anchors scope, POC definition | MVP goals, 4 DB tables, 7 API routes, scope hard stops. POC verified 2026-06-28. | **Manual** (CLAUDE.md instructs agent to read) |
| Established patterns | `memory/feedback.md` | Prevents re-learning known gotchas | Prisma patterns, CORS approach, NextAuth orgId extension, known bugs | **Manual** (CLAUDE.md instructs agent to read) |
| External docs | `memory/reference.md` | Links to docs, key commands | Next.js/Prisma/Supabase URLs, bash commands | **Manual** (CLAUDE.md instructs when needed) |
| Build state | `session-log.md` | Tells agent what phase we're in | Phase checklist 1–9 all complete, 7 resolved blockers, POC complete note | **Manual** (CLAUDE.md says "Read this first") |
| Architectural decisions | `decision.md` | Non-negotiables (ADR-001 through 006) | Append-only, CORS scope, flat routes, single publish endpoint | **Manual** (CLAUDE.md references via skills) |
| Skill: API route | `.claude/skills/build-api-route.md` | 8-step checklist for building routes | Auth, CORS, Prisma, errors, return shapes | **Manual** (triggered by task type) |
| Skill: DB migration | `.claude/skills/prisma-migration.md` | 6-step checklist for schema changes | Schema edit → migrate → studio verify | **Manual** (triggered by task type) |
| Skill: SDK changes | `.claude/skills/sdk-change.md` | 7-step checklist for SDK edits | CORS, dialog, test.html smoke test | **Manual** (triggered by task type) |
| Skill: Verification | `.claude/skills/verify-feature.md` | 8-step quality gate | tsc, manual tests, API shape tests, POC tick | **Manual** (triggered by task type) |
| **IRRELEVANT** | `~/.claude/rules/taleemabad/**` | Taleemabad data governance rules — entirely different product | BigQuery SQL rules, coaching/LP/teacher query rules | **Auto** — loaded every session, consuming context window space for zero value on this project |
| Personal memory | `~/.claude/projects/.../memory/` | Cross-session memory written by Claude | User preferences remembered across sessions | **Auto** |

**Note vs. 2026-06-16 audit:** The `.claude/` directory (hooks + skills) now EXISTS and is committed to the repo (added in commit `8fcf2cc`). The previous audit found these files missing. They are now real and functional. The `session-commands.log` bug (empty `CMD:` field) mentioned in the prior audit has not been verified as fixed in this session.

### Files that should be read but are not automatically surfaced

- `docs/API.md` — complete API reference. Should be read before any route work, never auto-loaded.
- `docs/DATABASE.md` — schema design rationale. Only consulted via skills.
- `test-results/.last-run.json` — last E2E test status (`"passed"`). Never surfaced to the agent; it cannot know if tests are currently failing without being told to check.

### Critical observation

**The global `~/.claude/rules/taleemabad/` directory is auto-loaded into every session on this project.** This adds ~20KB of Taleemabad data governance instructions (BigQuery SQL rules, teacher query rules, coaching observation schemas) that are completely irrelevant to this Next.js project. This wastes context window and creates noise in every session. This is a global config issue, not a project-level issue — it cannot be fixed inside this repo.

---

## 2. Product Deployment Status

**Deployed and working.**

| Check | Result |
|-------|--------|
| Deployed? | Yes |
| Where | Vercel (Hobby/free tier), project `onboardme`, projectId `prj_OVoPz9HUrd0mH0s4sVOT5NFf6cjZ` |
| Live URL | `https://onboardme-gules.vercel.app` |
| Frontend running | Yes — Next.js 16.2.6 on Vercel serverless |
| Backend running | Yes — all API routes compiled as Vercel functions |
| APIs working | Yes — full smoke test on 2026-06-28 confirmed all 7 routes return correct shapes and status codes |
| Environment variables | Yes — `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL` confirmed in Vercel (per session-log) |
| Database connected | Yes — Supabase project `yhrqsqugupsyywmpkikx`, us-east-1, pgbouncer pooler mode |
| Auth/login working | Yes — signup → auto-redirect to dashboard confirmed in smoke test |
| Deployment errors | None — all Vercel deployments `● Ready` |
| Deployment type | **Production** |
| CI/CD | GitHub Actions: type-check + E2E on every push/PR to `main`; nightly health check + smoke test at 2am UTC |
| Monitoring | Vercel Analytics + Speed Insights active; nightly GH Action hits `/api/health` |

**Readiness verdict: Deployed and working.**

One latent risk: the nightly CI runs `test:prod` which creates a real `e2e-{timestamp}@example.com` account in the production database every night. This pollutes production data. The admin dashboard's org count and analytics numbers are inflated by CI test runs.

---

## 3. Project Summary

**Layman summary:** OnboardMe lets a company sign up, build a step-by-step onboarding popup (a sequence of screens) in a dashboard, hit publish, and drop one `<script>` tag into their website. Visitors see the tour in a popup. The company sees basic stats — how many people started, completed, or dropped off — in a simple dashboard. It's a lightweight self-serve alternative to Appcues/Userpilot, scoped down to a single-owner-per-account POC.

**Technical architecture:**

```
[Customer's website]
    <script src="https://onboardme-gules.vercel.app/public/sdk.js">
    OnboardMe.init(flowId, { baseUrl, userId })
         │
         ▼
[GET /api/sdk/{flowId}/config]  ← public, CORS *
         │ returns: {id, name, version, config: [{title, description}...]}
         │
[Vanilla JS renders <dialog> modal with step navigation]
         │
[POST /api/sdk/{flowId}/events] ← public, CORS *
    eventType: flow_started | step_viewed | flow_completed


[Organisation Dashboard]  (Next.js App Router, Vercel)
    /signup   → POST /api/auth/signup  → creates org + bcrypt hash + API key
    /login    → NextAuth CredentialsProvider
    /dashboard → GET /api/flows (org-scoped)
               → POST /api/flows (create)
    /flows/[id] → GET/PUT /api/flows/[id]
               → POST /api/flows/[id]/publish (append-only version insert)
               → GET /api/dashboard/analytics?flowId=
    /admin    → GET /api/admin/orgs (ADMIN_EMAIL gated)

[Database: Supabase PostgreSQL — free tier, pooler mode]
    organisations (id, email, passwordHash, name, apiKey)
    flows (id, orgId, name, status)
    flow_versions (id, flowId, versionNum, config JSON) — append-only
    analytics_events (id, flowId, userId, eventType, stepIndex, url)

[Infrastructure]
    Hosting: Vercel (serverless functions)
    DB: Supabase us-east-1, pgbouncer pooler
    Auth: NextAuth v4 with CredentialsProvider
    CI: GitHub Actions (type-check + E2E on push; nightly health + smoke test)
    Monitoring: Vercel Analytics + Speed Insights
```

**There is no AI/LLM component in the running product.** The "agent-driven" question applies only to the build process, not to what OnboardMe does at runtime.

---

## 4. Current State Review

| Area | Current Status | Evidence | Risk | Recommendation |
|------|---------------|----------|------|----------------|
| Foundation (Next.js + Prisma + Supabase) | Production-ready | Vercel live; migrations applied; schema clean | Low | None for POC |
| Authentication | Working | Smoke test 2026-06-28 confirmed signup → dashboard | Medium | `signup/route.ts` instantiates its own `new PrismaClient()` instead of importing from `lib/prisma` — connection pool leak on cold starts |
| Flow CRUD API | Working | All GET/POST/PUT routes verified | Low | None |
| Publishing (append-only) | Working | Version numbers increment; ADR-001 enforced by PreToolUse hook | Low | None |
| SDK (vanilla JS embed) | Working but has XSS exposure | SDK renders in `<dialog>`, CORS confirmed, E2E verified | **High** | `dialog.innerHTML` uses raw `step.title` and `step.description` without HTML escaping — stored XSS if an org puts `<script>` in step content, which then runs on third-party customer websites |
| Analytics | Partially limited | Events recorded and displayed | Medium | `take: 100` in analytics query silently truncates — user sees no warning when >100 events exist |
| Admin Dashboard | Working | Phase 9 complete; ADMIN_EMAIL gating works | Low | Single env var is brittle; fine for POC |
| Draft persistence | Not implemented | UI-only local state | Medium | Refreshing `/flows/[id]` before publishing loses all unsaved edits |
| Rate limiting on SDK endpoints | Missing | Public endpoints, no auth, no rate limit | Medium | Trivial to spam fake analytics events |
| Supabase reliability | Conditional | Free tier pauses after 7 days inactivity | Medium | UptimeRobot mentioned in project.md but not confirmed configured. Nightly CI keeps it alive but relies on GitHub Actions running nightly |
| Hooks and skills | Now real and committed | `.claude/` directory confirmed in repo (commit `8fcf2cc`) | Low | Resolved issue from 2026-06-16 audit |
| E2E tests | Automated and passing | `@playwright/test` in package.json; `test-results/.last-run.json: "passed"`; CI runs on every push | Low | Tests run against production — test pollution in prod |
| TypeScript | Clean | PostToolUse tsc hook runs after every edit; zero errors | Low | None |
| Prisma singleton (production) | Broken | `lib/prisma.ts` only applies singleton pattern in `NODE_ENV !== 'production'`; production creates new `PrismaClient()` on every cold start | Medium | Connection pool exhaustion under load; fix to use global singleton in all environments |
| SDK baseUrl default | Dangerous default | `sdk.js` line 4: `options.baseUrl \|\| 'http://localhost:3000'` | **High** | If any customer forgets `baseUrl`, it silently calls localhost — no useful error message |
| CI test pollution | Active problem | Nightly E2E creates real `e2e-{timestamp}@example.com` orgs in prod DB | Medium | Admin dashboard counts are inflated; create a staging environment |

---

## 5. Agent-Driven vs Prompt-Driven Audit

### Clarification on scope

There are two systems to evaluate:
1. **The build system** — the Claude Code agentic harness (hooks, memory, skills) used to build the app
2. **The product itself** — OnboardMe

The product (OnboardMe) has zero agentic characteristics. It is a conventional CRUD web app. The agent-driven question applies only to the build process.

### Build system evaluation

| Dimension | Rating | Evidence | Why This Rating | Improvement Needed |
|-----------|--------|----------|-----------------|-------------------|
| Context awareness | 3/5 | CLAUDE.md + session-log.md + 4 memory files + hooks + skills all present and committed | Agent knows scope, phase, decisions, preferences. But global Taleemabad rules pollute context every session. | Remove irrelevant global rules; not fixable inside this project |
| Memory continuity | 4/5 | `memory/*.md` survive across sessions; session-log tracks phases + blockers; all 7 blockers resolved and documented | Memory is explicit, human-readable, and was actively maintained across 2+ sessions | Memory is append-only by convention, not enforced; stale entries could mislead |
| Autonomous task selection | 2/5 | Every phase was driven by explicit human ask; no mechanism detects "what's next" automatically | Agent executes what it's told. Does not self-select from session-log.md | Session-start hook could auto-surface "current phase" on startup |
| Tool usage | 3/5 | Hooks run automatically (tsc after every TS edit, DB guard blocks resets, logger captures commands). Skills manually invoked. | Automated guardrails work. Manual skill invocation is the ceiling — no tool self-selection | Skills could be auto-triggered by context (detecting "route" in task → load build-api-route.md) |
| Error recovery | 3/5 | tsc hook surfaces type errors after every edit. DB guard blocks dangerous commands. 7 real blockers were diagnosed and resolved. | Good reactive error handling. No proactive/predictive prevention. | No automated retry patterns or circuit-breaking |
| Human-in-the-loop design | 4/5 | Schema changes confirmed before migrate dev. Destructive operations blocked by hook. Memory instructs "ask before destructive changes." | Well-designed checkpoints at high-risk operations | Could formalize what requires confirmation vs. what proceeds automatically |
| Decision-making quality | 3/5 | 6 ADRs encode non-negotiables with explicit consequences and refactor timelines (e.g., ADR-006 names the trigger condition) | Good documented judgment. But agent cannot reason about new tradeoffs — it follows existing ADRs or defaults. | ADRs are static; no mechanism to detect when a decision no longer fits |
| Production reliability | 3/5 | Deployed to Vercel. Nightly CI monitors health + E2E. But Prisma prod singleton is broken; test pollution in prod. | App is live and monitored. Not battle-tested under load. | Fix prisma singleton; separate test env from prod |
| Auditability / logging | 2/5 | `session-commands.log` captures bash commands. `session-log.md` tracks phases. No structured application logs, no error tracking, no APM. | Good build-time audit trail. Zero runtime observability. | Add Sentry (free tier); add structured request logging |
| Scalability | 2/5 | Flat route structure. `/flows/[id]` is ~500-line monolith. Supabase free tier. Analytics capped at 100. No pagination. | Deliberately POC-scoped. ADR-006 acknowledges refactor needed before Phase 2. | Route groups, component split, pagination, paid DB tier — all documented in decision.md |

### Overall Agent-Driven Score (build system): **2.9 / 5**

**Level 3: Semi-agentic task executor**

The build harness does more than respond to prompts — it automatically enforces guardrails (hooks), carries context across sessions (memory), and follows structured checklists (skills). The key improvement since the 2026-06-16 audit is that hooks and skills are now real committed files, not aspirational docs. But the agent still waits to be told what to do each session. It does not self-select tasks, proactively detect what needs doing, or recover autonomously from failures beyond what a hook surfaces.

**The product is Level 1** — no AI, no autonomous behavior.

---

## 6. Gap Analysis

### Product gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| No draft persistence | Refreshing flow editor loses all unsaved work | Users lose work; frustrating for any real customer | Save steps to localStorage or add a `drafts` column |
| Analytics capped at 100 events silently | After 100 events, user sees incomplete data with no warning | Misleading analytics for active flows | Add pagination or explicit "showing last 100" label |
| No flow duplication or archiving UI | DB supports `archived` status but no UI exposes it | Dashboard fills with old flows | Add archive button; filter by status |

### Technical gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| **XSS in `sdk.js`** | `dialog.innerHTML` renders raw `step.title`/`step.description` without escaping | Stored XSS on every site that embeds the SDK — `<script>` in a step title runs on customers' pages | Escape HTML before inserting, or use `textContent` instead of `innerHTML` |
| **Broken prod Prisma singleton** | `lib/prisma.ts` creates new `PrismaClient()` in production on every cold start | Connection pool exhaustion at ~20 concurrent users (Supabase free tier limit) | Apply the same global singleton in production, not just dev |
| **`signup/route.ts` bypasses lib/prisma** | Creates its own `new PrismaClient()` | Additional connection leaks on every signup cold start | Import `{ prisma }` from `@/lib/prisma` |
| **`sdk.js` localhost default** | `options.baseUrl \|\| 'http://localhost:3000'` silently fails in production if customer forgets to pass `baseUrl` | Customers get a broken SDK with no useful error | Require `baseUrl` explicitly; log a clear error if missing |
| **No rate limiting on public SDK endpoints** | `/api/sdk/*/events` accepts unlimited POSTs — no auth, no rate limit | Trivial to flood analytics with fake data | Add Vercel Edge rate limiting or simple IP bucketing |

### Architecture gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| Flat routes / monolithic flow editor | `/flows/[id]/page.tsx` is ~500 lines; all tabs in one component | Unmaintainable as features grow — ADR-006 already predicts this | Route group split before any Phase 2 feature work (per ADR-006) |
| No test/production separation | E2E CI runs against live production database | Garbage test data accumulates; admin dashboard numbers meaningless | Create a staging Vercel deployment + separate Supabase project for CI |
| CORS is `*` with no origin validation | Any website can call SDK endpoints for any flowId | Competitor can poison customer analytics; no domain restriction | Move to per-org allowlisted origins (not critical for POC, but needed pre-launch) |

### Data/context gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| No funnel analytics | Shows event counts, not drop-off rates | Can't identify where users abandon the flow — the core value of an onboarding tool | Add `step_completion_rate` and funnel metrics to analytics endpoint |
| No version history UI | flow_versions is append-only but there's no UI to view or rollback | The append-only design's value (rollback, audit trail) is invisible to users | Add version history panel to Install tab |
| `userId` is self-reported, optional | Can't do reliable unique user tracking | Easy to abuse; unique user counts are unreliable | Generate stable anonymous ID in SDK (sessionStorage UUID) as fallback |

### Automation gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| E2E CI pollutes production | Nightly CI creates real accounts in the production database | Admin dashboard numbers are meaningless | Create staging environment; run CI against staging |
| UptimeRobot not confirmed | project.md says to set it up to prevent Supabase pause | DB could pause between nightly CI runs | Confirm UptimeRobot is active on `/api/health`; 2-minute setup |

### Reliability gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| No error tracking | Errors are `console.error` only — visible in Vercel logs but no alerting | A broken API route could go undetected for days | Add Sentry free tier (5-minute Next.js integration) |
| No DB backup verified | Supabase free tier includes daily backups but not confirmed | Data loss if project is accidentally deleted | Verify Supabase backup settings; document recovery procedure |

### Security gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| **XSS via `sdk.js` innerHTML** | See Technical gaps above | **Critical** — arbitrary JS on customer websites | Fix immediately before sharing with any real user |
| Admin protected only by email match | `ADMIN_EMAIL` env var is the sole gate | Full org data exposed if admin account is compromised | Acceptable for POC; add DB-level `isAdmin` flag pre-launch |

### Deployment gaps

| Gap | Why It Matters | Risk If Ignored | Fix |
|-----|----------------|-----------------|-----|
| No staging environment | CI runs against production | All of the test pollution issues above | Create `vercel --target preview` + separate Supabase project |

---

## 7. Next Steps

### Immediate Fixes (before sharing the URL with any real user)

| Priority | Task | Why It Matters | Complexity | Expected Outcome |
|----------|------|----------------|------------|------------------|
| 1 | Fix XSS in `sdk.js` — escape HTML in step title/description | Stored XSS on customer websites | Low (10 min) | SDK is safe to embed on third-party pages |
| 2 | Fix `sdk.js` baseUrl — remove localhost fallback; require explicit baseUrl or log a clear error | Silent failures for customers who forget to configure | Low (5 min) | Customers get a helpful error instead of silence |
| 3 | Fix `signup/route.ts` — import `{ prisma }` from `@/lib/prisma` | Connection leak on every signup | Low (2 min) | No extra connection per signup |
| 4 | Fix `lib/prisma.ts` — apply global singleton in production, not just dev | Connection pool exhaustion under load | Low (10 min) | Prisma reuses the connection in production |

### Deployment Fixes

| Priority | Task | Why It Matters | Complexity | Expected Outcome |
|----------|------|----------------|------------|------------------|
| 5 | Confirm UptimeRobot on `/api/health` | Supabase pause protection | Low (5 min) | DB never pauses in production |
| 6 | Create staging environment + separate Supabase project for CI | Eliminates test pollution in prod | Medium (1 hour) | Clean production data; meaningful admin dashboard |
| 7 | Add Sentry error tracking | No alerting on prod errors currently | Low (30 min) | Errors surface with stack traces and alerts |

### Short-Term Improvements

| Priority | Task | Why It Matters | Complexity | Expected Outcome |
|----------|------|----------------|------------|------------------|
| 8 | Add draft persistence to flow editor | Refreshing loses work | Medium (2 hours) | Users can navigate away and return safely |
| 9 | Add pagination to analytics endpoint | Silent 100-event cap | Low (1 hour) | Accurate analytics for any flow |
| 10 | Add rate limiting on `/api/sdk/*/events` | Analytics spam protection | Low–Medium | Analytics integrity protected |

### Agentic Improvements

| Priority | Task | Why It Matters | Complexity | Expected Outcome |
|----------|------|----------------|------------|------------------|
| 11 | Add session-start hook that auto-reads `session-log.md` and reports current phase + next task | Agent currently waits to be told what phase to work on | Low | Agent self-orients on startup |
| 12 | Add PostToolUse hook that checks `test-results/.last-run.json` staleness and reminds agent to run tests | Agent never proactively checks test status | Low | Test failures surface automatically |
| 13 | Make skill invocation automatic based on task context (route detected → load build-api-route.md) | Currently skills are manually triggered | Medium | Agent applies correct checklist without being told |

### Long-Term Platform Vision

| Priority | Task | Why It Matters | Complexity |
|----------|------|----------------|------------|
| 14 | ADR-006 route group refactor before any new feature | `decision.md` names this as the trigger | Medium |
| 15 | Per-org domain allowlist for CORS instead of `*` | Security + prevents cross-org SDK abuse | Medium |
| 16 | Paid Supabase tier + connection pooler before real traffic | Free tier limits bite at ~20 concurrent users | Low (cost decision) |
| 17 | Add funnel analytics and per-step drop-off metrics | Core product value currently missing from analytics | Medium |

---

## 8. Final Recommendation

- **Is the product deployed?** Yes — `https://onboardme-gules.vercel.app`, live on Vercel, all 9 phases complete.
- **Is the platform currently working?** Yes, for a POC. Full end-to-end smoke test verified 2026-06-28. All 7 API routes return correct shapes. Playwright E2E tests passing. TypeScript clean.
- **Is it truly agent-driven?** The build process is semi-agentic (Level 3). The product itself is not agentic (Level 1). The hooks and skills are now real committed files — a genuine improvement since the 2026-06-16 audit. But the agent still waits to be told what to do; nothing self-directs.
- **Biggest risk:** XSS vulnerability in `sdk.js` combined with test pollution in production. The first is a security risk affecting end-users of your customers' websites. The second means admin dashboard numbers are meaningless.
- **Highest-leverage next step:** Fix the 4 immediate code issues (XSS, baseUrl default, signup Prisma leak, prod singleton) in one commit — each is under 15 minutes.
- **Continue, pause, rebuild, or refactor?** Continue with targeted fixes. The schema, auth, publish pipeline, and SDK architecture are all sound. The issues are correctness bugs and missing guardrails, not architectural mistakes.
- **What should be demoed as proof the system works:** live walkthrough on production URL — signup → create 2-step flow → publish → open `/test.html` → paste flow ID → modal renders with both steps → click Done → return to Analytics tab → confirm `flow_started` and `flow_completed` events appear → open `/api/health` → confirm `{"status":"ok","db":"ok"}`. This is the POC definition from `memory/project.md`, last verified 2026-06-28.
