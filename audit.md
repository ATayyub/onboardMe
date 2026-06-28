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
