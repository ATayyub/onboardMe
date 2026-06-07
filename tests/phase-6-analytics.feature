Feature: Phase 6 - Analytics & Dashboards (Event Tracking & Display)

  These tests verify that events are tracked and displayed in dashboards.

  Scenario: Analytics endpoint exists
    Given a published flow exists with id="flow_analytics_1"
    When I call GET /api/dashboard/analytics?flow_id=flow_analytics_1
    Then the response is JSON with status 200

  Scenario: Analytics endpoint returns events
    Given events have been fired for a flow (via SDK)
    When I call GET /api/dashboard/analytics?flow_id=flow_analytics_1
    Then the response includes an array of events
    And each event has: id, event_type, user_id, step_index, created_at
    And events are ordered by created_at (newest first)

  Scenario: Analytics shows last 50 events
    Given a flow has 100+ events recorded
    When I call GET /api/dashboard/analytics?flow_id=flow_analytics_1
    Then the response includes max 50 events
    And these are the most recent 50 events

  Scenario: User can view analytics dashboard
    Given I'm logged in and viewing a published flow
    When I navigate to /flows/[id]/analytics (or similar analytics page)
    Then the analytics dashboard page loads
    And there is a table showing events

  Scenario: Analytics table displays event data
    Given events exist for a flow
    When I view the analytics dashboard
    Then the table shows columns: event_type, step_index, user_id, timestamp
    And each row represents one event
    And rows are sorted by timestamp (newest first)

  Scenario: Analytics shows flow_started events
    Given a flow was started by users
    When I view the analytics table
    Then at least one row shows event_type="flow_started"

  Scenario: Analytics shows step_viewed events
    Given a flow was navigated through
    When I view the analytics table
    Then rows show event_type="step_viewed" for each step viewed

  Scenario: Analytics shows flow_completed events
    Given a flow was completed
    When I view the analytics table
    Then at least one row shows event_type="flow_completed"

  Scenario: Analytics shows flow_dismissed events
    Given a flow was dismissed by users
    When I view the analytics table
    Then at least one row shows event_type="flow_dismissed"

  Scenario: Events are recorded in database
    Given a user interacts with a flow via SDK
    When I open Prisma Studio and view analytics_events table
    Then rows are created for each event
    And each row has: id, flow_id, event_type, user_id, step_index, url, created_at

  Scenario: SDK install screen exists
    Given I'm logged in
    When I navigate to /sdk-install or similar install page
    Then the page loads
    And displays "How to install the SDK" or similar heading

  Scenario: SDK install screen shows API key
    Given I'm on the SDK install screen
    When the page loads
    Then my organization's API key is displayed
    And the key is non-empty

  Scenario: SDK install screen shows script tag
    Given I'm on the SDK install screen
    When the page loads
    Then a pre-filled script tag is displayed
    And the tag includes: src, data-flow-id, data-user-id

  Scenario: Script tag is copy-ready
    Given the script tag is displayed
    When I select and copy the script tag text
    Then the tag can be pasted into an HTML page
    And it will load correctly

  Scenario: SDK detected indicator works
    Given no events exist for my flow in the last 24 hours
    When I view the SDK install screen
    Then "SDK not detected" or similar message appears

  Scenario: SDK detected after events
    Given I've interacted with a published flow (firing events)
    When I view the SDK install screen within 24 hours
    Then "SDK detected" or green indicator appears
    And shows recent event count or timestamp

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] Analytics endpoint exists
- [ ] Analytics endpoint returns events
- [ ] Analytics shows last 50 events
- [ ] User can view analytics dashboard
- [ ] Analytics table displays event data
- [ ] Analytics shows flow_started events
- [ ] Analytics shows step_viewed events
- [ ] Analytics shows flow_completed events
- [ ] Analytics shows flow_dismissed events
- [ ] Events are recorded in database
- [ ] SDK install screen exists
- [ ] SDK install screen shows API key
- [ ] SDK install screen shows script tag
- [ ] Script tag is copy-ready
- [ ] SDK detected indicator works
- [ ] SDK detected after events

**Phase 6 Status**: All tests must pass to move to Phase 7 (Polish).
