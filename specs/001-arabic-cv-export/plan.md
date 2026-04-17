# Implementation Plan: Authenticated Arabic CV PDF Export

**Branch**: `[001-arabic-cv-export]` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-arabic-cv-export/spec.md`

## Summary

Stabilize the existing authenticated CV generator so an authenticated TanamiTrain user can produce an ATS-compatible Arabic PDF reliably, export it through the mobile OS, and recover cleanly from device-side generation or share failures. The implementation should reuse the current navigation and auth flow, split CV rendering from export orchestration, and remove fragile runtime dependencies that can break on-device PDF generation.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80  
**Primary Dependencies**: React Navigation 7, `@react-native-async-storage/async-storage`, `react-native-html-to-pdf`, `react-native-share`, `react-native-vector-icons`  
**Storage**: Existing session data in AsyncStorage; transient generated PDF files on device storage  
**Testing**: Jest for lightweight logic tests where practical, plus mandatory manual device validation for Android and iOS export flows  
**Target Platform**: Android and iOS mobile devices running the existing TanamiTrain app  
**Project Type**: Mobile app  
**Performance Goals**: Valid CV generation and export preparation should complete in under 5 seconds on a representative Android device  
**Constraints**: Authenticated access only, Arabic RTL layout, ATS-readable text output, no dependence on remote assets during PDF creation, compatibility with the current dirty worktree  
**Scale/Scope**: Single-user, on-device document generation inside the existing app tab flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec before implementation**: PASS. This feature has a spec, checklist, and plan directory under `specs/001-arabic-cv-export/`.
- **Existing architecture first**: PASS. The plan keeps work inside the existing `src/navigation/`, `src/screens/cv/`, `src/services/`, and `src/types/` structure.
- **Authenticated, Arabic-first UX**: PASS. Auth gating, Arabic text fidelity, and ATS-readable output are explicit requirements.
- **Native reliability is a product requirement**: PASS. Manual Android and iOS validation is part of the planned completion criteria.
- **Small, reversible increments**: PASS. The work is decomposed into generation, export, and recovery slices that can be validated independently.

## Project Structure

### Documentation (this feature)

```text
specs/001-arabic-cv-export/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cv-export-service.md
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
├── services/
│   ├── api.ts
│   └── cvService.ts
└── types/
    └── react-native-html-to-pdf.d.ts

__tests__/
android/
ios/
system_context.md
```

**Structure Decision**: Keep the feature within the existing React Native app layout. Introduce small, focused CV-specific service or helper files only if they reduce risk in `src/services/` or `src/screens/cv/`, and avoid broader structural reorganization during this stabilization effort.

## Complexity Tracking

No constitution violations are currently expected.
