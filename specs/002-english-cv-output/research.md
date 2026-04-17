# Research: English CV Output From Arabic Drafts

## Decision: Keep Arabic as the default document language and add English as an explicit secondary output

**Rationale**: Feature `001` already established Arabic-first generation and export. Preserving Arabic as the default prevents regressions in the existing user flow and aligns the new feature with the product’s Arabic-first constitution.

**Alternatives considered**:

- Make English the new default: rejected because it would redefine the behavior shipped by `001`.
- Maintain separate Arabic and English forms: rejected because it duplicates user input and defeats the purpose of translating the existing Arabic draft.

## Decision: Use a native Android on-device translation engine for Arabic-to-English CV text

**Rationale**: The app already depends on native modules for PDF and share behavior. A native Android translation bridge keeps CV content on the device and avoids introducing a backend translation service for user data. This is the lowest-risk path for the current repository because Android has a straightforward local translation API with downloadable models.

**Alternatives considered**:

- Backend translation API: rejected because the feature explicitly requires device-side translation and would expand privacy and backend scope.
- Pure JavaScript dictionary or heuristic translation: rejected because it would be brittle and unsuitable for free-form CV text.

## Decision: Treat unsupported Android-device handling as a first-class feature outcome

**Rationale**: Device-side translation capability is not guaranteed in every Android device state. If English generation is unavailable, the app must explain that clearly and keep Arabic generation available instead of failing silently.

**Alternatives considered**:

- Hide the English option entirely on unsupported Android devices: rejected because the user still needs a clear explanation of feature availability in this increment.
- Allow selection but fail later with a generic PDF error: rejected because it mixes translation capability failures with document-generation failures.

## Decision: Preserve the entered full name as-is for English output

**Rationale**: Machine translation and transliteration are not equivalent, and person names are especially error-prone. Preserving the name as entered avoids silently generating a wrong Latin spelling in the exported CV.

**Alternatives considered**:

- Auto-transliterate or translate the name: rejected because accuracy cannot be assumed.
- Add a second English-name field in this increment: rejected to keep the change small and reuse the existing Arabic-first form.

## Decision: Keep this increment Android-only

**Rationale**: The active release need is Android support, and adding an iOS translation path would expand native scope without unblocking the current feature delivery.

**Alternatives considered**:

- Add an iOS placeholder implementation: rejected because the feature scope is explicitly Android-only now.
- Delay the feature until both platforms are implemented: rejected because Android can ship independently.

## Decision: Add a dedicated translation step before English HTML rendering instead of mixing translation into the renderer

**Rationale**: Separating translation from rendering keeps service responsibilities clear, makes failures easier to classify, and preserves the stable Arabic rendering path from feature `001`.

**Alternatives considered**:

- Translate inside the HTML renderer: rejected because it couples native translation state to string templating.
- Fork `cvService.ts` into unrelated Arabic and English pipelines: rejected because most validation and export logic is shared.
