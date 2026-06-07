Feature: Phase 2 - Authentication (Signup, Login, Sessions)

  These tests verify that users can sign up, log in, and sessions include orgId for multi-tenancy.

  Scenario: User can access signup page
    Given the app is running on localhost:3000
    When I navigate to /signup
    Then the signup form is displayed
    And the form has email input field
    And the form has password input field
    And there is a "Sign Up" button

  Scenario: New user can sign up successfully
    Given I'm on the signup page
    When I enter email "testuser@example.com" and password "secure123"
    And I click the "Sign Up" button
    Then I am redirected to /dashboard
    And the page displays "Welcome to OnboardMe" or similar greeting
    And I see a blank dashboard (no flows yet)

  Scenario: Signup creates organisation in database
    Given a user has completed signup with email "testuser2@example.com"
    When I open Prisma Studio (npx prisma studio)
    And I view the organisations table
    Then a new row exists with:
      | Field | Value |
      | name  | (generated from email or default) |
      | api_key | (non-empty string) |
      | created_at | (recent timestamp) |

  Scenario: API key is generated on signup
    Given a new organisation is created via signup
    When I check the organisations table in Prisma Studio
    Then the api_key field is populated
    And api_key is a non-empty string
    And api_key appears to be unique

  Scenario: User can access login page
    Given the app is running
    When I navigate to /login
    Then the login form is displayed
    And the form has email input field
    And the form has password input field
    And there is a "Log In" button

  Scenario: User can log in with correct credentials
    Given a user signed up with email "testuser3@example.com" and password "mypass456"
    When I navigate to /login
    And I enter email "testuser3@example.com" and password "mypass456"
    And I click "Log In"
    Then I am redirected to /dashboard
    And the dashboard is displayed

  Scenario: Login fails with incorrect password
    Given a user exists with email "testuser4@example.com" and password "correct123"
    When I navigate to /login
    And I enter email "testuser4@example.com" and password "wrong456"
    And I click "Log In"
    Then I remain on the /login page
    And an error message appears (e.g., "Invalid credentials")

  Scenario: Session includes orgId
    Given a user is logged in
    When I check the session (via browser console or API call)
    Then the session object includes:
      | Field | Present |
      | user.email | yes |
      | user.orgId | yes |

  Scenario: User can log out
    Given a user is logged in and viewing /dashboard
    When I click the "Log Out" button (if visible in navigation)
    Then I am redirected to /login
    And the session is cleared

  Scenario: Auth routes are protected
    Given I am logged out
    When I try to navigate directly to /dashboard
    Then I am redirected to /login

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] User can access signup page
- [ ] New user can sign up successfully
- [ ] Signup creates organisation in database
- [ ] API key is generated on signup
- [ ] User can access login page
- [ ] User can log in with correct credentials
- [ ] Login fails with incorrect password
- [ ] Session includes orgId
- [ ] User can log out
- [ ] Auth routes are protected

**Phase 2 Status**: All tests must pass to move to Phase 3 (Flow CRUD API).
