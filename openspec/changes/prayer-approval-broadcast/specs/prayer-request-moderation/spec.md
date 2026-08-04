## MODIFIED Requirements

### Requirement: Pastor can list pending prayer requests
The system SHALL expose an endpoint returning prayer requests awaiting review for the caller's active church, restricted to users with role `PASTOR`, `ADMIN`, or `SUPER_ADMIN`.

#### Scenario: Pastor views the pending queue
- **WHEN** a user with `role: PASTOR` calls `GET /api/church/prayer-requests/pending`
- **THEN** the system returns all `PENDING` requests for that pastor's `crunchId`, newest first

#### Scenario: Admin views the pending queue
- **WHEN** a user with `role: ADMIN` or `role: SUPER_ADMIN` calls `GET /api/church/prayer-requests/pending`
- **THEN** the system returns all `PENDING` requests for that admin's active `crunchId`, newest first

#### Scenario: Unauthorized member attempts to view the pending queue
- **WHEN** a user without `role: PASTOR`, `role: ADMIN`, or `role: SUPER_ADMIN` calls `GET /api/church/prayer-requests/pending`
- **THEN** the system rejects the request with a `DomainError`

### Requirement: Pastor can approve a pending prayer request
The system SHALL let a user with role `PASTOR`, `ADMIN`, or `SUPER_ADMIN` approve a pending request, making it visible to the congregation and notifying every active member of the church.

#### Scenario: Approval makes the request visible
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/approve` on a `PENDING` request belonging to their church
- **THEN** the system sets `status: APPROVED`, records `reviewedBy` and `reviewedAt`, and the request subsequently appears in `GET /api/church/prayer-requests`

#### Scenario: Admin approves a pending request
- **WHEN** a user with `role: ADMIN` or `role: SUPER_ADMIN` calls `PATCH /api/church/prayer-requests/:id/approve` on a `PENDING` request belonging to their active church
- **THEN** the system sets `status: APPROVED`, records `reviewedBy` and `reviewedAt`, exactly as when a pastor approves it

#### Scenario: Approving an already-reviewed request
- **WHEN** a `PASTOR`, `ADMIN`, or `SUPER_ADMIN` calls `PATCH /api/church/prayer-requests/:id/approve` on a request that is already `APPROVED` or `REJECTED`
- **THEN** the system rejects the action with a `DomainError` instead of re-applying the change

#### Scenario: Approving a request from another church
- **WHEN** a `PASTOR`, `ADMIN`, or `SUPER_ADMIN` calls `PATCH /api/church/prayer-requests/:id/approve` on a request whose `crunchId` does not match their active church
- **THEN** the system rejects the action with a `DomainError`

### Requirement: Pastor can reject a pending prayer request
The system SHALL let a user with role `PASTOR`, `ADMIN`, or `SUPER_ADMIN` reject a pending request, optionally with a reason, keeping it out of the congregation-facing list permanently.

#### Scenario: Rejection with a reason
- **WHEN** a `PASTOR` calls `PATCH /api/church/prayer-requests/:id/reject` with an optional `reason` on a `PENDING` request belonging to their church
- **THEN** the system sets `status: REJECTED`, records `reviewedBy`, `reviewedAt`, and `rejectionReason` (if provided), and the request never appears in `GET /api/church/prayer-requests`

#### Scenario: Admin rejects a pending request
- **WHEN** a user with `role: ADMIN` or `role: SUPER_ADMIN` calls `PATCH /api/church/prayer-requests/:id/reject` on a `PENDING` request belonging to their active church
- **THEN** the system sets `status: REJECTED` exactly as when a pastor rejects it

#### Scenario: Rejecting without a reason
- **WHEN** a `PASTOR`, `ADMIN`, or `SUPER_ADMIN` calls `PATCH /api/church/prayer-requests/:id/reject` without a `reason`
- **THEN** the system still rejects the request, leaving `rejectionReason` empty

#### Scenario: Rejecting an already-reviewed request
- **WHEN** a `PASTOR`, `ADMIN`, or `SUPER_ADMIN` calls `PATCH /api/church/prayer-requests/:id/reject` on a request that is already `APPROVED` or `REJECTED`
- **THEN** the system rejects the action with a `DomainError` instead of re-applying the change

## ADDED Requirements

### Requirement: Congregation is notified when a prayer request is approved
When a prayer request transitions to `APPROVED`, the system SHALL notify every active member of that church, reusing the same broadcast mechanism already used for church announcements.

#### Scenario: Approval broadcasts to all active members
- **WHEN** a `PASTOR`, `ADMIN`, or `SUPER_ADMIN` approves a `PENDING` prayer request
- **THEN** the system creates an `AppNotification` for every active `ChurchMembership` of that church and attempts a web push delivery, with `type: "prayer_request_approved"` and a `url` that deep-links to `/prayer`

#### Scenario: Rejection does not notify anyone
- **WHEN** a `PASTOR`, `ADMIN`, or `SUPER_ADMIN` rejects a `PENDING` prayer request
- **THEN** the system does not create any `AppNotification` or push delivery for that request
