# Implementation Plan: Reference-Matched ATS CV Layout

**Branch**: `[006-menu-nav-reorg]` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-ats-cv-layout/spec.md`

## Summary

Replace the current generic English ATS CV presentation with a reference-matched single-column template modeled on `ATS CV 4.docx`: centered identity/contact header, compact modern Roboto typography, dark-blue centered section headings, vertical section flow, and denser page spacing. Keep the existing CV data model, export pipeline, reverse-chronological preparation, and Arabic rendering path intact while mapping the currently supported English sections into the approved visual hierarchy.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.1, React Native 0.80  
**Primary Dependencies**: Existing `react-native-html-to-pdf` export pipeline and current CV service layer  
**Storage**: Existing in-memory/local CV draft flow; no new storage  
**Testing**: Jest coverage in `__tests__/cvService.test.ts`, plus manual PDF visual review against `ATS CV 4.docx` on Android emulator/device  
**Target Platform**: Existing TanamiTrain mobile app PDF export flow  
**Project Type**: Mobile app  
**Performance Goals**: Preserve current export responsiveness while keeping one-page density when content permits  
**Constraints**: Preserve ATS-safe reading order, avoid new dependencies, do not silently rewrite user content, keep Arabic output behavior stable, and stay within the current CV data model for this increment  
**Scale/Scope**: English ATS export formatting for currently supported fields: identity/contact, summary, education, experience, certifications/courses, volunteer experience, and skills

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec before implementation**: PASS. Feature package exists under `specs/005-ats-cv-layout/`.
- **Existing architecture first**: PASS. The change remains inside `src/services/cvHtmlRenderer.ts` and focused tests rather than adding a parallel export subsystem.
- **Authenticated, Arabic-first UX**: PASS. Arabic remains supported and unchanged; the work refines ATS export structure without weakening machine-readable output.
- **Native reliability is a product requirement**: PASS. The plan includes generated-PDF visual validation against the supplied DOCX reference on emulator/device.
- **Small, reversible increments**: PASS. The renderer change is isolated and can be reverted independently of storage, translation, or form-state behavior.

## Project Structure

### Documentation (this feature)

```text
specs/005-ats-cv-layout/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ats-cv-renderer.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/services/
├── cvHtmlRenderer.ts
├── cvService.ts
└── cvTypes.ts

__tests__/
└── cvService.test.ts
```

**Structure Decision**: Reuse the existing renderer seam in `src/services/cvHtmlRenderer.ts`, retain ATS sorting and normalization in `src/services/cvService.ts`, and validate the changed output contract through existing Jest coverage plus manual PDF comparison.

## Complexity Tracking

No constitution violations are expected.
