## ADDED Requirements

### Requirement: Resources support PDF attachment
The system SHALL allow a leader with manage permission to attach a PDF file to a ministry resource, using the same upload mechanism already used for song and activity PDFs.

#### Scenario: Attaching a PDF to a new resource
- **WHEN** a leader creates a resource and selects a PDF file
- **THEN** the PDF is uploaded and the resulting resource stores the PDF's URL, key, file name, mime type, and size in its metadata

#### Scenario: Viewing a resource with a PDF
- **WHEN** a member views a resource that has an attached PDF
- **THEN** the resource card shows an "Abrir PDF" action linking to the PDF

### Requirement: Resource link is not required when a PDF is attached
The system SHALL allow submitting a resource with only a PDF attached and no explicit link, and SHALL allow submitting with only a link and no PDF, and SHALL allow both. The system SHALL still require at least one of the two.

#### Scenario: PDF-only resource
- **WHEN** a leader attaches a PDF and leaves the "Link" field blank
- **THEN** the resource is created successfully, using the uploaded PDF's URL as the resource's link

#### Scenario: Neither link nor PDF provided
- **WHEN** a leader attempts to save a resource with no link and no PDF
- **THEN** the system blocks submission with a message indicating at least one is required
