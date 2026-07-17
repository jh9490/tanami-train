# Feature Specification: Reference-Matched ATS CV Layout

**Feature Branch**: `[005-ats-cv-layout]`  
**Created**: 2026-04-24  
**Updated**: 2026-05-16  
**Status**: Draft  
**Input**: User description: "Reformat extracted CV file sections and styling to match the provided reference CV exactly, including section order, layout, font family, font sizes, spacing, and overall visual structure. Add a clear divider line beneath each section title and support a LinkedIn profile link in the generated CV."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export an ATS CV that visually matches the approved reference (Priority: P1)

An authenticated user can generate an ATS CV whose layout and typography follow the approved reference document, so the exported result feels consistent, familiar, and ready for delivery without manual reformatting.

**Why this priority**: The main value of the feature is faithful reproduction of the target CV format, not only generic ATS compatibility.

**Independent Test**: Generate a CV with data for every supported section and compare the export against the approved reference for page structure, section order, alignment, colors, font family, font sizes, section divider lines, and bullet treatment.

**Acceptance Scenarios**:

1. **Given** the user has a complete CV draft, **When** the user generates the ATS CV, **Then** the export follows the approved reference's single-column layout and section sequence.
2. **Given** the export contains a header, section headings, body copy, role rows, and lists, **When** the CV is generated, **Then** each text category uses the approved visual treatment from the reference document, including a visible divider line beneath each section heading.
3. **Given** the user reviews the generated CV beside the reference document, **When** matching fields are present in both files, **Then** the generated CV is visually consistent with the approved template without requiring manual style cleanup.

---

### User Story 2 - Preserve extracted content while placing it into the reference structure (Priority: P2)

An authenticated user can trust that extracted CV content is reorganized into the approved reference structure without losing meaningful data or inventing new wording.

**Why this priority**: A faithful layout is only useful if the underlying content remains accurate and complete.

**Independent Test**: Import or prepare CV content with profile, LinkedIn, education, experience, development, skills, languages, and references data, generate the ATS CV, and confirm each supported field appears in the correct destination section using the user's original meaning.

**Acceptance Scenarios**:

1. **Given** extracted CV content includes fields that map to reference sections, **When** the ATS CV is generated, **Then** those fields appear under the matching approved section labels and in the approved order.
2. **Given** an experience item includes role, employer, location, dates, and achievement bullets, **When** it is exported, **Then** the role line and its bullets follow the same information pattern as the reference document.
3. **Given** the user has provided a LinkedIn profile link, **When** the ATS CV is generated, **Then** the link appears in the approved contact-header area with the other contact details.
4. **Given** a field is absent from the user's data, **When** the ATS CV is generated, **Then** the export omits that unavailable value cleanly rather than leaving placeholder text or broken separators.

---

### User Story 3 - Keep the reference format stable across realistic CV lengths (Priority: P3)

An authenticated user with short or long CV content gets a readable export that keeps the approved template language and remains ATS-safe even when the content grows beyond one page.

**Why this priority**: The format should be dependable in real usage, not only for one ideal sample CV.

**Independent Test**: Generate one CV that fits on one page and another with longer history that requires two pages, then confirm both preserve the approved single-column structure, styling hierarchy, and reading order.

**Acceptance Scenarios**:

1. **Given** the user's content fits on one page, **When** the ATS CV is generated, **Then** the export uses the approved dense one-page presentation style.
2. **Given** the user's content exceeds one page, **When** the ATS CV is generated, **Then** the export continues onto a second page without switching to columns or changing the approved typography hierarchy.
3. **Given** long content approaches a page break, **When** the ATS CV is generated, **Then** headings, role rows, and their related bullets are kept together as much as possible to preserve readability.

---

### Edge Cases

- What happens when the user has no objective/profile text but the rest of the CV is complete?
- How should education entries render when some values such as GPA, institution, or graduation year are missing?
- What happens when an experience entry has a very long title, employer name, or location that cannot fit on one line with the date range?
- How should development content render when the user has only courses, only certifications, or both?
- How should skills behave when there are many items but the approved reference format expects compact vertical lists?
- What happens when references are unavailable or the user has fewer reference fields than the template example?
- What happens when the user provides a LinkedIn link without other optional contact fields, or provides a malformed/partial link?
- How should the layout behave when generated content extends beyond one page while still needing to preserve ATS-safe reading order?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST generate the ATS CV in a single-column reading order matching the approved reference document.
- **FR-002**: The system MUST use the approved section sequence when matching data is available: header identity block, objective, education, experiences, professional development, hard skills, soft skills, languages, and references.
- **FR-003**: The system MUST place the candidate name on its own centered header line and the target job title on a separate centered line directly beneath it when both values are available.
- **FR-004**: The system MUST place contact details beneath the identity line in centered compact header rows, following the approved reference pattern for email, phone, location, nationality, and LinkedIn when those values are available.
- **FR-005**: The system MUST apply a modern sans-serif font family for the generated ATS CV, using Roboto as the approved reference font for this feature.
- **FR-006**: The system MUST apply the approved typography hierarchy from the reference: 18 pt bold header name/job-title line, 10 pt body text for the main CV content, and bold section headings in the approved dark-blue accent color.
- **FR-007**: The system MUST render approved section headings as centered labels with the same heading treatment used in the reference document, including the dark-blue accent color `#1F4E79` where the reference uses that style.
- **FR-008**: The system MUST render a visible horizontal divider line directly beneath each section heading so every section has a clear visual start in the generated CV.
- **FR-009**: The system MUST render body text in black and preserve bold emphasis for role titles, selected labels, and section subheads where the reference establishes that pattern.
- **FR-010**: The system MUST render experience entries with a role/employer/location line followed by achievement bullets, and MUST keep date ranges visually aligned with their corresponding role line as closely as the available page width allows.
- **FR-011**: The system MUST render list-based content using the approved bullet style pattern from the reference document rather than introducing numbered lists or multi-column skill blocks.
- **FR-012**: The system MUST render professional development as a parent section with supported child groups such as courses and professional certifications when corresponding user data exists.
- **FR-013**: The system MUST render hard skills, soft skills, languages, and references in the same vertical, section-by-section structure used by the approved reference.
- **FR-014**: The system MUST support a LinkedIn profile link as an exportable contact field in the generated ATS CV.
- **FR-015**: The system MUST preserve user-provided meaning and MUST NOT silently invent, paraphrase, or rewrite extracted CV content solely to satisfy layout fit.
- **FR-016**: The system MUST omit unavailable optional values cleanly, without unresolved placeholders, duplicate separators, or visibly broken formatting.
- **FR-017**: The system MUST preserve reverse-chronological ordering for date-based sections, with ongoing entries shown ahead of older completed entries.
- **FR-018**: The system MUST preserve ATS-safe machine-readable text and a clear top-to-bottom reading order after the reference styling is applied.
- **FR-019**: The system MUST keep the approved one-page density when content permits, and MUST continue onto a second page when needed instead of switching to a multi-column fallback.
- **FR-020**: The system MUST keep headings with their first related content block whenever practical so the exported CV does not strand headings at page bottoms.
- **FR-021**: The system MUST match the approved page geometry from the reference document closely enough that manual QA can verify comparable page size, compact margins, and dense vertical spacing.
- **FR-022**: The system MUST support a visual-review workflow in which generated exports can be checked against the approved reference for typography, order, spacing, divider lines, and structural fidelity.
- **FR-023**: The system MUST apply the same approved ATS visual system to Arabic exports as to English exports while preserving Arabic RTL reading order and Arabic-appropriate typography.

### Key Entities *(include if feature involves data)*

- **Reference CV Template**: The approved target document that defines section order, typography, alignment, color accents, list style, and page density.
- **ATS CV Export Profile**: The set of rules that map user CV data into the reference-matched output structure while preserving ATS-safe reading order.
- **Header Identity Block**: The centered group containing candidate name, target role, and available contact metadata.
- **LinkedIn Profile Link**: An optional contact field representing the user's professional profile URL for display in the CV header.
- **Structured CV Section**: A named content group such as objective, education, experiences, professional development, skills, languages, or references.
- **Experience Entry**: A historical work item containing role, organization, location, date range, and supporting bullets.
- **Professional Development Group**: A parent section that may include child collections such as courses and certifications.
- **Exported ATS Artifact**: The generated CV document plus metadata needed for review, such as page count and generation outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual QA, 100% of generated exports follow the approved reference section order whenever corresponding data exists.
- **SC-002**: In manual QA, 100% of sampled English and Arabic exports use the approved typography hierarchy, heading treatment, divider-line treatment, and single-column structure defined by the feature.
- **SC-003**: In side-by-side visual review, at least 95% of checklist comparisons for spacing, alignment, color usage, and list treatment match the approved reference without manual editing.
- **SC-004**: In manual QA, 100% of exports with missing optional fields omit those values cleanly without placeholders, duplicate punctuation, or malformed separators.
- **SC-005**: In manual QA, 100% of exports with a provided LinkedIn value display that link in the contact header in the approved placement pattern.
- **SC-006**: In manual QA, 100% of tested date-based sections appear in newest-to-oldest order, with ongoing items ahead of completed items.
- **SC-007**: In manual QA, 100% of dense exports remain single-column and readable across one or two pages without clipped text, overlapping blocks, or multi-column fallback.
- **SC-008**: In content review, 0 extracted user statements are silently rewritten solely for layout fit.

## Assumptions

- The supplied document `ATS CV 4.docx` is the approved visual reference for this feature.
- “Match the same format” means reproducing the reference's intentional layout system and typography, not copying sample candidate content or incidental anomalies from the example file.
- The approved output uses a dense single-column presentation, Roboto throughout, a centered identity header, dark-blue centered section headings, clear section-divider lines, black body text, and compact vertical lists.
- The reference document's main text appears at 10 pt, with the candidate name/job-title line at 18 pt.
- Compact page geometry and spacing are part of the expected output style, while still preserving readable export quality and ATS compatibility.
- A second page is acceptable when needed; exact one-page fit is not required when the user's real content is longer than the reference sample.
- Reverse-chronological ordering applies to date-based sections and continues to govern the exported content even while the visual format changes.
