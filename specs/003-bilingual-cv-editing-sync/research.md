# Research: Bilingual CV Editing Sync

## Decision: Reuse the existing CV form screen instead of creating a separate bilingual editor

**Rationale**: `src/screens/cv/CVFormScreen.tsx` already holds the authenticated CV workflow, section controls, generation actions, and language selector behavior. Extending this screen preserves the existing navigation and reduces rollout risk.

**Alternatives considered**:

- Create a new bilingual-only screen: rejected because it would duplicate the current CV flow and fragment the user experience.
- Split Arabic and English into separate routes: rejected because it would add navigation complexity to a feature that is fundamentally about switching within one draft.

## Decision: Represent the draft as paired localized values with per-field sync metadata

**Rationale**: The feature requires more than a one-time English snapshot. Each user-editable field now needs Arabic and English values plus enough metadata to know which side was edited most recently, which values were auto-populated, and which target values should be preserved.

**Alternatives considered**:

- Keep a single source-language draft and regenerate the opposite language every time: rejected because user edits in the translated language would be lost.
- Store two unrelated drafts: rejected because the feature’s value is synced bilingual editing from one draft.

## Decision: Generalize the current translation service from export-only English translation into bidirectional draft syncing

**Rationale**: `src/services/cvTranslationService.ts` and `android/app/src/main/java/com/tanamitrain/cv/CVTranslationModule.kt` already expose batch translation and language-pair availability checks. The lowest-risk path is to extend that boundary to accept both directions and return field-aligned translated values for the visible editor state.

**Alternatives considered**:

- Perform translation directly inside `CVFormScreen.tsx`: rejected because it would mix sync state, native availability, and UI concerns.
- Add a new backend translation service: rejected because the feature is explicitly on-device and the current native bridge is already available.

## Decision: Treat the most recently edited language as the default sync source for the next language switch

**Rationale**: The specification says user edits in English should be reflected back into Arabic and vice versa. A last-edited-language rule provides a clear default that is testable and understandable for both single fields and repeatable entries.

**Alternatives considered**:

- Always treat Arabic as the permanent source of truth: rejected because English edits would never propagate back.
- Always overwrite both sides on every switch: rejected because it would silently discard user corrections.

## Decision: Keep explicit user-preserved target wording from being silently overwritten

**Rationale**: The spec allows auto-population but also requires users to stay in control. Once the user intentionally keeps or edits a target-language wording, the next sync should respect that state unless the workflow explicitly chooses to refresh it from the newer source.

**Alternatives considered**:

- Overwrite every translated target value whenever the source changes: rejected because it makes bilingual editing unpredictable.
- Never refresh target values after first translation: rejected because it would break the requirement that later edits propagate across languages.

## Decision: Add certifications and courses and volunteer experience as repeatable sections in the same draft and export pipeline

**Rationale**: The new sections are part of the same user outcome and must participate in the same switching, editing, and export behavior as the rest of the CV. Modeling them as repeatable entries keeps them aligned with the current experience and education structures.

**Alternatives considered**:

- Ship the sections later in a follow-up feature: rejected because the spec explicitly includes them in this increment.
- Treat them as free-form appended text: rejected because the existing CV form already relies on structured repeatable sections.

## Decision: Keep Android as the automatic translation-validation platform for this increment

**Rationale**: The current translation module exists only on Android and already uses on-device ML Kit translation. Planning around that existing native path keeps the scope aligned with the current repository and avoids inventing an unimplemented iOS translation engine.

**Alternatives considered**:

- Add iOS automatic translation in the same increment: rejected because it would expand native scope significantly.
- Delay the feature until both platforms are equal: rejected because the existing Android path can deliver the requested value now.
