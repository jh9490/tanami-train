# TanamiTrain Project Context

## Product Snapshot

- Product: TanamiTrain mobile application
- Platform: React Native application with Android and iOS native shells
- Primary audience: Arabic-speaking end users
- Existing auth model: session-based authenticated user flows exposed through `src/context/AuthContext.tsx`

## Current Repository Shape

- Navigation entry points live in `src/navigation/`
- Screen implementations live in `src/screens/`
- Backend and native integration logic live in `src/services/`
- Shared typing lives in `src/types/`
- Android-specific native config lives under `android/`
- iOS-specific native config lives under `ios/`

## Existing CV Feature Surface

- Navigation route: `CVGenerator` tab in `src/navigation/AppNavigator.tsx`
- Screen: `src/screens/cv/CVFormScreen.tsx`
- Service: `src/services/cvService.ts`
- Native libraries already present:
  - `react-native-html-to-pdf`
  - `react-native-share`
  - `react-native-fs`

## Known Starting Point For The New Requirement

- The feature already exists in partial form but PDF generation and or PDF download/share is failing.
- The current PDF HTML imports a remote Google font, which is a likely reliability risk for on-device PDF generation.
- The current feature is only tab-gated for authenticated users; implementation work should verify end-to-end auth enforcement and failure handling.
- The current working tree already contains uncommitted CV-related changes. New planning artifacts should avoid overwriting those source files until the implementation phase is explicitly started.

## Working Assumptions

- The immediate goal is to establish the spec-driven workflow artifacts first, then implement against them with Codex.
- The first feature package should focus on reliable ATS-compatible Arabic CV generation for authenticated users, including export failure recovery.
- `system_context.md` remains the broad system artifact; this file exists to anchor spec-kit memory to the current codebase and active feature.
