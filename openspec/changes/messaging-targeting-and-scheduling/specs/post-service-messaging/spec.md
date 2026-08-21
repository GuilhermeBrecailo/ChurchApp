## MODIFIED Requirements

### Requirement: Manual send to a chosen audience
The system SHALL let a pastor/admin trigger an immediate send of a chosen template to a chosen audience — visitors, members, everyone active, or an explicit hand-picked list of roster members — pulling recipients from the church's roster.

#### Scenario: Send now to visitors
- **WHEN** a pastor picks a template and selects "Visitantes" and clicks "Enviar agora"
- **THEN** the system sends the rendered message to every roster member with status `VISITOR` and a phone number, and creates a log entry for the send

#### Scenario: Send now to a hand-picked list
- **WHEN** a pastor picks a template, selects specific roster members (any mix of `VISITOR`/`MEMBER` status), and clicks "Enviar agora"
- **THEN** the system sends the rendered message to exactly those roster members who have a phone number, creates a log entry with `audience: SELECTED`, and records which roster members were targeted

#### Scenario: Selected recipient list cannot cross churches
- **WHEN** a `SELECTED` send request includes a roster member ID that does not belong to the caller's active `crunchId`
- **THEN** the system rejects the request with a domain error and sends nothing

#### Scenario: Send blocked when WhatsApp isn't connected
- **WHEN** a pastor triggers a manual send but the church has no active WhatsApp connection
- **THEN** the system rejects the send with a domain error and does not create a log entry

#### Scenario: Recipient without a phone number is skipped
- **WHEN** the selected audience (bucket or hand-picked list) includes a roster member with no phone number
- **THEN** the system does not attempt to send to that member and counts them as a failure in the log

### Requirement: Recurring automatic message rules
The system SHALL let a pastor/admin create rules that automatically send a chosen template to a chosen audience a configurable number of minutes after a specific recurring service time (`ServiceTime`), without requiring manual action each week. When the actual end time of today's occurrence of that service has been recorded, the rule SHALL fire relative to that recorded time instead of the scheduled time.

#### Scenario: Create an automatic rule
- **WHEN** a pastor creates a rule linking a `ServiceTime`, an offset in minutes, a template, and an audience
- **THEN** the system saves the rule as active and it appears in the rules list

#### Scenario: Rule fires at the right time using the scheduled time
- **WHEN** the current time reaches the linked service time plus the rule's offset, the rule is active, and no actual end time has been recorded for today's occurrence
- **THEN** the system sends the rule's template to the rule's audience and records the firing so it does not repeat for the same week's occurrence

#### Scenario: Rule fires relative to the recorded end time when one exists
- **WHEN** today's occurrence of the rule's `ServiceTime` has a recorded end time (via "Finalizar culto"), the rule is active, and the current time reaches that recorded end time plus the rule's offset
- **THEN** the system sends the rule's template to the rule's audience and records the firing, using the recorded end time as the base instead of the scheduled service time

#### Scenario: Inactive rule does not fire
- **WHEN** a rule's `isActive` flag is false
- **THEN** the system does not fire it even if its scheduled or recorded-end-time target is reached

#### Scenario: Rule deactivated instead of deleted when referenced
- **WHEN** a pastor deletes a `MessageTemplate` or the underlying reasoning requires a rule to stop firing
- **THEN** the system allows disabling the rule via `isActive` without losing its configuration

## ADDED Requirements

### Requirement: Configurable birthday notification time
The system SHALL let a pastor/admin configure the time of day (per church) at which the daily birthday check runs, in addition to the existing on/off switch for automatic WhatsApp sending.

#### Scenario: Church sets a custom notification time
- **WHEN** a pastor sets the birthday notification time to a specific `HH:MM`
- **THEN** the system saves that time for the church and the daily birthday check treats that time (not 8am) as the earliest point it acts on that day for that church

#### Scenario: Church that never configures a time keeps today's behavior
- **WHEN** a church has never set a birthday notification time
- **THEN** the system uses `08:00` as the default, identical to the fixed behavior that existed before this change

#### Scenario: Push notification and WhatsApp send both respect the configured time
- **WHEN** the current time reaches a church's configured notification time and there is a birthday today
- **THEN** the system notifies the church's pastors via push, and additionally sends the WhatsApp birthday message if automatic sending is on and a template is configured — exactly as today, just gated on the configured time instead of a fixed 8am
