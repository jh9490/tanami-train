# Implementation Plan: Menu Navigation Reorganization

**Branch**: `[006-menu-nav-reorg]` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-menu-nav-reorg/spec.md`

## Summary

Reorganize authenticated app navigation so `My CV` moves from the bottom tab bar into the home-page shortcut grid, `Settings` moves from the home-page shortcut grid into the menu screen, and the menu screen becomes vertically scrollable to accommodate the added utility entry without clipping on shorter devices. The implementation will stay inside the existing React Native navigation structure by updating `src/navigation/AppNavigator.tsx`, `src/screens/HomeScreen.tsx`, and `src/screens/menu/MenuScreen.tsx` while reusing the current CV and settings screen destinations.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80  
**Primary Dependencies**: React Navigation 7, `react-native-vector-icons`, existing safe-area utilities  
**Storage**: N/A for this feature; existing navigation and screen state only  
**Testing**: Manual navigation validation on Android and iOS/emulator; existing Jest coverage only if extraction makes a helper practical to test  
**Target Platform**: React Native mobile app for Android and iOS  
**Project Type**: Mobile app  
**Performance Goals**: Preserve current navigation responsiveness, keep shortcut taps and menu-row taps immediate, and avoid introducing new fetches or layout jank when the menu grows  
**Constraints**: Preserve Arabic and RTL presentation, avoid new dependencies, reuse the current bottom-tab and stack structure, keep the existing CV and settings screens functionally unchanged  
**Scale/Scope**: One navigation reorganization touching the main tab navigator, authenticated home shortcut area, menu screen composition, and small supporting screen metadata

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec before implementation**: PASS. The feature has an approved spec package under `specs/006-menu-nav-reorg/`.
- **Existing architecture first**: PASS. The plan extends the existing `AppNavigator`, `HomeScreen`, and `MenuScreen` structure without introducing a new navigation architecture.
- **Authenticated, Arabic-first UX**: PASS. The changes preserve Arabic and RTL presentation and keep authenticated destinations gated through the current auth model.
- **Native reliability is a product requirement**: PASS. The feature is navigation/UI-only and still includes manual device or emulator validation because tab and scroll behavior must be verified in runtime.
- **Small, reversible increments**: PASS. The work is scoped to entry-point and layout changes that can be implemented and validated independently without mixing in unrelated refactors.

## Project Structure

### Documentation (this feature)

```text
specs/006-menu-nav-reorg/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── navigation-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── navigation/
│   └── AppNavigator.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── cv/
│   │   └── CVFormScreen.tsx
│   └── menu/
│       └── MenuScreen.tsx
└── context/
    └── AuthContext.tsx
```

**Structure Decision**: Keep the implementation inside the existing React Native screen and navigator structure. `AppNavigator.tsx` remains the source of truth for tab and stack destinations, `HomeScreen.tsx` owns the authenticated shortcut grid, and `MenuScreen.tsx` owns the utility-entry layout and vertical scroll behavior.

## Phase 0: Research

- Confirm the least disruptive navigation approach for removing the bottom-tab `My CV` entry while keeping the existing `CVFormScreen` destination reachable from the home-page authenticated shortcuts.
- Confirm the cleanest way to move `Settings` under the existing menu stack instead of routing from the home-page shortcut grid.
- Define the scroll-container behavior required to keep the menu usable on smaller-height devices once an additional settings row is added.

## Phase 1: Design & Contracts

- Model bottom-tab destinations, home authenticated shortcuts, and menu utility rows as small existing-UI contracts rather than introducing a new navigation abstraction.
- Define a navigation UI contract covering the new destination entry points and menu-screen scroll expectations.
- Prepare a manual validation quickstart that covers authenticated and guest visibility, home shortcut routing, menu-to-settings routing, and short-device menu scrolling.

## Phase 2: Implementation Outline

1. Remove the `CVGenerator` bottom-tab entry and keep the existing `MenuRoot` tab behavior intact in `src/navigation/AppNavigator.tsx`.
2. Add a `My CV` authenticated shortcut to `src/screens/HomeScreen.tsx` and replace the current home-page settings shortcut with that new destination.
3. Extend the existing menu stack to include the settings destination and add a `Settings` row to `src/screens/menu/MenuScreen.tsx`.
4. Make the menu screen vertically scrollable with safe bottom spacing so the final menu row stays visible above system insets and tab navigation.
5. Run manual validation across authenticated and guest navigation states, then update any context documentation only if the documented app-navigation flow materially changes.

## Complexity Tracking

No constitution violations or justified complexity exceptions are required for this feature.
