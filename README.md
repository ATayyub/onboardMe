# OnboardMe

A no-code onboarding flow builder. Companies build modal-driven onboarding flows in a
dashboard and embed them on any website with a small vanilla JS SDK.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Prisma** ORM + **PostgreSQL**
- **NextAuth.js** (email/password credentials)
- **Tailwind CSS**
- Vanilla JS SDK (`public/sdk.js`, ~120 lines, zero dependencies)

## Quick Start

**1. Clone and install:**
```bash
git clone https://github.com/ATayyub/onboardMe.git
cd onboardMe
npm install
```

**2. Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:
- **`DATABASE_URL`** — Update to your own PostgreSQL database
  - Local: `postgresql://postgres@localhost:5432/onboardme`
  - Supabase: Use the pooler host (see Deployment section)
- **`NEXTAUTH_SECRET`** — Generate with `openssl rand -base64 32`
- **`NEXTAUTH_URL`** — Keep as `http://localhost:3000` for local dev
- **`ADMIN_EMAIL`** — Your email for `/admin` dashboard access

**3. Apply database schema:**
```bash
npx prisma migrate dev
```

**4. Run:**
```bash
npm run dev          # http://localhost:3000
```

Visit `http://localhost:3000/signup` to create an account.

## How It Works

1. **Sign up** at `/signup` — creates an organisation with a generated API key.
2. **Create a flow** on the dashboard, add/reorder steps in the editor (`/flows/[id]`).
3. **Publish** — writes an append-only version and flips the flow to `live`.
4. **Embed** the SDK on any site:

   ```html
   <script src="https://your-domain.com/sdk.js"></script>
   <script>
     OnboardMe.init('YOUR_FLOW_ID', {
       baseUrl: 'https://your-domain.com',
       userId: 'optional-user-id'
     });
   </script>
   ```

5. **View analytics** — the editor's Analytics tab shows started / step-viewed /
   completed counts and a recent-events table.

A local test harness is available at `/test.html`.

## API Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/auth/signup` | public | Create org + API key |
| `* /api/auth/[...nextauth]` | public | NextAuth login/session |
| `GET/POST /api/flows` | session | List / create flows |
| `GET/PUT /api/flows/[id]` | session | Read / update a flow |
| `POST /api/flows/[id]/publish` | session | Publish a new append-only version |
| `GET /api/sdk/[flowId]/config` | public (CORS) | Serve live flow config to the SDK |
| `POST /api/sdk/[flowId]/events` | public (CORS) | Record SDK analytics events |
| `GET /api/dashboard/analytics` | session | Aggregated events for a flow |

## Architecture Notes

- **Append-only versions** — `flow_versions` is INSERT-only. Publishing never updates or
  deletes; the SDK always serves the highest `versionNum`.
- **Multi-tenancy** — every flow is scoped by `orgId`, derived from the session.
- **Auth at the edge** — `middleware.ts` (project root) redirects unauthenticated
  requests to `/dashboard/*` and `/flows/*` to `/login`.
- **CORS on SDK routes only** — the two `/api/sdk/*` routes set
  `Access-Control-Allow-Origin: *` so they work cross-origin from customer sites.

## Scope (POC)

In scope: signup/login, flow CRUD, publishing, SDK embed, analytics.
Out of scope: A/B testing, multi-user orgs, media uploads, billing, white-labelling.

## Deployment

**Live:** https://onboardme-gules.vercel.app

Deployed on **Vercel** (free Hobby tier, serverless) + **Supabase** (Postgres).

> Previously ran on Railway; moved to Vercel when the Railway trial expired. The Supabase
> DB was unaffected by the move — only the app host changed, and existing accounts/flows
> carried over.

Required env vars (Vercel → Project → Settings → Environment Variables, Production):
- `DATABASE_URL` — Supabase **transaction** pooler (serverless-correct, port 6543):
  `postgresql://postgres.<ref>:<pwd>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — the public Vercel domain (e.g. `https://onboardme-gules.vercel.app`)

Deploy from a local checkout with the Vercel CLI (needs CLI ≥ 47.2.2):
```bash
npx vercel@latest link --yes --project onboardme   # first time only
npx vercel@latest --prod                            # build + deploy
```
`postinstall` runs `prisma generate` during the build, so no manual generate step.
Migrations are already applied to the Supabase DB.

> **Connection note:** always use the Supabase **pooler** host
> (`aws-1-<region>.pooler.supabase.com`), never the direct `db.<ref>.supabase.co` host —
> the direct host is IPv6-only and fails to resolve on many IPv4 networks (this was the
> original "Supabase DNS" blocker). Pooler **port 6543 (transaction mode + `pgbouncer=true`)**
> is right for serverless/Vercel; **port 5432 (session mode)** suits a persistent server.

## Dev Commands

```bash
npm run dev          # dev server
npm run build        # production build (do NOT run while dev server is live —
                     # it clobbers .next/dev and 404s nested routes until restart)
npx tsc --noEmit     # type-check
npx prisma studio    # DB browser
```
