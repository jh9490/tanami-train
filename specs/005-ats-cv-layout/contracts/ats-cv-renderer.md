# Contract: English ATS CV Renderer

## Input

`renderEnglishCVHtml(draft: NormalizedCVDraft)` receives a prepared English ATS draft.

## Required Output Characteristics

1. Return one semantic single-column HTML document.
2. Render a centered identity header using `fullName` and `contact.title` when available.
3. Render available contact values, including LinkedIn when supplied, directly beneath the identity line in centered compact rows.
4. Use Roboto-family styling, compact margins, black body text, and dark-blue centered section headings.
5. Render sections in this supported-field order:
   - Objective
   - Education
   - Experiences
   - Professional Development
   - Volunteer Experience
   - Skills
6. Preserve extracted content wording and escape HTML-sensitive characters.
7. Omit missing values cleanly.
8. Preserve existing page-break safeguards and avoid multi-column layout.

## Non-Goals For This Increment

- Adding new draft fields beyond LinkedIn
- Rewriting content for fit
- Changing Arabic renderer behavior
