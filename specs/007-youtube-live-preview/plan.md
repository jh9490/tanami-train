# Implementation Plan: YouTube Live Course Preview

**Branch**: `[007-youtube-live-preview]` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-youtube-live-preview/spec.md`

## Summary

Add a live preview tab to the existing course detail top-tab experience. The selected My Courses item will carry its `live_url` into `CourseTabsScreen`, where a new tab renders a YouTube live preview using the existing WebView dependency and shows a stable unavailable state when the link cannot be used.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80  
**Primary Dependencies**: React Navigation 7, `@react-navigation/material-top-tabs`, existing `react-native-webview`  
**Storage**: N/A; `live_url` is transient course item data passed through navigation  
**Testing**: Jest for utility-level validation; manual Android/iOS app validation for embedded playback  
**Target Platform**: React Native mobile app for Android and iOS  
**Project Type**: Mobile app  
**Performance Goals**: Course detail screen remains responsive while loading the live preview; WebView loads only when the user opens the course detail experience  
**Constraints**: Preserve existing My Courses filters and course detail tabs; no new access restrictions in this increment; Arabic user-facing copy remains readable and RTL-friendly  
**Scale/Scope**: One existing list screen, one existing course detail tab screen, one API type update, and focused utility tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec Before Implementation**: PASS. `specs/007-youtube-live-preview/spec.md` and the requirements checklist exist before source changes.
- **Existing Architecture First**: PASS. The feature uses `src/screens/MyCoursesScreen.tsx`, `src/screens/CourseTabsScreen.tsx`, and `src/types/api.ts` without adding a parallel navigation or service layer.
- **Authenticated, Arabic-First UX**: PASS. My Courses remains under the existing authenticated flow and new labels/messages use Arabic copy.
- **Native Reliability Is a Product Requirement**: PASS. Manual validation steps cover real device/emulator WebView playback behavior.
- **Small, Reversible Increments**: PASS. The change is scoped to live preview only and explicitly defers restrictions and UI enhancements.

## Project Structure

### Documentation (this feature)

```text
specs/007-youtube-live-preview/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── live-preview-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── screens/
│   ├── MyCoursesScreen.tsx
│   └── CourseTabsScreen.tsx
└── types/
    └── api.ts

__tests__/
└── courseLivePreview.test.ts
```

**Structure Decision**: Use the current React Native screen and type layout. `MyCoursesScreen` already owns the selected course item, and `CourseTabsScreen` already owns the tabbed course detail UI, so the new live preview tab belongs there.

## Complexity Tracking

No constitution violations or additional complexity exceptions are required.

## Phase 0: Research Summary

Research decisions are recorded in [research.md](./research.md).

## Phase 1: Design Summary

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/live-preview-ui.md](./contracts/live-preview-ui.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

- **Spec Before Implementation**: PASS. Planning artifacts and task breakdown will precede implementation.
- **Existing Architecture First**: PASS. No new architecture layer or dependency is planned.
- **Authenticated, Arabic-First UX**: PASS. The new tab uses Arabic labels and unavailable messaging.
- **Native Reliability Is a Product Requirement**: PASS. Quickstart includes device/emulator validation for WebView playback and unavailable states.
- **Small, Reversible Increments**: PASS. Tasks are organized by independently testable user stories.
