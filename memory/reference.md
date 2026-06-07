---
name: reference_docs
description: External documentation URLs, key commands, and service-specific setup notes
metadata:
  type: reference
---

# Reference Resources

## Documentation URLs
- Next.js App Router: https://nextjs.org/docs/app
- Prisma Migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Supabase connection pooling: https://supabase.com/docs/guides/database/connecting-to-postgres
- NextAuth App Router guide: https://next-auth.js.org/configuration/initialization#route-handlers-app-router
- Tailwind v3 docs: https://tailwindcss.com/docs

## Key Commands Reference
```bash
# Create a new migration
npx prisma migrate dev --name <descriptive_name>

# Validate schema without migrating
npx prisma validate

# Open Prisma Studio
npx prisma studio

# Type-check
npx tsc --noEmit

# Generate Prisma client after schema change
npx prisma generate

# Check Supabase connection
npx prisma db pull
```

## Supabase Notes
- Project URL and anon key live in .env.local (never committed)
- Use DATABASE_URL with ?pgbouncer=true and DIRECT_URL without it for Prisma + Supabase
- Free tier: 500 MB storage, 2 GB bandwidth, 50,000 monthly active users
