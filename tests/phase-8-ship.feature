Feature: Phase 8 - Verification & Ship (Complete End-to-End POC)

  These tests verify the complete POC journey works and all 7 API routes function correctly.

  Scenario: Complete POC journey from signup to viewing events
    Given the app is deployed and running
    When I perform this complete flow:
      1. Navigate to /signup
      2. Sign up with email "poc@example.com" and password "poctest123"
      3. See dashboard
      4. Click "New Flow"
      5. Add 2 steps with titles "Welcome" and "Confirm"
      6. Click "Publish"
      7. Copy the script tag
      8. Create test.html with the script tag
      9. Open test.html in browser
      10. See the "Welcome" modal
      11. Click CTA to see "Confirm" modal
      12. Click CTA to complete flow
      13. Open dashboard
      14. Navigate to analytics
      15. See flow_started, step_viewed, flow_completed events
    Then all steps succeed without errors
    And the POC is proven to work end-to-end

  Scenario: All 7 API routes are callable
    Given the app is running
    When I test each endpoint:
      1. POST /api/auth/[...nextauth] - login endpoint
      2. GET /api/flows - fetch flows
      3. POST /api/flows - create flow
      4. GET /api/flows/[id] - fetch single flow
      5. PUT /api/flows/[id] - update flow
      6. POST /api/flows/[id]/publish - publish flow
      7. GET /api/sdk/[flow_id]/config - fetch SDK config
      8. POST /api/sdk/[flow_id]/events - send event
    Then all endpoints respond with 200-201 status
    And none return 404 or 500 errors
    And CORS headers are present on /api/sdk/* endpoints

  Scenario: TypeScript has zero errors
    Given the project is built
    When I run "npx tsc --noEmit"
    Then the command exits with code 0
    And no TypeScript errors are reported

  Scenario: Build succeeds
    Given the project is complete
    When I run "npm run build"
    Then the build succeeds with no errors
    And a .next directory is created
    And there are no warnings or failed builds

  Scenario: App deploys to Vercel
    Given the project is pushed to GitHub
    When Vercel deploys the main branch
    Then the deployment succeeds
    And the app is accessible at the Vercel URL
    And environment variables are configured correctly

  Scenario: POC checklist is 100% complete
    Given I've completed all 8 phases
    When I review memory/project.md POC Definition
    Then all 5 items are checked off:
      - [ ] An org can sign up and log in ✅
      - [ ] A flow can be created, edited, and published ✅
      - [ ] The SDK renders a published flow on an external page ✅
      - [ ] Analytics events appear in the dashboard ✅
      - [ ] All 7 API routes return correct shapes under happy-path tests ✅

  Scenario: Database is in correct state
    Given the app has been used in the POC journey
    When I open Prisma Studio and check all tables
    Then organisations table has at least 1 org
    And flows table has at least 1 flow
    And flow_versions table has at least 1 version
    And analytics_events table has at least 3 events (flow_started, step_viewed, flow_completed)

  Scenario: README provides clear setup instructions
    Given README.md exists in the repo
    When I read it
    Then it includes:
      1. Project description
      2. Tech stack
      3. Prerequisites (Node.js, npm)
      4. Installation steps (clone, npm install)
      5. Environment setup (.env.local with DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET)
      6. Database migration (npx prisma migrate deploy)
      7. Dev server startup (npm run dev)
      8. Access URL (localhost:3000)

  Scenario: README setup works for a new user
    Given a fresh clone of the repo
    When a user follows the README steps:
      1. Clone repo
      2. npm install
      3. Create .env.local with correct vars
      4. npx prisma migrate deploy
      5. npm run dev
    Then the dev server starts
    And they can access localhost:3000
    And they can sign up and use the app

  Scenario: All code is committed
    Given all work is complete
    When I run "git status"
    Then the working tree is clean
    And there are no uncommitted changes
    And all meaningful work is in commits

  Scenario: Commits have clear messages
    Given commits have been made throughout the project
    When I run "git log --oneline" and review commits
    Then each commit message is clear and describes what changed
    And messages reference the phase (e.g., "Phase 1: ...", "Phase 5: ...")

  Scenario: No secrets in code
    Given the project is complete
    When I search for:
      - API keys in source code
      - Database passwords in code
      - NextAuth secrets hardcoded
    Then none are found
    And secrets are only in .env.local (gitignored)

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] Complete POC journey from signup to viewing events
- [ ] All 7 API routes are callable
- [ ] TypeScript has zero errors
- [ ] Build succeeds
- [ ] App deploys to Vercel
- [ ] POC checklist is 100% complete
- [ ] Database is in correct state
- [ ] README provides clear setup instructions
- [ ] README setup works for a new user
- [ ] All code is committed
- [ ] Commits have clear messages
- [ ] No secrets in code

**🎉 Phase 8 Status**: When all tests pass, the POC is COMPLETE and ready to ship.
