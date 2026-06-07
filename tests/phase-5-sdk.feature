Feature: Phase 5 - SDK Integration (Embed Script & Config)

  These tests verify that the SDK can be embedded on external pages and renders flows.

  Scenario: GET /api/sdk/[flow_id]/config endpoint exists
    Given a published flow with id="sdk_test_1"
    When I call GET /api/sdk/sdk_test_1/config
    Then the response is JSON with status 200
    And no authentication headers are required

  Scenario: Config endpoint returns flow structure
    Given a flow is published with 2 steps
    When I call GET /api/sdk/[flow_id]/config
    Then the response JSON includes:
      | Field | Value |
      | steps | (array of 2 steps) |
      | steps[0].title | (step title) |
      | steps[0].body | (step body) |
      | steps[0].cta_label | (button text) |

  Scenario: GET /api/sdk/config handles missing flow gracefully
    Given no flow exists with id="nonexistent"
    When I call GET /api/sdk/nonexistent/config
    Then the response is JSON with status 200 or 404
    And the response contains empty steps array or error field

  Scenario: POST /api/sdk/[flow_id]/events endpoint exists
    Given a published flow exists
    When I call POST /api/sdk/sdk_test_1/events with event data
    Then the response is JSON with status 200

  Scenario: Events endpoint accepts event data
    Given the events endpoint is available
    When I POST with body:
      { "event_type": "flow_started", "user_id": "user1", "step_index": 0 }
    Then the response is 200
    And the event is stored in analytics_events table

  Scenario: CORS headers are present on config endpoint
    Given the config endpoint is called
    When I check the HTTP response headers
    Then Access-Control-Allow-Origin header is present
    And its value is * or the correct origin

  Scenario: CORS headers are present on events endpoint
    Given the events endpoint is called
    When I check the HTTP response headers
    Then Access-Control-Allow-Origin header is present
    And OPTIONS preflight requests are handled

  Scenario: SDK script tag is valid
    Given /public/sdk.js exists
    When I view the file
    Then the file is valid JavaScript
    And contains no syntax errors
    And is approximately 80 lines (reasonable size)

  Scenario: SDK loads on test page
    Given /public/test.html exists with a script tag
    When I open test.html in a browser (localhost:3000/test.html or serve locally)
    Then the page loads without JavaScript errors
    And the browser console shows no 404s for sdk.js

  Scenario: SDK fetches config on load
    Given test.html is open in browser
    When I open DevTools Network tab
    Then a GET request to /api/sdk/[flow_id]/config is made
    And the response status is 200

  Scenario: Modal appears when SDK loads
    Given a published flow with 2 steps exists
    And test.html has the script tag with correct flow_id
    When I open test.html in a browser
    Then a modal dialog appears on the page
    And the modal shows the first step's title
    And the modal shows the first step's body
    And there is a CTA button with the cta_label text

  Scenario: Modal renders native HTML dialog element
    Given the modal is displayed
    When I inspect the modal in DevTools
    Then the element is a native `<dialog>` element
    And dialog.showModal() was used (check for backdrop)

  Scenario: User can navigate through steps
    Given a 3-step flow is displayed
    When I click the CTA button on step 1
    Then step 1 modal closes
    And step 2 modal appears
    And I can click again to see step 3
    And on the last step, clicking CTA closes the modal

  Scenario: User can dismiss the modal
    Given a modal is displayed
    When I press Escape key (or click outside, if implemented)
    Then the modal closes

  Scenario: Events are fired when SDK runs
    Given test.html is open and SDK is running through a flow
    When I click through all steps and complete the flow
    Then the DevTools Network tab shows POST requests to /api/sdk/events
    And events include: flow_started, step_viewed (per step), flow_completed

  Scenario: Event data is correct
    Given events are being fired
    When I check one event in the Network tab
    Then the POST body includes:
      | Field | Value |
      | event_type | (event name) |
      | user_id | (from data-user-id attribute) |
      | step_index | (current step number) |

  Scenario: SDK works on external domain (CORS)
    Given test.html is served from a different origin (e.g., localhost:8001)
    When I open the test page
    Then the SDK loads without CORS errors
    And the modal appears
    And events are sent successfully

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] GET /api/sdk/[flow_id]/config endpoint exists
- [ ] Config endpoint returns flow structure
- [ ] GET /api/sdk/config handles missing flow gracefully
- [ ] POST /api/sdk/[flow_id]/events endpoint exists
- [ ] Events endpoint accepts event data
- [ ] CORS headers are present on config endpoint
- [ ] CORS headers are present on events endpoint
- [ ] SDK script tag is valid
- [ ] SDK loads on test page
- [ ] SDK fetches config on load
- [ ] Modal appears when SDK loads
- [ ] Modal renders native HTML dialog element
- [ ] User can navigate through steps
- [ ] User can dismiss the modal
- [ ] Events are fired when SDK runs
- [ ] Event data is correct
- [ ] SDK works on external domain (CORS)

**Phase 5 Status**: All tests must pass to move to Phase 6 (Analytics).
