Feature: Phase 7 - Error Handling & UX Polish

  These tests verify that the app handles errors gracefully and the UI is polished.

  Scenario: Publish error when flow has no steps
    Given I'm in the flow builder with an empty flow
    When I click "Publish"
    Then an error message appears
    And the error clearly states "Flow must have at least one step"
    And the publish is blocked (flow not published)

  Scenario: Publish error is dismissible
    Given an error message is displayed
    When I click a close button or click away
    Then the error message disappears
    And I can try again

  Scenario: Network error handling on publish
    Given the API is slow or unavailable
    When I click "Publish" and the request times out
    Then an error message appears
    And a "Retry" button is available
    And I can click "Retry" to try again

  Scenario: SDK fetch error handling
    Given the SDK config endpoint is slow or returns 500
    When a page loads with the SDK script tag
    Then the page doesn't break
    And a console warning appears (non-blocking)
    And the page is still usable

  Scenario: No console JavaScript errors
    Given I've used the app (signup, create flow, publish, embed SDK)
    When I open DevTools Console
    Then no red error messages appear
    And no undefined reference errors occur

  Scenario: UI has no placeholder text
    Given I'm using all parts of the app
    When I view any page (flows, builder, analytics, SDK install)
    Then I see no "TODO", "FIXME", "placeholder" text
    And all text is user-facing copy

  Scenario: Login form layout is clean
    Given I'm on the login page
    When I view the form
    Then the form is centered or properly aligned
    And inputs have proper spacing
    And button is clearly visible
    And no overlapping elements

  Scenario: Dashboard layout is clean
    Given I'm logged in on /dashboard
    When I view the page
    Then the navigation is clear
    And links are visible and clickable
    And text is readable with sufficient contrast
    And spacing between elements is consistent

  Scenario: Flow builder layout is clean
    Given I'm in the flow builder
    When I view the page
    Then the left sidebar (step list) is clearly visible
    And the middle section (step editor) is clear
    And the Publish button is prominent
    And no elements overlap

  Scenario: Modal styling is correct
    Given the SDK modal is displayed
    When I view it
    Then the modal has a visible backdrop (dark overlay)
    And the modal content is readable
    And text is properly sized
    And buttons are clickable
    And the modal is centered on the screen

  Scenario: Modal is accessible with keyboard
    Given a modal is open
    When I press Tab key
    Then focus moves through buttons
    And I can press Enter to click a button
    And I can press Escape to close the modal

  Scenario: Status badges are visually distinct
    Given I'm viewing the flows list
    When I look at the status column
    Then draft flows show a gray badge
    And live flows show a green badge
    And archived flows show a dark badge
    And colors are distinguishable

  Scenario: Links are underlined or clearly styled
    Given I'm using the app
    When I see links (navigation, etc.)
    Then links are visually distinct from regular text
    And link color follows convention (blue or brand color)
    And hover state is visible

  Scenario: Form labels are clear
    Given I'm on a form (login, signup, flow editor)
    When I view the form
    Then each input has a visible label
    And labels are above or beside inputs
    And required fields are marked

  Scenario: Error messages are visible
    Given an error occurs (form validation, network error, etc.)
    When an error message appears
    Then the message is in a contrasting color (red)
    And the message is clearly visible
    And it explains what went wrong in simple terms

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] Publish error when flow has no steps
- [ ] Publish error is dismissible
- [ ] Network error handling on publish
- [ ] SDK fetch error handling
- [ ] No console JavaScript errors
- [ ] UI has no placeholder text
- [ ] Login form layout is clean
- [ ] Dashboard layout is clean
- [ ] Flow builder layout is clean
- [ ] Modal styling is correct
- [ ] Modal is accessible with keyboard
- [ ] Status badges are visually distinct
- [ ] Links are underlined or clearly styled
- [ ] Form labels are clear
- [ ] Error messages are visible

**Phase 7 Status**: All tests must pass to move to Phase 8 (Verification & Ship).
