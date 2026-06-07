Feature: Phase 1 - Foundation (Database & Project Setup)

  These tests verify that the Next.js project, database schema, and migrations are working.

  Scenario: Project scaffolding complete
    Given the repository is freshly cloned
    When I run "npm install"
    Then npm packages install without errors
    And node_modules directory is created

  Scenario: Prisma is configured
    Given npm packages are installed
    When I check prisma/schema.prisma
    Then the file exists
    And datasource db is configured to use Supabase PostgreSQL
    And DATABASE_URL is set in .env.local

  Scenario: Database tables are created
    Given Supabase DATABASE_URL is configured in .env.local
    When I run "npx prisma migrate dev --name init"
    Then the migration succeeds with no errors
    And the following tables exist in the database:
      | organisations |
      | flows         |
      | flow_versions |
      | analytics_events |

  Scenario: Tables have correct schema
    Given migrations have been applied
    When I open Prisma Studio with "npx prisma studio"
    Then Prisma Studio opens on localhost:5555
    And organisations table has columns: id, name, api_key, created_at
    And flows table has columns: id, org_id, status, created_at
    And flow_versions table has columns: id, flow_id, version_num, config, published_at
    And analytics_events table has columns: id, flow_id, user_id, event_type, created_at

  Scenario: Types are generated correctly
    Given schema.prisma is valid
    When I run "npx tsc --noEmit"
    Then no TypeScript errors occur
    And Prisma Client types are generated in node_modules/@prisma/client

  Scenario: Dev server starts
    Given all setup is complete
    When I run "npm run dev"
    Then the server starts on localhost:3000
    And there are no startup errors in the console

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] Project scaffolding complete
- [ ] Prisma is configured
- [ ] Database tables are created
- [ ] Tables have correct schema
- [ ] Types are generated correctly
- [ ] Dev server starts

**Phase 1 Status**: All tests must pass to move to Phase 2 (Auth).
