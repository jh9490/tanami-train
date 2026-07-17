# Implementation Plan: Homepage Links and Sections

**Branch**: `[004-home-links-sections]` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-home-links-sections/spec.md`

## Summary

Update the existing home screen so its outbound social links reliably open the intended Tanami Train destinations, add a website icon for `http://tanamitrain.com`, and replace the current/upcoming segmented filter with two vertically stacked course sections that reuse the existing course cards and hide any empty section. The implementation will stay inside the current React Native screen structure by extending `src/screens/HomeScreen.tsx` and reusing the shared external-link helper in `src/util/Linker.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80  
**Primary Dependencies**: React Navigation 7, `styled-components`, `react-native-vector-icons`, `react-native-reanimated-carousel`  
**Storage**: N/A for this feature; existing in-memory home screen state populated from current activity and slider fetches  
**Testing**: Jest for any extracted rendering or helper behavior; manual Android and iOS/emulator validation for outbound link opening and stacked section visibility  
**Target Platform**: React Native mobile app for Android and iOS  
**Project Type**: Mobile app  
**Performance Goals**: Preserve the current home screen fetch cadence, keep course section rendering within the existing scroll flow, and keep outbound link taps responsive without introducing extra network requests  
**Constraints**: Preserve Arabic and RTL presentation, avoid new dependencies, keep the existing course detail dialog behavior, fail gracefully when a device cannot open a destination  
**Scale/Scope**: Single home screen feature touching one primary screen, one shared link helper path, and small supporting test coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec before implementation**: PASS. The feature has an approved spec package under `specs/004-home-links-sections/`.
- **Existing architecture first**: PASS. The plan extends `src/screens/HomeScreen.tsx` and existing utility patterns instead of adding a parallel layer.
- **Authenticated, Arabic-first UX**: PASS. The home screen remains Arabic-first, preserves RTL presentation, and does not change the authenticated session model.
- **Native reliability is a product requirement**: PASS. Manual validation covers outbound link behavior on device or emulator because the feature depends on native link handling.
- **Small, reversible increments**: PASS. The work is scoped to one screen plus shared link handling and can be validated independently without a broad refactor.

## Project Structure

### Documentation (this feature)

```text
specs/004-home-links-sections/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── home-screen-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── navigation/
├── screens/
│   ├── HomeScreen.tsx
│   └── components/
│       └── CourseDialog.tsx
├── util/
│   └── Linker.ts
└── context/

__tests__/
└── [home-screen or helper coverage if extracted]
```

**Structure Decision**: Keep the implementation inside the existing React Native app structure. `src/screens/HomeScreen.tsx` remains the feature entry point, `src/util/Linker.ts` is the shared outbound-link utility, and any tests stay under `__tests__/` rather than adding a new module boundary.

## Phase 0: Research

- Confirm the preferred outbound-link handling pattern for the home screen so website, social, and WhatsApp destinations share one reliable opening path.
- Define the rendering strategy for replacing the segmented filter with stacked sections while preserving the existing course-card and dialog behavior.
- Define the empty-state behavior when one or both course groups are missing.

## Phase 1: Design & Contracts

- Model home outbound links and visible course sections as small view-model structures derived from the existing fetched data.
- Define a UI contract for the home screen outbound-links row and the stacked current/upcoming sections.
- Prepare a manual validation quickstart that covers link opening, hidden empty sections, and both populated/empty course combinations.

## Phase 2: Implementation Outline

1. Refactor home screen outbound-link data into a single configuration path that includes Facebook, Instagram, WhatsApp, and website.
2. Replace the inline link-opening logic in the home screen with the shared safe-link utility behavior and consistent failure messaging.
3. Remove segmented state and render visible course sections sequentially from the existing `courses.current` and `courses.upcoming` buckets.
4. Preserve the existing course cards and `CourseDialog` behavior inside each rendered section.
5. Add focused test coverage where extraction makes the behavior practical to validate, then run manual device or emulator checks for external-link handling.

## Complexity Tracking

No constitution violations or justified complexity exceptions are required for this feature.
