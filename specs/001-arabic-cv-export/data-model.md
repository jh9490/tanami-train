# Data Model: Authenticated Arabic CV PDF Export

## CV Draft

Represents the user-entered content that will be rendered into an ATS-compatible Arabic CV.

### Fields

- `fullName`: required display name used in the document header and filename seed
- `summary`: optional professional summary or objective
- `experiences`: ordered collection of experience items
- `education`: ordered collection of education items
- `skills`: ordered collection of skill items

### Validation Rules

- `fullName` is required and cannot be blank.
- Repeated list items with all-empty fields should be ignored or blocked before export.
- Optional sections may be omitted from the final CV if no valid entries are present.

## Experience Item

Represents one employment or practical experience row in the draft.

### Fields

- `id`: local stable identifier for editing and removal
- `title`: role or position name
- `organization`: employer or institution name
- `duration`: human-readable date range
- `description`: optional responsibility or achievement text

### Validation Rules

- At least one identifying field should be present before an experience item is rendered.
- Description text must remain text-selectable in the final PDF.

## Education Item

Represents one education row in the draft.

### Fields

- `id`: local stable identifier for editing and removal
- `degree`: degree or program name
- `institution`: school or university name
- `year`: graduation or completion year

## Skill Item

Represents one skill token or line item in the draft.

### Fields

- `id`: local stable identifier for editing and removal
- `value`: skill label to display in the document

## Generated CV Artifact

Represents the result of a successful PDF generation attempt.

### Fields

- `fileName`: sanitized filename intended for user-facing export
- `filePath`: absolute device path returned by the PDF generation step
- `mimeType`: PDF media type
- `status`: generated, exported, cancelled, or failed
- `lastError`: recoverable error details for the most recent failed action

## State Transitions

- `draft-editing` -> `validating` when the user starts generation
- `validating` -> `generation-failed` if required data is invalid
- `validating` -> `generating-pdf` when the draft passes validation
- `generating-pdf` -> `generated` when a file path is returned
- `generating-pdf` -> `generation-failed` when the converter returns an error or empty file path
- `generated` -> `exporting` when the user starts a share or save action
- `exporting` -> `exported` on success
- `exporting` -> `cancelled` when the user dismisses the export action intentionally
- `exporting` -> `export-failed` when the OS or native library rejects the export
