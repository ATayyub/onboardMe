# Skill: Prisma Schema Change & Migration

Work through this checklist **in order** every time the DB schema changes.

---

## Hard rules (non-negotiable — ADR-001)

- **NEVER** run `prisma migrate reset` — it drops and recreates all tables.
- **NEVER** run `prisma db push` — it bypasses the migration history.
- **NEVER** add UPDATE or DELETE operations targeting `flow_versions`.
- The `flow_versions` table is INSERT-ONLY. All versions are permanent.

The PreToolUse hook will block `migrate reset` and `db push` automatically,
but understand *why* they are forbidden — not just that they're blocked.

---

## Steps

### 1. Edit `prisma/schema.prisma`

Add the model or column. Follow the existing conventions:
- IDs: `String @id @default(cuid())`
- Timestamps: `DateTime @default(now()) @db.Timestamp(6)`
- Strings: `String @db.VarChar(255)` (use appropriate length)
- Add `@@index` for any FK or frequently queried column.
- Add `@@map("snake_case_table_name")` to match existing table naming.

### 2. Validate the schema syntax

```bash
npx prisma validate
```

Fix any errors before continuing. This doesn't require a DB connection.

### 3. Create and apply the migration

```bash
npx prisma migrate dev --name <descriptive_name>
```

Use a short, descriptive name: `add_draft_status_to_flows`, `add_user_id_to_events`, etc.

This will:
- Generate SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`
- Apply the SQL to the local dev DB
- Regenerate the Prisma client

### 4. Review the generated SQL

Open `prisma/migrations/<timestamp>_<name>/migration.sql` and confirm:
- The SQL matches what you expected
- No accidental DROP TABLE or DROP COLUMN
- CASCADE rules are correct on FKs (follow the existing pattern: `ON DELETE Cascade`)

### 5. Verify in Prisma Studio

```bash
npx prisma studio
```

Open localhost:5555 and confirm:
- New table or column appears
- Existing data is unaffected
- Relationships are correct

### 6. Regenerate Prisma client (if not done automatically)

```bash
npx prisma generate
```

Then run type-check:

```bash
npx tsc --noEmit
```

Must pass with zero errors.

---

## Supabase production note

Migrations are applied to the Supabase DB via `prisma migrate deploy` (not `dev`).
This runs only the new migration files — it does not touch existing data.
Always test locally first, confirm migration.sql looks correct, then deploy.
