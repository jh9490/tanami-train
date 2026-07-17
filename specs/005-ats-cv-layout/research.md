# Research: Reference-Matched ATS CV Layout

## Decision 1: Reuse the existing HTML-to-PDF renderer seam

- **Decision**: Implement the new format in `src/services/cvHtmlRenderer.ts` instead of introducing a second export pipeline.
- **Rationale**: The current renderer already owns typography, section structure, and pagination behavior. Keeping the change there preserves the existing authenticated export flow and minimizes blast radius.
- **Alternatives considered**: New renderer service, DOCX generation, or native PDF composition. Rejected because they add architecture and dependency cost without improving the requested outcome.

## Decision 2: Treat the supplied DOCX as a visual contract, not a data-model expansion trigger

- **Decision**: Match the reference styling and layout using currently supported CV fields in this increment.
- **Rationale**: The current draft model does not yet contain nationality, LinkedIn, languages, references, or hard/soft-skill categories. Expanding the model would turn a formatting feature into a broader product change.
- **Alternatives considered**: Add every field visible in the sample document now. Rejected because that would require UI, sync, persistence, and translation changes beyond the user's immediate request.

## Decision 3: Use a dedicated English ATS visual profile while preserving Arabic output behavior

- **Decision**: Apply the reference-matched layout to English export, while leaving Arabic export on the existing RTL-friendly template.
- **Rationale**: The supplied reference is English, and Arabic output has its own typography and RTL requirements already protected by prior features.
- **Alternatives considered**: Replace both English and Arabic renderers with one shared template. Rejected because that risks regressing Arabic readability and layout correctness.

## Decision 4: Preserve ATS-safe structure over pixel-perfect hacks

- **Decision**: Use semantic single-column HTML, compact spacing, and vertical sections rather than tables, absolute positioning, or text tricks.
- **Rationale**: The sample document uses dense placement, but ATS compatibility and readable extraction remain product requirements.
- **Alternatives considered**: Exact-position layout with tables or fixed spacing. Rejected because it would be more brittle and less machine-readable.
