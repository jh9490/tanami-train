# Contract: CV Export Service

## Purpose

Define the application-facing contract for generating and exporting an authenticated user's Arabic CV PDF.

## Inputs

### Generate CV Request

- `draft`: validated CV Draft data
- `userContext`: authenticated session context already available in app state

## Generation Result

### Success

- Returns a Generated CV Artifact with:
  - `fileName`
  - `filePath`
  - `mimeType`
  - `status = generated`

### Failure

- Returns a recoverable error payload with:
  - `code`: stable error category
  - `message`: user-visible recovery message
  - `stage`: validation, generation, or export
  - `retryable`: boolean

## Export Request

- `artifact`: a successfully generated CV artifact
- `action`: share or save

## Export Result

### Success

- `status = exported`
- Optional destination detail when the native platform can provide it

### Cancellation

- `status = cancelled`
- No destructive cleanup of the current draft

### Failure

- `status = failed`
- Stable error code
- User-readable message
- Artifact context preserved for retry

## Behavioral Guarantees

- The service never exposes the CV flow to unauthenticated users.
- A failed export does not erase the current draft.
- A failure at one stage indicates whether retry is possible without re-entering all form data.
- Generated output must preserve text as text, not flattened images, for required ATS-visible sections.
