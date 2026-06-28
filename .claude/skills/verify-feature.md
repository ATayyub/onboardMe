# Skill: Verify a Completed Feature

Run this checklist when a phase or feature is finished, before moving on.

---

## Steps

### 1. Type-check (mandatory, zero tolerance)

```bash
npx tsc --noEmit
```

Must exit with zero errors. Fix all errors before continuing.

### 2. Manual happy-path test

Run the feature end-to-end as a real user would:
1. Start from a clean state (new flow, fresh session if needed)
2. Perform the action the feature enables
3. Confirm the expected outcome in the UI

Document what you tested in session-log.md.

### 3. Test an error case

At least one error path per feature:
- What happens with missing/invalid input?
- What happens without a valid session (for protected routes)?
- Does the error message make sense to the user?

### 4. Verify via the database

Open Prisma Studio:

```bash
npx prisma studio
```

Confirm:
- [ ] Expected rows were inserted (or updated, if not flow_versions)
- [ ] No orphaned rows
- [ ] FKs are correct (e.g., flow.orgId matches the signed-in org)
- [ ] flow_versions: only INSERT, no UPDATE or DELETE (ADR-001)

### 5. Test the API directly

Use curl or DevTools Network to hit the endpoint directly:

```bash
# Example: test the publish endpoint
curl -X POST http://localhost:3000/api/flows/<id>/publish \
  -H "Content-Type: application/json" \
  --cookie "next-auth.session-token=..." \
  -d '{}'
```

Confirm:
- [ ] Status code matches docs/API.md
- [ ] Response shape matches docs/API.md
- [ ] Auth protection works (401 without a session)

### 6. Check append-only invariant (if flow_versions was touched)

```bash
grep -r "flow_versions" app/api/ --include="*.ts"
```

Confirm every reference is an INSERT or a SELECT. No UPDATE. No DELETE. Ever.

### 7. Update session-log.md

Mark the completed phase checklist items. Add any new blockers discovered.

### 8. Tick the POC checklist if applicable

Open `memory/project.md`. If a POC checklist item is now satisfied, mark it:

```
- [x] An org can sign up and log in
```

Date-stamp the verification: `Verified YYYY-MM-DD`.
