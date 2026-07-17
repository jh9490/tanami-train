# Tasks: Reference-Matched ATS CV Layout

**Input**: Design documents from `/specs/005-ats-cv-layout/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ats-cv-renderer.md`

**Tests**: Jest coverage is required in `__tests__/cvService.test.ts`. Manual Android PDF comparison is required from `quickstart.md`.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Review current ATS renderer behavior in `src/services/cvHtmlRenderer.ts`
- [X] T002 Review existing renderer coverage in `__tests__/cvService.test.ts`

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T003 Define the reference-matched English render structure and helper functions in `src/services/cvHtmlRenderer.ts`
- [X] T004 [P] Add expected English reference-template assertions in `__tests__/cvService.test.ts`

## Phase 3: User Story 1 - Export an ATS CV that visually matches the approved reference (Priority: P1)

- [X] T005 [US1] Implement centered identity and contact-header rendering for English ATS output in `src/services/cvHtmlRenderer.ts`
- [X] T006 [US1] Implement Roboto typography, dark-blue centered headings, compact spacing, and reference-style list treatment in `src/services/cvHtmlRenderer.ts`
- [X] T007 [US1] Reorder supported English sections to the reference-matched sequence in `src/services/cvHtmlRenderer.ts`

## Phase 4: User Story 2 - Preserve extracted content while placing it into the reference structure (Priority: P2)

- [X] T008 [US2] Preserve clean omission of absent values and escaped user text in the updated English renderer in `src/services/cvHtmlRenderer.ts`
- [X] T009 [P] [US2] Extend Jest coverage for supported-section order, escaped content, and missing optional contact values in `__tests__/cvService.test.ts`

## Phase 5: User Story 3 - Keep the reference format stable across realistic CV lengths (Priority: P3)

- [X] T010 [US3] Preserve page-break safeguards and single-column behavior in `src/services/cvHtmlRenderer.ts`
- [X] T011 [P] [US3] Extend Jest coverage for single-column layout and page-break safeguards in `__tests__/cvService.test.ts`

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 Run focused Jest validation for renderer behavior in `__tests__/cvService.test.ts`
- [ ] T013 Manually validate generated English and Arabic PDFs against `specs/005-ats-cv-layout/quickstart.md`
- [X] T014 Add LinkedIn contact support across `src/services/cvTypes.ts`, `src/services/cvService.ts`, `src/screens/cv/CVFormScreen.tsx`, and `src/services/cvHtmlRenderer.ts`
- [X] T015 Add section-divider line styling and LinkedIn renderer coverage in `src/services/cvHtmlRenderer.ts` and `__tests__/cvService.test.ts`
- [X] T016 Split candidate name and title into separate header lines in `src/services/cvHtmlRenderer.ts`
- [X] T017 Apply the ATS visual system to Arabic export while preserving RTL typography in `src/services/cvHtmlRenderer.ts` and `__tests__/cvService.test.ts`

## Dependencies & Execution Order

- Phase 1 must complete before Phase 2.
- Phase 2 blocks all story work.
- User Story 1 is the MVP and should land before User Stories 2 and 3.
- User Stories 2 and 3 can proceed independently once the shared English renderer structure exists.

## Parallel Opportunities

- T004 can run in parallel with T003.
- T009 can run in parallel with T008.
- T011 can run in parallel with T010.

## Implementation Strategy

1. Establish the renderer contract and tests.
2. Deliver the reference-matched English export as the MVP.
3. Harden omission, escaping, and pagination behavior.
4. Run automated and manual PDF validation.
