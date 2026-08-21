## ADDED Requirements

### Requirement: Mark today's service as finished
The system SHALL let a pastor/admin record the actual end time of today's occurrence of a `ServiceTime`, distinct from and in addition to the existing manual attendance headcount.

#### Scenario: First tap of the day records the end time
- **WHEN** a pastor taps "Finalizar culto" for a given `ServiceTime` and no end time has been recorded for today's occurrence yet
- **THEN** the system records the current time as that occurrence's end time, upserting into today's `ServiceAttendance` row for that `ServiceTime`

#### Scenario: Second tap the same day overwrites the recorded time
- **WHEN** a pastor taps "Finalizar culto" again later the same day for the same `ServiceTime`
- **THEN** the system replaces the previously recorded end time with the new one, rather than rejecting the action or creating a duplicate record

#### Scenario: Recording an end time does not require a headcount
- **WHEN** a pastor taps "Finalizar culto" without having entered visitor/member counts for today's service
- **THEN** the system still records the end time successfully, leaving the headcount fields as they were (zero or previously entered)

#### Scenario: Recorded end time is visible after the fact
- **WHEN** a pastor returns to the Relatórios page later the same day, after tapping "Finalizar culto"
- **THEN** the system shows the recorded end time next to the action, so it's clear the tap registered
