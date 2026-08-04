## Purpose

Pastor review workflow for prayer requests: a member-submitted prayer request stays hidden from the congregation until a pastor of that church approves it. Submission notifies every active pastor (in-app + push); approval makes the request visible; rejection keeps it permanently hidden.

## Requirements

### Requirement: Prayer requests start pending review
When a member submits a prayer request, the system SHALL create it with `status: PENDING` instead of making it immediately visible to the church.

#### Scenario: Member submits a new prayer request
- **WHEN** an authenticated member of a church calls `POST /api/church/prayer-requests` with a valid `title` and `body`
- **THEN** the system creates a `PrayerRequest` row with `status: PENDING`, scoped to the member's active `crunchId`

#### Scenario: Pending request is invisible to the congregation
- **WHEN** a member (of any role) calls `GET /api/church/prayer-requests`
- **THEN** the response only includes requests with `status: APPROVED`, excluding any `PENDING` or `REJECTED` requests

### Requirement: Pastor is notified when a prayer request is submitted
When a prayer request is created, the system SHALL notify every active `PASTOR` member of that church.

#### Scenario: Single pastor church
- **WHEN** a member submits a prayer request in a church with one active `PASTOR` membership
- **THEN** the system creates an `AppNotification` for that pastor and attempts a web push delivery via the existing push subscription mechanism, with `type: "prayer_request_pending"` and a `url` that deep-links to the pending review tab

#### Scenario: Multiple pastors in the church
- **WHEN** a member submits a prayer request in a church with more than one active `PASTOR` membership
- **THEN** the system notifies all of them, not only one

#### Scenario: Church has no active pastor
- **WHEN** a member submits a prayer request in a church with zero active `PASTOR` memberships
- **THEN** the request is still created with `status: PENDING` and the system logs a warning instead of failing the request

### Requirement: Pastor can list pending prayer requests
The system SHALL expose a pastor-only endpoint returning prayer requests awaiting review for the pastor's active church.

#### Scenario: Pastor views the pending queue
- **WHEN** a user with `role: PASTOR` calls `GET /api/church/prayer-requests/pending`
- **THEN** the system returns all `PENDING` requests for that pastor's `crunchId`, newest first

#### Scenario: Non-pastor attempts to view the pending queue
- **WHEN** a user without `role: PASTOR` calls `GET /api/church/prayer-requests/pending`
- **THEN** the system rejects the request with a `DomainError`

### Requirement: Pastor can approve a pending prayer request
The system SHALL let a pastor approve a pending request, making it visible to the congregation.

#### Scenario: Approval makes the request visible
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/approve` on a `PENDING` request belonging to their church
- **THEN** the system sets `status: APPROVED`, records `reviewedBy` and `reviewedAt`, and the request subsequently appears in `GET /api/church/prayer-requests`

#### Scenario: Approving an already-reviewed request
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/approve` on a request that is already `APPROVED` or `REJECTED`
- **THEN** the system rejects the action with a `DomainError` instead of re-applying the change

#### Scenario: Approving a request from another church
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/approve` on a request whose `crunchId` does not match their active church
- **THEN** the system rejects the action with a `DomainError`

### Requirement: Pastor can reject a pending prayer request
The system SHALL let a pastor reject a pending request, optionally with a reason, keeping it out of the congregation-facing list permanently.

#### Scenario: Rejection with a reason
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/reject` with an optional `reason` on a `PENDING` request belonging to their church
- **THEN** the system sets `status: REJECTED`, records `reviewedBy`, `reviewedAt`, and `rejectionReason` (if provided), and the request never appears in `GET /api/church/prayer-requests`

#### Scenario: Rejecting without a reason
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/reject` without a `reason`
- **THEN** the system still rejects the request, leaving `rejectionReason` empty

#### Scenario: Rejecting an already-reviewed request
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/reject` on a request that is already `APPROVED` or `REJECTED`
- **THEN** the system rejects the action with a `DomainError` instead of re-applying the change
