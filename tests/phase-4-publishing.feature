Feature: Phase 4 - Publishing System (Append-Only Versions)

  These tests verify that flows can be published and versions are immutable.

  Scenario: Flow builder UI displays correctly
    Given I'm editing a draft flow
    When the flow builder page loads
    Then the left sidebar shows a list of steps
    And the middle panel shows a form to edit the selected step
    And step form has fields: title, body, cta_label, dismiss_label
    And there is an "Add Step" button
    And there is a "Remove Step" button
    And there is a "Publish" button at the top

  Scenario: User can add steps to a flow
    Given I'm in the flow builder for a new flow
    When I click "Add Step"
    Then a new step is added to the list
    And the step count increases
    And I can repeat this to create multiple steps

  Scenario: User can edit step content
    Given a flow has a step with title="Welcome"
    When I edit the step and change title to="Start Here"
    And I click away from the field (blur event)
    Then the step title is updated in local state
    And I see "Start Here" in the step list

  Scenario: User can remove a step
    Given a flow has 3 steps
    When I select a step and click "Remove Step"
    Then the step is deleted from the list
    And the flow now has 2 steps

  Scenario: User can reorder steps
    Given a flow has steps: Step A, Step B, Step C
    When I use up/down buttons to reorder
    Then steps can be reordered
    And the new order is reflected in the step list

  Scenario: Publish button requires at least 1 step
    Given I'm in the flow builder with 0 steps
    When I click "Publish"
    Then an error message appears: "Flow must have at least one step"
    And the publish is blocked

  Scenario: User can publish a valid flow
    Given a flow has 2 steps with valid content
    When I click "Publish"
    Then the publish endpoint is called
    And a success message appears
    And a "Copy Script Tag" modal shows the flow_id
    And the user can copy the script tag

  Scenario: Publishing creates a flow_version row
    Given a flow with id="flow_pub1" is published with 2 steps
    When I check the flow_versions table in Prisma Studio
    Then a new row exists with:
      | Field | Value |
      | flow_id | flow_pub1 |
      | version_num | 1 |
      | config | (JSON with 2 steps) |
      | published_at | (recent timestamp) |

  Scenario: Publishing updates flow status to live
    Given a flow with id="flow_pub2" is in draft status
    When the flow is published
    Then in Prisma Studio, flows table shows:
      | id | status |
      | flow_pub2 | live |

  Scenario: Subsequent publish creates new version
    Given a flow has been published (version_num=1)
    When I edit the flow and publish again
    Then a new flow_version row is created with version_num=2
    And the old version_num=1 row still exists (append-only)
    And no row is UPDATEd or DELETEd

  Scenario: flow_versions is append-only (never UPDATE)
    Given flow_versions table has a row with id="v1", version_num=1
    When I try to update that row (directly via SQL)
    Then the update is blocked by database constraints
    Or if no constraints, manually verify:
      | id | version_num | (unchanged) |
      | v1 | 1 | (original value) |

  Scenario: Publish API returns version details
    Given a flow is published successfully
    When I check the POST /api/flows/[id]/publish response
    Then the response is JSON with status 201
    And includes: id, version_num, config, published_at
    And version_num is a positive integer

  Scenario: Script tag modal shows correct flow_id
    Given a flow with id="abc123xyz" is published
    When the success modal appears
    Then the script tag shown includes:
      | data-flow-id | abc123xyz |
      | src | https://your-domain.com/sdk.js |

## Test Results

Run each scenario manually and check the box when it passes:

- [ ] Flow builder UI displays correctly
- [ ] User can add steps to a flow
- [ ] User can edit step content
- [ ] User can remove a step
- [ ] User can reorder steps
- [ ] Publish button requires at least 1 step
- [ ] User can publish a valid flow
- [ ] Publishing creates a flow_version row
- [ ] Publishing updates flow status to live
- [ ] Subsequent publish creates new version
- [ ] flow_versions is append-only (never UPDATE)
- [ ] Publish API returns version details
- [ ] Script tag modal shows correct flow_id

**Phase 4 Status**: All tests must pass to move to Phase 5 (SDK).
