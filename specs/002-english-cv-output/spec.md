# Feature Specification: English CV Output From Arabic Drafts

**Feature Branch**: `[002-english-cv-output]`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Arabic remains the default CV output from spec 001, and authenticated users also need an English CV generated from the same pre-filled Arabic information using on-device translation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate an English CV from the Arabic draft on-device (Priority: P1)

An authenticated user who already entered CV data in Arabic can choose English output and generate an ATS-friendly English PDF without sending the CV content to a backend translation service.

**Why this priority**: This is the new product value. Without English output from the existing Arabic draft, the feature does not exist.

**Independent Test**: On a supported device, sign in, fill the CV in Arabic, switch the output language to English, generate the PDF, and confirm the resulting document uses English section labels and translated body text while preserving the original draft in the form.

**Acceptance Scenarios**:

1. **Given** an authenticated user has entered a valid Arabic CV draft, **When** the user selects English output and starts generation on a supported device, **Then** the system generates an English PDF from the existing draft on-device without requiring the user to re-enter the CV in English.
2. **Given** the user previously generated an Arabic CV from the same draft, **When** the user switches to English output, **Then** the system generates a separate English PDF artifact without deleting or overwriting the Arabic draft data in the form.

---

### User Story 2 - Keep Arabic as the default output while allowing language switching (Priority: P2)

An authenticated user sees Arabic as the default CV language and can intentionally switch to English output for generation when needed.

**Why this priority**: The new feature must extend the existing Arabic-first workflow instead of replacing it or making the default ambiguous.

**Independent Test**: Open the CV generator as an authenticated user and confirm the default selection is Arabic, then switch to English and back without losing the draft or causing navigation regressions.

**Acceptance Scenarios**:

1. **Given** the authenticated user opens the CV generator screen, **When** the form loads, **Then** Arabic output is selected by default.
2. **Given** the user changes the desired output language before generating, **When** the user returns to Arabic selection, **Then** the form content remains intact and Arabic generation still works through the existing export flow.

---

### User Story 3 - Explain unsupported Android or translation failures clearly (Priority: P3)

An authenticated user gets a clear explanation and a fallback path when English translation is unavailable or cannot complete on the device.

**Why this priority**: On-device translation depends on device capabilities and local model availability, so failure handling is part of the feature scope.

**Independent Test**: Attempt English generation on an unsupported Android device or force a translation failure, and confirm the app explains the issue, preserves the draft, and leaves Arabic generation available.

**Acceptance Scenarios**:

1. **Given** the current Android device cannot prepare the local English translation path for this release, **When** the user selects English output, **Then** the app explains that English generation is unavailable on that device and keeps Arabic generation available.
2. **Given** the device supports English translation but the translation step fails, **When** generation stops, **Then** the user sees a specific retryable message and the existing Arabic draft remains unchanged.

---

### Edge Cases

- What happens when the draft contains mixed Arabic and English terms such as product names, APIs, or company brands?
- What happens on first English generation when the device needs to prepare or download a local translation model before translating?
- How does the system behave if only some draft sections contain text and others are empty?
- What happens when the user’s full name is entered in Arabic and should not be auto-transliterated into an incorrect Latin spelling?
- What happens when the English option is selected on an Android device where the local model cannot be prepared?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST keep Arabic as the default CV output selection in the authenticated CV generator flow.
- **FR-002**: The system MUST allow an authenticated user to choose either Arabic or English output before generating the CV PDF.
- **FR-003**: The system MUST continue to support the Arabic PDF generation flow defined in feature `001-arabic-cv-export` without requiring duplicate CV data entry.
- **FR-004**: The system MUST generate the English CV from the existing Arabic draft on the device itself and MUST NOT send the CV content to a new backend translation endpoint.
- **FR-005**: The system MUST translate the user-entered CV content that is suitable for machine translation, including summary, experience content, education text, and skills, before rendering the English PDF.
- **FR-006**: The system MUST preserve the entered personal name as-is unless the user already supplied a Latin-script version, rather than guessing a transliteration automatically.
- **FR-007**: The system MUST surface progress or state so the user understands that English generation may include a translation step before PDF creation.
- **FR-008**: The system MUST produce a distinct generated artifact for English output so the user can export or share it through the existing CV export flow.
- **FR-009**: The system MUST explain clearly when English generation is unavailable on the current Android device for this release.
- **FR-010**: The system MUST preserve the Arabic draft and keep Arabic generation available after any English translation or generation failure.
- **FR-011**: The system MUST preserve authenticated-only access and the existing navigation constraints from feature `001-arabic-cv-export`.

### Key Entities *(include if feature involves data)*

- **CV Draft**: The Arabic-first structured CV data entered by the authenticated user and reused for both output languages.
- **CV Output Language**: The user-selected document language for generation, currently Arabic or English, with Arabic as the default.
- **Translated CV Snapshot**: The English-language, device-generated text representation derived from the Arabic draft for one generation attempt.
- **Translation Availability**: The Android device capability status that determines whether English generation can run locally.
- **Generated CV Artifact**: The generated PDF plus metadata such as filename, file path, output language, readiness state, and last error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of authenticated users entering the CV generator see Arabic selected as the default output during validation.
- **SC-002**: On supported devices in manual QA, at least 90% of valid English generation attempts complete successfully on the first try after any required local model preparation.
- **SC-003**: When English generation is unavailable on the current device, the app shows a specific fallback message in 3 seconds or less and leaves Arabic generation usable in the same session.
- **SC-004**: A user can switch between Arabic and English output selections without losing entered draft data in manual QA on supported devices.
- **SC-005**: The English PDF preserves extractable text for translated sections in the QA sample set and remains shareable through the existing export flow.

## Assumptions

- Feature `001-arabic-cv-export` remains the base capability and Arabic output continues to be the primary, default CV path.
- The first implementation increment supports on-device English translation on Android only.
- The first English generation on a supported device may require one-time local model preparation before offline translation is available.
- Existing export and authentication flows are reused rather than redesigned for bilingual CV management.
