## ADDED Requirements

### Requirement: Message templates
The system SHALL allow a pastor/admin to create, edit, and delete reusable message templates scoped to their church, each with a name and a text body that may contain the placeholder `{nome}`.

#### Scenario: Create a template
- **WHEN** a pastor submits a new template with a name and body containing `{nome}`
- **THEN** the system saves the template scoped to the pastor's church and it appears in the template list

#### Scenario: Placeholder substitution at send time
- **WHEN** a template containing `{nome}` is sent to a recipient
- **THEN** the system replaces `{nome}` with that recipient's roster name before sending, leaving the rest of the text unchanged

#### Scenario: Non-privileged user cannot manage templates
- **WHEN** a user who is not a pastor/admin (not `isPrivilegedRole`) calls a template create/update/delete endpoint
- **THEN** the system rejects the request with a domain error and makes no change

### Requirement: Manual send to a chosen audience
The system SHALL let a pastor/admin trigger an immediate send of a chosen template to a chosen audience (visitors, members, or everyone active), pulling recipients from the church's roster.

#### Scenario: Send now to visitors
- **WHEN** a pastor picks a template and selects "Visitantes" and clicks "Enviar agora"
- **THEN** the system sends the rendered message to every roster member with status `VISITOR` and a phone number, and creates a log entry for the send

#### Scenario: Send blocked when WhatsApp isn't connected
- **WHEN** a pastor triggers a manual send but the church has no active WhatsApp connection
- **THEN** the system rejects the send with a domain error and does not create a log entry

#### Scenario: Recipient without a phone number is skipped
- **WHEN** the selected audience includes a roster member with no phone number
- **THEN** the system does not attempt to send to that member and counts them as a failure in the log

### Requirement: Recurring automatic message rules
The system SHALL let a pastor/admin create rules that automatically send a chosen template to a chosen audience a configurable number of minutes after a specific recurring service time (`ServiceTime`), without requiring manual action each week.

#### Scenario: Create an automatic rule
- **WHEN** a pastor creates a rule linking a `ServiceTime`, an offset in minutes, a template, and an audience
- **THEN** the system saves the rule as active and it appears in the rules list

#### Scenario: Rule fires at the right time
- **WHEN** the current time reaches the linked service time plus the rule's offset, and the rule is active
- **THEN** the system sends the rule's template to the rule's audience and records the firing so it does not repeat for the same week's occurrence

#### Scenario: Inactive rule does not fire
- **WHEN** a rule's `isActive` flag is false
- **THEN** the system does not fire it even if its scheduled time is reached

#### Scenario: Rule deactivated instead of deleted when referenced
- **WHEN** a pastor deletes a `MessageTemplate` or the underlying reasoning requires a rule to stop firing
- **THEN** the system allows disabling the rule via `isActive` without losing its configuration

### Requirement: Send history
The system SHALL record every send (manual or automatic) in a history log showing when it happened, which template and audience were used, and how many recipients succeeded versus failed.

#### Scenario: Log created on manual send
- **WHEN** a manual send is triggered
- **THEN** the system creates a log entry with status `PROCESSING`, updates success/failure counts as sends complete, and marks it `DONE` when finished

#### Scenario: Log created on automatic rule fire
- **WHEN** an automatic rule fires
- **THEN** the system creates a log entry linked to that rule, following the same processing/counting/completion behavior as a manual send

#### Scenario: History is read-only and church-scoped
- **WHEN** a pastor/admin views the message history
- **THEN** the system shows only log entries belonging to their own church, ordered most recent first, with no edit action available
