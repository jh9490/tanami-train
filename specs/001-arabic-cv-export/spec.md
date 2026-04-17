# Feature Specification: Authenticated Arabic CV PDF Export

**Feature Branch**: `[001-arabic-cv-export]`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Authenticated user can generate an ATS-compatible Arabic CV, and the current PDF generation or download flow is failing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate an ATS-friendly Arabic CV (Priority: P1)

An authenticated user completes the CV form in Arabic and generates a machine-readable CV document that preserves the entered content in a structured, ATS-compatible layout.

**Why this priority**: This is the core product value. Without successful CV generation, the feature does not exist.

**Independent Test**: Log in, open the CV generator, enter required profile data, and trigger generation. The result is a readable Arabic CV PDF whose text can be copied or indexed rather than rendered as an image.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the CV generator screen and has entered the required fields, **When** the user chooses to generate the CV, **Then** the system produces a PDF CV that contains the submitted Arabic content in the expected sections.
2. **Given** a guest user is not authenticated, **When** the user attempts to access the CV generator flow, **Then** the system prevents access and routes the user through the existing sign-in flow.

---

### User Story 2 - Save or share the generated CV reliably (Priority: P2)

An authenticated user can export the generated CV file and complete a save or share action without ambiguous failures.

**Why this priority**: A generated file is only useful if the user can actually keep it or send it to another destination.

**Independent Test**: Generate a CV and complete at least one export action successfully, confirming the file path and user-visible outcome.

**Acceptance Scenarios**:

1. **Given** a CV PDF has been generated successfully, **When** the user selects an export action, **Then** the system makes the PDF available to the operating system for saving or sharing.
2. **Given** an export target is unavailable or the user cancels the share sheet, **When** the export flow ends, **Then** the system handles the outcome gracefully without corrupting the generated file or blocking the screen.

---

### User Story 3 - Recover from generation and export failures (Priority: P3)

An authenticated user receives a clear explanation and a retry path when the device cannot generate or export the CV PDF.

**Why this priority**: The current requirement already includes a failure in the live flow, so recovery and observability are part of the feature scope rather than a polish item.

**Independent Test**: Trigger a known failure condition such as invalid form data, file write failure, or export rejection, and verify that the screen shows an actionable message with a retry path.

**Acceptance Scenarios**:

1. **Given** the PDF generator cannot create a valid file, **When** generation fails, **Then** the user sees a specific failure message and can retry without re-entering all data.
2. **Given** the export action fails after generation succeeds, **When** the error is returned, **Then** the system preserves the generated file context and explains the next step to the user.

---

### Edge Cases

- What happens when the user provides only the minimum required identity fields and leaves optional sections empty?
- How does the system handle very long Arabic text in experience descriptions without clipping, overlapping, or losing text in the generated PDF?
- What happens when the device cannot write to the chosen file location or the generated file path is empty?
- How does the system behave when the share sheet is dismissed intentionally by the user?
- What happens when the device is offline and external resources such as hosted fonts are unavailable?
- How does the system ensure the exported filename remains valid when the user name contains spaces or unsupported filename characters?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST make the CV generation flow available only to authenticated users.
- **FR-002**: The system MUST allow an authenticated user to enter and edit the CV content required for an ATS-compatible Arabic CV.
- **FR-003**: The system MUST validate required fields before attempting PDF generation and explain what is missing.
- **FR-004**: The system MUST generate a PDF document whose Arabic text remains machine-readable and sectioned for ATS parsing.
- **FR-005**: The system MUST avoid a runtime dependency on externally hosted assets that can cause PDF generation to fail on device.
- **FR-006**: The system MUST create a generated PDF artifact with a deterministic, user-safe filename.
- **FR-007**: The system MUST allow the user to complete at least one export action for the generated PDF after successful generation.
- **FR-008**: The system MUST surface generation progress so the user knows the export is in progress.
- **FR-009**: The system MUST show a specific, user-readable failure outcome when PDF generation fails.
- **FR-010**: The system MUST show a specific, user-readable failure outcome when PDF export fails after generation succeeds.
- **FR-011**: The system MUST preserve the user's entered CV data during a recoverable generation or export failure so the user can retry.
- **FR-012**: The system MUST preserve compatibility with the existing authenticated navigation flow and not expose the feature to guests through alternate entry paths.

### Key Entities *(include if feature involves data)*

- **CV Draft**: The structured set of user-entered fields used to generate a CV, including identity, summary, experiences, education, and skills.
- **CV Section Item**: A repeated item in the draft, such as one experience, one education entry, or one skill row.
- **Generated CV Artifact**: The generated PDF output plus metadata needed for export, such as filename, path, readiness state, and error state.
- **Export Outcome**: The final status of a share or save attempt, including success, cancellation, and recoverable failure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unauthenticated access attempts are redirected away from the CV generation flow during validation.
- **SC-002**: In manual QA on supported devices, at least 90% of valid CV generation attempts complete successfully on the first try without requiring the app to restart.
- **SC-003**: A valid Arabic CV can be generated and made available for export in 5 seconds or less on a representative mid-range Android device under normal conditions.
- **SC-004**: When generation or export fails, the user receives a specific recovery message within 3 seconds and can retry without re-entering previously entered data.
- **SC-005**: The generated PDF preserves extractable text for all required sections in the QA sample set, rather than rasterizing the content into non-selectable text.

## Assumptions

- The existing TanamiTrain authentication flow remains the source of truth for user identity and session state.
- The first implementation continues to use the existing in-app CV screen as the primary entry point rather than introducing a server-managed resume builder.
- The first release targets Arabic CV output only; bilingual or English resume support is outside this feature unless later added in a separate spec.
- CV generation is performed on-device and does not require a new backend endpoint in this phase.
- The current PDF generation failure is treated as part of this feature scope, not as a separate maintenance ticket.
