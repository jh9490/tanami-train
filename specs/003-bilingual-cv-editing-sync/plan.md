# Implementation Plan: Bilingual CV Editing Sync

**Branch**: `[003-bilingual-cv-editing-sync]` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-bilingual-cv-editing-sync/spec.md`

## Summary

Evolve the existing Arabic-first CV generator into a bilingual editor that auto-populates the currently selected language from the opposite-language draft, keeps translated values editable, and reuses the most recently edited version as the next sync source. Extend the current CV form, shared CV types, and translation service to support bidirectional field-level syncing plus the new certifications and courses and volunteer experience sections, while keeping the existing export flow and authenticated navigation intact.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80, Kotlin 2.1  
**Primary Dependencies**: React Navigation 7, `@react-native-async-storage/async-storage`, `react-native-html-to-pdf`, `react-native-share`, `react-native-vector-icons`, Android ML Kit translation via the existing `CVTranslationModule` bridge  
**Storage**: In-memory React state for the active bilingual draft, existing transient PDF files in device storage, no new backend translation storage in this increment  
**Testing**: Jest for CV service and sync-state logic, plus mandatory manual Android validation for bidirectional translation sync, repeated-entry editing, and PDF export  
**Target Platform**: Existing TanamiTrain React Native app, with Android device or emulator validation required for automatic translation sync  
**Project Type**: Mobile app  
**Performance Goals**: Language switch auto-populates eligible fields within 3 seconds after the local translation model is ready; Arabic PDF generation behavior remains unchanged; edited bilingual content remains ready for export in the selected language without extra re-entry  
**Constraints**: Authenticated access only, Arabic remains the default editing language, automatic translation stays on-device, user edits must not be silently overwritten, existing screen/service architecture should be reused, Android is the supported automatic-sync path for this increment, preserve dirty-worktree safety  
**Scale/Scope**: Single-user bilingual CV drafting across full name, summary, experience, education, skills, certifications and courses, and volunteer experience inside the current CV flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec before implementation**: PASS. This feature has a dedicated spec package under `specs/003-bilingual-cv-editing-sync/`.
- **Existing architecture first**: PASS. The plan extends `src/screens/cv/CVFormScreen.tsx`, `src/services/`, and the existing Android translation bridge instead of introducing a separate editor or backend workflow.
- **Authenticated, Arabic-first UX**: PASS. Arabic remains the default editing language and the authenticated navigation model from `src/context/AuthContext.tsx` and `src/navigation/AppNavigator.tsx` stays in place.
- **Native reliability is a product requirement**: PASS. The plan keeps Android translation-module behavior and export validation as explicit deliverables with manual runtime checks.
- **Small, reversible increments**: PASS. The work is decomposed into draft model changes, sync-service behavior, form-section expansion, and export compatibility so the feature can be built in narrow slices.

## Project Structure

### Documentation (this feature)

```text
specs/003-bilingual-cv-editing-sync/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cv-bilingual-sync-service.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── context/
│   └── AuthContext.tsx
├── navigation/
│   └── AppNavigator.tsx
├── screens/
│   └── cv/
│       └── CVFormScreen.tsx
└── services/
    ├── cvHtmlRenderer.ts
    ├── cvService.ts
    ├── cvTranslationService.ts
    └── cvTypes.ts

__tests__/
android/
└── app/src/main/java/com/tanamitrain/cv/
    ├── CVTranslationModule.kt
    └── CVTranslationPackage.kt
```

**Structure Decision**: Reuse the current CV form screen as the single bilingual editing surface, extend the shared CV types and service layer to carry localized values and sync metadata, and keep automatic translation inside the existing Android native bridge. PDF generation remains in the current service pipeline rather than moving to a separate subsystem.

## Complexity Tracking

No constitution violations are currently expected.
