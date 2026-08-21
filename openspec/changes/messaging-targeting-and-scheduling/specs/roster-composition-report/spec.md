## ADDED Requirements

### Requirement: Roster composition counts
The system SHALL show a pastor/admin how many active roster members are visitors and how many are members, scoped to their own church.

#### Scenario: Counts reflect current roster state
- **WHEN** a pastor views the roster composition report on the Relatórios page
- **THEN** the system shows the count of roster members with `status: VISITOR` and the count with `status: MEMBER`, computed live from the current roster (not a cached or stale snapshot)

#### Scenario: Former roster members are excluded
- **WHEN** the church's roster includes members with `status: FORMER`
- **THEN** those members are not counted in either the visitor or member total

#### Scenario: Report is church-scoped
- **WHEN** a pastor/admin from Church A views the report
- **THEN** the system shows counts only for Church A's roster, never another church's
