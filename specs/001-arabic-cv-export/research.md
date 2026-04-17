# Research: Authenticated Arabic CV PDF Export

## Decision 1: Remove runtime dependence on remote fonts during PDF generation

- **Decision**: Use bundled, app-available Arabic fonts or a converter-safe fallback strategy for PDF generation instead of relying on hosted font imports.
- **Rationale**: The current CV service builds HTML that imports a Google Font at runtime. Device-side PDF generation is more reliable when the output does not depend on network access or remote asset loading.
- **Alternatives considered**:
  - Keep the remote font import and accept intermittent generation risk: rejected because the active requirement already reports export failures.
  - Convert the CV to an image before PDF export: rejected because it would weaken ATS readability and text extraction.

## Decision 2: Separate CV content shaping from file export orchestration

- **Decision**: Treat CV data mapping, HTML rendering, PDF creation, and save/share orchestration as distinct responsibilities, even if some of them remain in the same service module initially.
- **Rationale**: The current `cvService.ts` handles HTML creation and immediate share behavior in one flow, which makes failures hard to isolate and recover from.
- **Alternatives considered**:
  - Keep the existing single-function flow: rejected because it obscures whether failures happen in validation, HTML generation, file creation, or share/export.
  - Move the entire feature to a backend service: rejected for this phase because the requirement is to stabilize the existing mobile flow, not redesign the product architecture.

## Decision 3: Preserve on-screen form state across recoverable failures

- **Decision**: Treat PDF generation and export as recoverable operations that must not clear the entered CV draft when they fail.
- **Rationale**: The user value is lost if export failures force the user to retype the CV. This is especially important because the live issue already involves failure during generation or download.
- **Alternatives considered**:
  - Reset the form after each attempt: rejected because it makes retry behavior hostile and increases user effort.
  - Save every attempt to the backend: rejected for this first phase because no backend CV storage contract exists in the current app.

## Decision 4: Validate export behavior on native runtime, not only through code inspection

- **Decision**: Require Android device or emulator validation as part of completion, with iOS validation when that environment is available.
- **Rationale**: The failing behavior is rooted in native modules and file handling, which cannot be fully validated by static reasoning or JavaScript-only checks.
- **Alternatives considered**:
  - Limit validation to linting and Jest: rejected because those checks do not exercise native PDF generation or share sheets.
  - Postpone runtime validation until after merge: rejected because native reliability is part of the feature definition.
