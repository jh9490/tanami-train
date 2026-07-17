# Feature Specification: Bilingual CV Editing Sync

**Feature Branch**: `[003-bilingual-cv-editing-sync]`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "Draft a new spec for bilingual CV editing sync where switching Arabic/English auto-translates visible fields, keeps them editable, and reflects edits back when switching languages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch languages without re-entering the CV (Priority: P1)

An authenticated user filling out a CV in one language can switch to the other language and immediately see translated field values, including the full name, ATS contact section, certifications and courses, and volunteer experience, instead of empty inputs, so the bilingual draft can be completed from one starting point.

**Why this priority**: This is the core user value. Without automatic population on language switch, users still have to duplicate their work manually.

**Independent Test**: Sign in, fill the CV in Arabic, including the ATS contact section, certifications and courses, and volunteer experience, switch to English, and confirm the visible English fields are populated with translated values while remaining editable.

**Acceptance Scenarios**:

1. **Given** an authenticated user has entered CV content in Arabic, **When** the user switches the editing language to English, **Then** the app shows translated English values for eligible fields, including the ATS contact section, certifications and courses, and volunteer experience, without requiring the user to type them again.
2. **Given** an authenticated user has entered CV content in English, **When** the user switches the editing language to Arabic, **Then** the app shows translated Arabic values for eligible fields, including the ATS contact section, certifications and courses, and volunteer experience, without clearing the existing draft.

---

### User Story 2 - Start from profile defaults and keep local draft progress (Priority: P2)

An authenticated user can open the CV flow with default name and contact information prefilled from the same profile API used by the account screen, without demo sample content replacing the real draft, and any edits made in either language remain stored locally on the device for later continuation.

**Why this priority**: The bilingual workflow becomes much more usable if the user does not need to re-enter basic identity and contact data every session.

**Independent Test**: Sign in with an existing profile, open the CV flow, confirm Arabic and English name defaults plus contact fields are prefilled from the profile, edit both language versions, close and reopen the app, and confirm the draft restores from local device storage.

**Acceptance Scenarios**:

1. **Given** the authenticated user already has Arabic and English profile values in the account API, **When** the CV editor opens for the first time on the device, **Then** the bilingual draft starts with those name and contact defaults instead of empty fields.
2. **Given** the user edits CV fields in Arabic or English, **When** the app is closed or the user returns later on the same device, **Then** the latest local bilingual draft is restored without losing saved progress.
3. **Given** the authenticated user opens the CV editor without a saved local draft, **When** the screen loads, **Then** the draft starts from the user's real profile-derived values and empty editable fields rather than demo or sample CV entries.

---

### User Story 3 - Edit either language and keep the other language aligned (Priority: P3)

An authenticated user can edit translated content after switching languages, and those edits become the latest source for the opposite language the next time the user switches back.

**Why this priority**: Automatic translation is not enough unless users can correct phrasing and trust those corrections to carry through the bilingual workflow.

**Independent Test**: Enter content in Arabic, switch to English, edit one or more translated English fields including certifications and courses or volunteer experience, switch back to Arabic, and confirm the corresponding Arabic fields reflect the latest English edits instead of stale text.

**Acceptance Scenarios**:

1. **Given** the user edits a translated English field, **When** the user later switches back to Arabic, **Then** the corresponding Arabic field reflects the latest English edit through the same sync workflow.
2. **Given** the user edits an Arabic field after returning from English, **When** the user switches to English again, **Then** the corresponding English field reflects the latest Arabic edit rather than an older translated value.

---

### User Story 4 - Stay in control when translation is incomplete or unsuitable (Priority: P4)

An authenticated user can understand which content was translated automatically, review synced personal-name wording, keep protected wording such as brands intact, and recover cleanly when a field cannot be translated.

**Why this priority**: Bilingual drafting is only trustworthy if the app does not silently damage user-authored content or hide translation failures.

**Independent Test**: Populate a CV with a mix of free text, names, and brand terms, switch languages to verify full-name syncing, then force at least one translation failure or exception case and confirm the user can still review, edit, and continue working without losing draft data.

**Acceptance Scenarios**:

1. **Given** the user enters a full name in one language, **When** the app prepares the opposite-language field, **Then** the app auto-populates the full name in the other language and still allows the user to edit either version.
2. **Given** a field cannot be translated or synced, **When** the user switches languages, **Then** the app clearly identifies the affected field, preserves the current saved text, and allows the user to edit the target field manually.

---

### Edge Cases

- What happens when the user switches languages with only some CV sections filled and others left empty?
- What happens when the user edits the same field repeatedly across both languages during one session?
- What happens when a translated field was manually corrected by the user and a later switch would otherwise overwrite that correction?
- What happens when a field contains mixed Arabic, English, numbers, acronyms, URLs, or brand names?
- What happens when translation is temporarily unavailable for one or more fields during a language switch?
- What happens when the user adds multiple certification, course, or volunteer entries with partially completed fields?
- What happens when local draft storage exists but the profile API returns newer contact defaults?
- What happens when a user opens the CV editor for the first time after a demo/sample draft was previously used during development?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let authenticated users edit the CV draft in both Arabic and English within the existing CV workflow.
- **FR-002**: The system MUST keep Arabic as the default editing language when a new or existing CV draft is opened unless the user intentionally switches languages.
- **FR-003**: The system MUST include an ATS-friendly contact section in the bilingual draft and exported CV output.
- **FR-004**: The system MUST prefill available Arabic and English full-name values from the same authenticated profile API used by the account screen before the user starts manual editing.
- **FR-005**: The system MUST prefill available contact defaults for the CV contact section from the authenticated account/profile data available in the current app session, including profile values and the authenticated mobile number when available.
- **FR-006**: The system MUST save the bilingual CV draft locally on the device so the user can resume the latest Arabic and English edits later on the same device.
- **FR-007**: The system MUST restore the most recent locally saved bilingual draft when the authenticated user reopens the CV editor on the same device.
- **FR-008**: The system MUST include certifications and courses as a dedicated user-editable CV section in the bilingual draft.
- **FR-009**: The system MUST include volunteer experience as a dedicated user-editable CV section in the bilingual draft.
- **FR-010**: The system MUST automatically populate eligible target-language fields from the current source-language content when the user switches editing languages and the target-language field does not yet have a current synced value.
- **FR-011**: The system MUST allow the user to edit any auto-populated translated field before continuing with the draft.
- **FR-012**: The system MUST store Arabic and English field values as part of the same CV draft rather than requiring the user to maintain separate drafts.
- **FR-013**: The system MUST track, per synced field, which language version was edited most recently and treat that version as the source for the next sync into the opposite language.
- **FR-014**: The system MUST refresh the opposite-language field from the latest edited source value when the user switches languages, unless the user has explicitly chosen to keep the existing target-language wording unchanged.
- **FR-015**: The system MUST include the user's full name in the same bilingual sync behavior as other editable CV fields so the name is auto-populated and remains editable in both languages.
- **FR-016**: The system MUST indicate when visible field values were auto-populated through language sync so the user can review them before export or sharing.
- **FR-017**: The system MUST preserve all saved draft content when a language switch or sync attempt fails and MUST allow the user to continue editing manually.
- **FR-018**: The system MUST identify which fields could not be synced and present an actionable message instead of failing silently.
- **FR-019**: The system MUST keep the bilingual draft compatible with the existing CV generation flow so the currently selected output language uses the latest saved field values for that language, including the ATS contact section.
- **FR-020**: The system MUST continue to enforce authenticated-only access and the existing navigation constraints from the current CV feature set.
- **FR-021**: The system MUST apply the same bilingual sync behavior to repeatable entries inside certifications and courses and volunteer experience as it does to the rest of the editable CV content.
- **FR-022**: The system MUST preserve brands, acronyms, URLs, email addresses, phone numbers, and similar identity-specific text unless the user edits those values directly.
- **FR-023**: The system MUST initialize the authenticated CV editor from the user's real saved draft state and available profile defaults rather than from demo or sample CV content.
- **FR-024**: The system MUST ensure generated CV output contains only the authenticated user's current draft content and approved profile-derived defaults, unless the user explicitly types matching text.

### Key Entities *(include if feature involves data)*

- **Bilingual CV Draft**: One structured CV draft that contains paired Arabic and English values for user-editable content, including an ATS contact section, certifications and courses, and volunteer experience.
- **Localized Field Pair**: A single CV field represented in Arabic and English, along with sync metadata such as last edited language and last synced state.
- **Sync State**: The status of a field or draft during language switching, such as not yet synced, auto-populated, manually edited, failed, or user-preserved.
- **Protected Text Value**: A field value or substring that should remain as entered unless the user explicitly changes it, such as brands, acronyms, contact details, and URLs.
- **CV Contact Section**: Structured ATS-friendly contact data for the CV, including bilingual name values plus contact fields sourced from the authenticated profile and device session when available.
- **Certification or Course Entry**: A repeatable CV entry describing a certificate, training course, issuer, date, and related descriptive text in both languages.
- **Volunteer Experience Entry**: A repeatable CV entry describing a volunteer role, organization, dates, and contribution details in both languages.
- **Local Draft Snapshot**: The locally persisted device copy of the bilingual CV draft used to restore progress for the authenticated user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual QA, 100% of tested language switches populate previously empty counterpart fields for eligible content without deleting existing draft data.
- **SC-002**: In manual QA, at least 90% of tested bilingual field edits are reflected in the opposite language after the next switch without requiring duplicate manual entry.
- **SC-003**: In manual QA, authenticated users with existing profile data see name and contact defaults populated in the CV editor on first load without manual re-entry.
- **SC-004**: In manual QA, users can close and reopen the app on the same device and recover the latest locally saved bilingual CV draft without losing edits.
- **SC-005**: When a field cannot be synced, the app surfaces the affected field and recovery message within 3 seconds while preserving the rest of the draft.
- **SC-006**: In QA validation, the selected-language CV output reflects the latest saved values for that language across all required sections, including the ATS contact section, certifications and courses, and volunteer experience.
- **SC-007**: In manual QA, first-time entry to the authenticated CV editor and generated output contain no demo or sample resume data unless that text was entered by the user during the session.

## Assumptions

- This feature extends the existing authenticated CV workflow rather than creating a separate bilingual editor.
- Arabic remains the starting language for the draft experience, even though both languages become editable.
- Language syncing applies to user-authored text fields that represent CV content and does not require every field type to be translated in the same way.
- The ATS contact section can reuse authenticated profile values already fetched for the account flow instead of requiring a new backend CV-specific endpoint.
- Demo or sample CV content used during development is not part of the user-facing authenticated workflow for this increment.
- Certifications and courses plus volunteer experience are part of the editable CV structure for this feature increment rather than later follow-up work.
- Full name is intentionally included in bilingual syncing for this feature, while other protected identity-specific values remain preserved unless the user edits them.
- Local bilingual draft storage is device-scoped for the authenticated user and does not need cross-device synchronization in this increment.
- Users remain responsible for reviewing machine-produced wording before final export or sharing.
- Existing CV export capabilities remain in place and consume the bilingual draft rather than a separate export-only translation snapshot.
