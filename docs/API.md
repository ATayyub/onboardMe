# OnboardMe API Reference

All routes except SDK endpoints (`/api/sdk/*`) require authentication. SDK endpoints are public and CORS-enabled.

---

## Authentication Routes

### POST /api/auth/signup

Create a new organization account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "orgId": "org_abc123",
  "email": "user@example.com",
  "name": "user",
  "apiKey": "sk_live_abc123xyz"
}
```

**Errors:**
- 400: Invalid email or password (< 8 chars)
- 409: Email already registered
- 500: Server error

**Notes:**
- Password is hashed with bcryptjs (cost factor 10)
- Auto-logs in after signup (session created)
- API key is generated and stored for future use

---

### POST /api/auth/[...nextauth]

NextAuth.js credential verification endpoint. Handles login via `signIn('credentials', ...)`.

**Request (via NextAuth):**
```javascript
const result = await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false
})
```

**Response:**
- ✅ Session created, user redirected to `/dashboard`
- ❌ 401: Invalid email or password

**Notes:**
- NextAuth session includes `user.email` and `session.orgId` (for multi-tenancy)
- NEXTAUTH_SECRET required in env vars
- Credential verification uses bcryptjs.compare()

---

## Flow CRUD Routes

All require authentication (401 if not logged in). All responses scoped to the authenticated org.

### GET /api/flows

List all flows for the authenticated organization.

**Response (200):**
```json
{
  "flows": [
    {
      "id": "flow_xyz",
      "orgId": "org_abc123",
      "name": "Onboarding",
      "status": "live",
      "createdAt": "2026-05-31T10:00:00Z",
      "updatedAt": "2026-05-31T10:05:00Z"
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 500: Server error

---

### POST /api/flows

Create a new flow for the authenticated organization.

**Request:**
```json
{
  "name": "Onboarding",
  "config": []
}
```

**Response (201):**
```json
{
  "id": "flow_xyz",
  "orgId": "org_abc123",
  "name": "Onboarding",
  "config": [],
  "status": "draft",
  "createdAt": "2026-05-31T10:00:00Z"
}
```

**Errors:**
- 400: Missing name
- 401: Unauthorized
- 500: Server error

---

### GET /api/flows/[id]

Get a single flow by ID (must belong to authenticated org).

**Response (200):**
```json
{
  "id": "flow_xyz",
  "orgId": "org_abc123",
  "name": "Onboarding",
  "config": [
    { "type": "step", "title": "Welcome", "description": "..." }
  ],
  "status": "live",
  "createdAt": "2026-05-31T10:00:00Z",
  "updatedAt": "2026-05-31T10:05:00Z"
}
```

**Errors:**
- 401: Unauthorized
- 404: Flow not found
- 500: Server error

---

### PUT /api/flows/[id]

Update flow name or config (must belong to authenticated org).

**Request:**
```json
{
  "name": "Updated Onboarding",
  "config": [
    { "type": "step", "title": "Welcome", "description": "..." }
  ]
}
```

**Response (200):**
```json
{
  "id": "flow_xyz",
  "orgId": "org_abc123",
  "name": "Updated Onboarding",
  "config": [...],
  "status": "draft",
  "updatedAt": "2026-05-31T10:10:00Z"
}
```

**Errors:**
- 400: Invalid request body
- 401: Unauthorized
- 404: Flow not found
- 500: Server error

---

## Publishing Routes

### POST /api/flows/[id]/publish

Publish a flow (create append-only flow_version, set flow status to 'live').

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "flowId": "flow_xyz",
  "versionNumber": 1,
  "publishedAt": "2026-05-31T10:15:00Z",
  "config": [...]
}
```

**Errors:**
- 400: Flow has 0 steps (validation error)
- 401: Unauthorized
- 404: Flow not found
- 500: Server error

**Notes:**
- flow_versions table is append-only (INSERT only, never UPDATE/DELETE)
- Each publish increments versionNumber
- Sets flow.status to 'live'
- SDK fetches highest version_number for a flowId

---

## SDK Routes (Public, CORS-enabled)

### GET /api/sdk/[flowId]/config

Fetch the active config for a published flow (public, no auth required).

**Query Params:**
- `flowId` (required): Flow ID to fetch

**Response (200):**
```json
{
  "id": "flow_xyz",
  "name": "Onboarding",
  "version": 1,
  "config": [
    { "type": "step", "title": "Welcome", "description": "..." }
  ]
}
```

**Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Errors:**
- 404: Flow not found or not published
- 500: Server error

**Notes:**
- Returns highest version_number for flowId
- Public endpoint (no API key required)
- CORS headers allow cross-origin requests from any domain

---

### POST /api/sdk/[flowId]/events

Record analytics events from the embedded SDK (public, no auth required).

**Request:**
```json
{
  "flowId": "flow_xyz",
  "userId": "user123",
  "eventType": "flow_started",
  "stepIndex": 0,
  "timestamp": "2026-05-31T10:20:00Z"
}
```

**Response (200):**
```json
{
  "eventId": "evt_abc",
  "recorded": true
}
```

**Errors:**
- 400: Invalid event type
- 404: Flow not found
- 500: Server error

**Valid Event Types:**
- `flow_started` — User opens the flow
- `step_viewed` — User views a specific step
- `flow_completed` — User completes the flow
- `flow_dismissed` — User closes the flow

**Notes:**
- Public endpoint (no API key required)
- CORS headers allow cross-origin requests
- Events stored in analytics_events table
- userId is free-form (embed as "user123" or UUID from your system)

---

## Analytics Routes

### GET /api/dashboard/analytics

Fetch event analytics for all flows owned by the authenticated org.

**Query Params:**
- `flowId` (optional): Filter to single flow

**Response (200):**
```json
{
  "summary": {
    "totalEvents": 47,
    "flowsStarted": 12,
    "stepsViewed": 35,
    "flowsCompleted": 8,
    "uniqueUsers": 7
  },
  "events": [
    {
      "id": "evt_abc",
      "flowId": "flow_xyz",
      "userId": "user123",
      "eventType": "flow_completed",
      "stepIndex": 0,
      "createdAt": "2026-05-31T10:20:00Z"
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 500: Server error

**Notes:**
- Returns all events for all flows in the org
- If flowId specified, filters to that flow only
- Events sorted by createdAt DESC (newest first)

---

## Admin Routes

### GET /api/admin/orgs

Fetch all organizations with signup and usage stats (admin-only).

**Response (200):**
```json
{
  "totalOrgs": 12,
  "totalFlows": 34,
  "totalEvents": 856,
  "orgs": [
    {
      "id": "org_xyz",
      "email": "user@example.com",
      "name": "user",
      "createdAt": "2026-05-31T10:00:00Z",
      "flowCount": 3,
      "liveFlowCount": 1,
      "totalEvents": 47
    }
  ]
}
```

**Errors:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (logged in but not admin email)
- 500: Server error

**Notes:**
- Requires `session.user.email === process.env.ADMIN_EMAIL`
- Admin email check is case-insensitive and trimmed
- Returns all orgs (no pagination in MVP)
- Events counted across all flows in each org

---

## Error Response Format

All errors return JSON with status code and message:

```json
{
  "error": "Flow not found"
}
```

Common HTTP status codes:
- **200** — Success
- **201** — Created
- **400** — Bad request (validation, missing fields)
- **401** — Unauthorized (auth required, not logged in)
- **403** — Forbidden (auth succeeded but permission denied)
- **404** — Not found (resource doesn't exist)
- **409** — Conflict (e.g., email already registered)
- **500** — Server error

---

## SDK Integration Example

Embed the SDK on your website:

```html
<script src="https://onboardme-gules.vercel.app/sdk.js"></script>

<script>
  OnboardMe.showFlow('flow_xyz', {
    userId: 'my-user-123',
    onComplete: () => console.log('Flow completed!'),
    onDismiss: () => console.log('Flow dismissed!')
  });
</script>
```

The SDK:
1. Calls `GET /api/sdk/flow_xyz/config` to fetch the flow definition
2. Renders the modal with the config
3. Fires analytics events to `POST /api/sdk/flow_xyz/events`

All communication is automatic; you only need to call `OnboardMe.showFlow()`.
