# Data Model: Reference-Matched ATS CV Layout

## Existing Entities Reused

### NormalizedCVDraft
- `fullName`
- `contact`
- `summary`
- `experiences[]`
- `education[]`
- `skills[]`
- `certifications[]`
- `volunteerExperiences[]`

### CVContactSection
- `email`
- `phone`
- `address`
- `linkedin`
- `title`

### CVExperience
- `title`
- `organization`
- `duration`
- `description`

### CVEducation
- `degree`
- `institution`
- `year`

### CVCertification
- `name`
- `issuer`
- `date`
- `details`

## Rendering Relationships

- `NormalizedCVDraft.fullName` + `contact.title` → centered identity line
- `contact.email`, `contact.phone`, `contact.address`, `contact.linkedin` → centered contact row beneath identity line
- `summary` → Objective section for English reference-matched export
- `education[]` → Education section
- `experiences[]` → Experiences section
- `certifications[]` → Professional Development section / certifications list
- `skills[]` → Skills section
- `volunteerExperiences[]` → Volunteer Experience section when present

## Validation Rules

- Empty optional fields are omitted without placeholders or broken separators.
- Historical collections continue using existing ATS reverse-chronological ordering before render.
- Long text remains user-authored; the renderer changes presentation only.

## Deferred Model Gaps

The reference document also includes nationality, languages, references, and hard/soft-skill categories. Those are not represented by the current draft model and are intentionally deferred from this formatting increment.
