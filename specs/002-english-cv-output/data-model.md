# Data Model: English CV Output From Arabic Drafts

## CV Draft

**Purpose**: Preserve the user-entered, Arabic-first source content for all generation attempts.

**Fields**:

- `fullName`: Required display name, preserved as entered for both output languages
- `summary`: Optional professional summary
- `experiences[]`: Repeated work-history entries with title, organization, duration, and description
- `education[]`: Repeated education entries with degree, institution, and year
- `skills[]`: Repeated skill values

**Rules**:

- Validation rules from feature `001` still apply.
- The source draft remains the system of record even when English output is generated.

## CV Output Language

**Purpose**: Capture the requested document language for one generation attempt.

**Values**:

- `ar`: Default Arabic output
- `en`: English output derived from the Arabic draft

**Rules**:

- Default value is `ar`.
- The selected value affects rendering, file metadata, and whether a translation step is required.

## Translation Availability

**Purpose**: Represent whether English generation can run locally on the current Android device.

**Fields**:

- `supported`: Whether the device can run the English translation path for this increment
- `reason`: Optional unsupported or degraded state code for UI messaging
- `message`: User-facing explanation for unsupported or failed preparation states

**Rules**:

- If `supported` is false, the app keeps Arabic generation available.
- Availability is evaluated independently from PDF export.

## Translated CV Snapshot

**Purpose**: Hold the English text produced from one Arabic draft before HTML rendering.

**Fields**:

- `fullName`: Preserved from the source draft without automatic transliteration
- `summary`: Translated summary text when present
- `experiences[]`: Translated experience fields
- `education[]`: Translated education fields
- `skills[]`: Translated skill values

**Rules**:

- Snapshot data is derived, not user-authored.
- The snapshot is disposable after generation and does not replace the source draft.

## Generated CV Artifact

**Purpose**: Represent a generated PDF ready for export.

**Fields**:

- `fileName`: Sanitized output filename
- `filePath`: Device path to the generated PDF
- `mimeType`: PDF content type
- `language`: Output language of the generated file
- `status`: Generated, exported, cancelled, or failed
- `lastError`: Most recent generation or export error, if any

**Rules**:

- Arabic and English artifacts are distinct generation results.
- Export behavior reuses the existing artifact contract from feature `001`.
