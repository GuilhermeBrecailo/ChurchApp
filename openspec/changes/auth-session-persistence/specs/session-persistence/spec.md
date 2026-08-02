## ADDED Requirements

### Requirement: Login session survives 7 days of inactivity
The system SHALL allow a member who authenticated within the last 7 days to return to the web app without being redirected to `/login`, provided their refresh token has not been explicitly revoked (e.g. via logout).

#### Scenario: Returning within 7 days
- **WHEN** a member closes the app and returns within 7 days of their last activity, with their `refresh_token` cookie still present
- **THEN** the app silently restores their session via the refresh flow and does not show the login screen

#### Scenario: Returning after 7 days of inactivity
- **WHEN** a member returns more than 7 days after their last activity
- **THEN** the refresh attempt fails and the member is redirected to `/login` (expected — 7 days is the persistence window, not indefinite)

#### Scenario: Explicit logout
- **WHEN** a member explicitly logs out
- **THEN** their refresh token is invalidated and a subsequent visit requires logging in again, regardless of how much time has passed

### Requirement: Refresh failures are diagnosable
The system SHALL log the reason for a failed token refresh (Keycloak error status/body) server-side, rather than only surfacing a generic redirect to the client.

#### Scenario: Refresh fails due to an expired or invalid refresh token
- **WHEN** `POST /public/auth/refresh-token` fails because Keycloak rejects the refresh token
- **THEN** the backend logs the failure reason returned by Keycloak
