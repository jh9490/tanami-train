# Data Model: Bilingual CV Editing Sync

## Bilingual CV Draft

**Purpose**: Hold one authenticated user’s bilingual CV content and its current editing preference inside the existing CV workflow.

**Fields**:

- `editingLanguage`: Current visible editor language, `ar` or `en`
- `contact`: ATS-friendly bilingual contact section with profile-derived defaults
- `fullName`: Localized field pair for the user name, editable in both languages
- `summary`: Localized field pair for the professional summary
- `experiences[]`: Repeatable bilingual work-history entries
- `education[]`: Repeatable bilingual education entries
- `skills[]`: Repeatable bilingual skill entries
- `certifications[]`: Repeatable bilingual certifications and courses entries
- `volunteerExperiences[]`: Repeatable bilingual volunteer experience entries

**Rules**:

- Arabic is the default `editingLanguage`.
- The draft stays a single document even though each field carries Arabic and English values.
- Export uses the latest saved values from the currently selected output language.
- The draft may start from authenticated profile defaults before the user makes manual CV-specific edits.

## CV Contact Section

**Purpose**: Represent ATS-friendly contact data that can be rendered near the top of the CV and reused across both languages.

**Fields**:

- `email`: Preserved contact value populated from the authenticated profile when available
- `phone`: Preserved contact value populated from the authenticated session mobile number when available
- `address`: Localized field pair populated from `address_ar` and `address_en` profile values when available
- `title`: Localized field pair populated from `title_ar` and `title_en` profile values when available

**Rules**:

- Profile-derived values are defaults, not locked values.
- The contact section participates in local persistence and export output.
- Email and phone remain protected values unless the user edits them directly.

## Localized Field Pair

**Purpose**: Represent one logical field that exists in Arabic and English and can move through sync states over time.

**Fields**:

- `ar`: Arabic text value
- `en`: English text value
- `lastEditedLanguage`: The language most recently changed by the user or accepted as the latest source
- `syncState`: Current state such as `not_synced`, `auto_populated`, `manually_edited`, `failed`, or `preserved`
- `lastSyncSourceLanguage`: The source language used for the most recent automatic sync, if any
- `lastSyncAt`: Last successful sync time for auditability within the active session
- `failureReason`: Optional field-level failure code or message when syncing did not complete

**Rules**:

- A field may start with content in only one language.
- Auto-populated target text remains editable.
- User-edited target text must not be silently discarded.

## Experience Entry

**Purpose**: Represent one bilingual work-history record.

**Fields**:

- `id`: Stable entry identifier for UI updates and sync alignment
- `title`: Localized field pair
- `organization`: Localized field pair
- `duration`: Localized field pair
- `description`: Localized field pair

**Rules**:

- Entries with only whitespace across all fields are ignored by export preparation.
- A non-empty description still requires at least one identity field to remain valid, matching the current validation behavior.

## Education Entry

**Purpose**: Represent one bilingual education record.

**Fields**:

- `id`: Stable entry identifier
- `degree`: Localized field pair
- `institution`: Localized field pair
- `year`: Localized field pair

**Rules**:

- Empty entries may be removed during draft normalization before export.
- Sync status is tracked per localized field, not only at the row level.

## Skill Entry

**Purpose**: Represent one bilingual skill value.

**Fields**:

- `id`: Stable entry identifier
- `value`: Localized field pair

**Rules**:

- Empty skill rows may be ignored during generation.
- Skills must participate in the same last-edited-language sync behavior as other fields.

## Certification Or Course Entry

**Purpose**: Represent one bilingual certification or course record.

**Fields**:

- `id`: Stable entry identifier
- `name`: Localized field pair
- `issuer`: Localized field pair
- `date`: Localized field pair
- `details`: Localized field pair

**Rules**:

- The section supports multiple entries.
- Partially completed entries must still preserve entered text and field-level sync status.

## Volunteer Experience Entry

**Purpose**: Represent one bilingual volunteer role record.

**Fields**:

- `id`: Stable entry identifier
- `role`: Localized field pair
- `organization`: Localized field pair
- `duration`: Localized field pair
- `description`: Localized field pair

**Rules**:

- Volunteer entries follow the same repeatable-entry behavior as work experience.
- Translation failure in one field must not discard the rest of the entry.

## Draft Sync Result

**Purpose**: Report the outcome of one language-switch sync attempt.

**Fields**:

- `sourceLanguage`: Language used as the sync source
- `targetLanguage`: Language being shown after the switch
- `updatedFieldIds[]`: Field identifiers successfully auto-populated or refreshed
- `preservedFieldIds[]`: Field identifiers intentionally left unchanged
- `failedFieldIds[]`: Field identifiers that could not be synced
- `message`: Optional user-facing summary for the UI

**Rules**:

- A partial success is valid if unaffected fields are preserved and failed fields are surfaced clearly.
- The sync result should be reusable by the screen to show status without re-deriving field changes from scratch.

## Local Draft Snapshot

**Purpose**: Persist the bilingual draft on the device so the authenticated user can continue later without re-entering saved content.

**Fields**:

- `profileId`: Authenticated profile identifier used to scope the draft locally when available
- `draft`: The latest serialized bilingual CV draft
- `savedAt`: Last local save timestamp
- `source`: Whether the restored draft came from profile defaults, local persistence, or a merged result

**Rules**:

- Local storage is scoped to the authenticated user on the current device.
- Restoring a local draft must not discard newer in-progress edits during the same session.
