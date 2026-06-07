Feature: Phase 3 - Flow CRUD API (Create, Read, Update, List)

  These tests verify that all CRUD operations for flows work via API endpoints and dashboard.

  Scenario: User can view flows list page
    Given a user is logged in
    When I navigate to /flows
    Then the flows list page is displayed
    And there is a "New Flow" button
    And if no flows exist, a "No flows yet" message appears

  Scenario: User can create a new flow
    Given I'm on the /flows page
    When I click "New Flow"
    Then a new flow is created in the database
    And I'm redirected to the flow builder for the new flow
    And the flow has status="draft"

  Scenario: GET /api/flows returns flows for org
    Given a user with email "user@example.com" is logged in
    And that user's org has 2 flows
    When I call GET /api/flows (via curl or DevTools Network)
    Then the response is JSON with status 200
    And the response includes an array of 2 flows
    And each flow has: id, org_id, status, created_at
    And all flows have org_id matching the logged-in user's org

  Scenario: POST /api/flows creates a new flow
    Given a user is logged in with orgId="abc123"
    When I call POST /api/flows with body { "name": "Welcome Flow" }
    Then the response is JSON with status 201
    And the response includes the created flow with:
      | Field | Value |
      | name  | Welcome Flow |
      | status | draft |
      | org_id | abc123 |

  Scenario: GET /api/flows/[id] retrieves a single flow
    Given a flow with id="flow1" exists in the org
    When I call GET /api/flows/flow1
    Then the response is JSON with status 200
    And the response includes the flow with all fields
    And org_id matches the current user's org

  Scenario: PUT /api/flows/[id] updates flow metadata
    Given a flow with id="flow2" and name="Old Name" exists
    When I call PUT /api/flows/flow2 with body { "name": "New Name" }
    Then the response is JSON with status 200
    And the flow name is updated to "New Name"
    And flow_versions table is NOT modified (append-only rule)

  Scenario: Flows list shows created flows
    Given I've created 2 flows: "Flow A" and "Flow B"
    When I navigate to /flows page
    Then the flows table displays both:
      | Flow Name | Status |
      | Flow A | draft |
      | Flow B | draft |

  Scenario: Flow list shows status badges
    Given flows with different statuses exist (draft, live, archived)
    When I view the /flows list
    Then each flow displays its status with a visual badge
    And drafts show gray badge
    And live flows show green badge
    And archived flows show dark badge

  Scenario: Can't access other org's flows
    Given User A (org="org_a") and User B (org="org_b") both exist
    When User A logs in and calls GET /api/flows
    Then the response only includes flows with org_id="org_a"
    And flows from org_b are NOT returned

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] User can view flows list page
- [ ] User can create a new flow
- [ ] GET /api/flows returns flows for org
- [ ] POST /api/flows creates a new flow
- [ ] GET /api/flows/[id] retrieves a single flow
- [ ] PUT /api/flows/[id] updates flow metadata
- [ ] Flows list shows created flows
- [ ] Flow list shows status badges
- [ ] Can't access other org's flows

**Phase 3 Status**: All tests must pass to move to Phase 4 (Publishing).
