# Implementation Plan: English CV Output From Arabic Drafts

**Branch**: `[002-english-cv-output]` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-english-cv-output/spec.md`

## Summary

Extend the existing Arabic CV generator so Arabic remains the default output while authenticated users can also generate an English PDF from the same Arabic draft on Android. Keep the existing export flow, add a device-side translation boundary before English rendering, and make unsupported-Android-device handling explicit so the new capability does not degrade the stable Arabic path from feature `001`.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80, Kotlin 2.1  
**Primary Dependencies**: React Navigation 7, `react-native-html-to-pdf`, `react-native-share`, Android ML Kit translation dependency for local English translation  
**Storage**: Existing transient PDF files in device storage; local translation models managed by the device-native translation engine  
**Testing**: Jest for service-level logic, plus mandatory manual Android validation for English generation and fallback validation on unsupported Android devices  
**Target Platform**: Existing TanamiTrain Android app shell only for this increment  
**Project Type**: Mobile app  
**Performance Goals**: Arabic generation behavior remains unchanged; English generation completes within 8 seconds on a representative Android device after the local model is ready  
**Constraints**: Authenticated access only, Arabic remains default, English must be generated on-device with no CV text sent to a backend service, Android-only scope for this increment, preserve the dirty worktree, keep unsupported-device behavior explicit  
**Scale/Scope**: Single-user, on-device bilingual document output inside the existing CV form flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec before implementation**: PASS. This feature has a dedicated spec package under `specs/002-english-cv-output/`.
- **Existing architecture first**: PASS. The plan extends the current `src/screens/cv/`, `src/services/`, and native app shells instead of introducing a new document subsystem.
- **Authenticated, Arabic-first UX**: PASS. Arabic stays the default selection and the authenticated navigation model remains unchanged.
- **Native reliability is a product requirement**: PASS. The plan treats Android device validation and unsupported-device handling as explicit deliverables.
- **Small, reversible increments**: PASS. The work is decomposed into translation service, UI language selection, and fallback behavior so Arabic generation remains independently usable.

## Project Structure

### Documentation (this feature)

```text
specs/002-english-cv-output/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cv-translation-service.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── screens/
│   └── cv/
│       └── CVFormScreen.tsx
├── services/
│   ├── cvHtmlRenderer.ts
│   ├── cvService.ts
│   ├── cvTranslationService.ts
│   └── cvTypes.ts
└── navigation/
    └── AppNavigator.tsx

__tests__/
android/
└── app/src/main/java/com/tanamitrain/
```

**Structure Decision**: Reuse the existing CV form and export service, add a focused translation helper in `src/services/`, and introduce the smallest native Android bridge necessary to keep translation on-device. iOS is out of scope for this increment.

## Complexity Tracking

No constitution violations are currently expected.
