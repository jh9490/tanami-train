# Tasks: Authenticated Arabic CV PDF Export

**Input**: Design documents from `/specs/001-arabic-cv-export/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cv-export-service.md`

**Tests**: Automated tests are optional for this feature, but manual Android validation is mandatory because the current failure involves native PDF generation and export behavior.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock the feature workspace and prepare implementation boundaries

- [X] T001 Record the active feature context in `.specify/feature.json` and verify `AGENTS.md` reflects the feature plan
- [X] T002 Review the current dirty worktree in `src/screens/cv/CVFormScreen.tsx`, `src/services/cvService.ts`, and `src/navigation/AppNavigator.tsx` before implementation so planned changes do not overwrite user work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Separate generation concerns and make the failing path debuggable

- [X] T003 Create or refactor CV draft typing and validation boundaries in `src/services/cvService.ts` and, if needed, a new helper file under `src/services/`
- [X] T004 [P] Introduce a dedicated Arabic CV HTML rendering helper under `src/services/` so document rendering is isolated from export behavior
- [X] T005 [P] Define stable generation and export result shapes in `src/services/cvService.ts` so the UI can distinguish validation, generation, cancellation, and export failures

**Checkpoint**: Generation logic is decomposed enough to implement user stories without guessing where failures occur.

---

## Phase 3: User Story 1 - Generate an ATS-friendly Arabic CV (Priority: P1) 🎯 MVP

**Goal**: Produce a machine-readable Arabic PDF for authenticated users

**Independent Test**: Sign in, complete a valid draft, generate a PDF, and confirm the text is selectable and structured.

### Implementation for User Story 1

- [X] T006 [P] [US1] Update the CV form fields and validation behavior in `src/screens/cv/CVFormScreen.tsx` to support the required ATS-friendly draft structure
- [X] T007 [P] [US1] Replace fragile PDF HTML dependencies in `src/services/cvService.ts` or a new rendering helper so generation does not rely on remote assets
- [X] T008 [US1] Implement the generation flow in `src/services/cvService.ts` to return a stable generated artifact with file metadata
- [X] T009 [US1] Verify authenticated access remains enforced in `src/navigation/AppNavigator.tsx` and through any alternate route entry logic

**Checkpoint**: An authenticated user can generate a valid Arabic PDF from the app.

---

## Phase 4: User Story 2 - Save or share the generated CV reliably (Priority: P2)

**Goal**: Make successful generation useful by enabling a complete export flow

**Independent Test**: Generate a PDF and complete a share or save action without losing the artifact state.

### Implementation for User Story 2

- [X] T010 [P] [US2] Implement export orchestration and filename sanitization in `src/services/cvService.ts` or a new export helper under `src/services/`
- [X] T011 [US2] Wire export actions, progress feedback, and success messaging in `src/screens/cv/CVFormScreen.tsx`
- [ ] T012 [US2] Update platform-specific configuration only if runtime validation proves it is necessary in `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, or the corresponding iOS project files

**Checkpoint**: The generated CV can be passed to the operating system for saving or sharing.

---

## Phase 5: User Story 3 - Recover from generation and export failures (Priority: P3)

**Goal**: Make failures clear, recoverable, and non-destructive

**Independent Test**: Trigger a generation or export failure and confirm retry is possible without retyping the CV.

### Implementation for User Story 3

- [X] T013 [P] [US3] Map native and service failures to stable user-visible error categories in `src/services/cvService.ts`
- [X] T014 [US3] Add loading, retry, and failure UI states in `src/screens/cv/CVFormScreen.tsx`
- [X] T015 [US3] Preserve draft data across recoverable failures in `src/screens/cv/CVFormScreen.tsx` and any supporting local state helpers

**Checkpoint**: Failures are explicit, recoverable, and do not erase the draft.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the feature under native runtime conditions and update documentation

- [ ] T016 Run Android manual QA from `specs/001-arabic-cv-export/quickstart.md`
- [ ] T017 Run iOS manual QA from `specs/001-arabic-cv-export/quickstart.md` when an iOS environment is available
- [X] T018 Update `system_context.md` if the implementation materially changes the documented architecture or feature surface
- [X] T019 Refresh `AGENTS.md` with `.specify/scripts/bash/update-agent-context.sh codex` after plan or structure changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks story work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 producing a stable generated artifact
- **User Story 3 (Phase 5)**: Depends on the generation and export paths being implemented
- **Polish (Phase 6)**: Depends on all intended stories being complete

### Parallel Opportunities

- T004 and T005 can run in parallel
- T006 and T007 can run in parallel
- T013 can run in parallel with the UI-facing portion of T014 once failure shapes are agreed

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational tasks
2. Finish User Story 1
3. Validate native PDF generation on Android before moving to export polish

### Incremental Delivery

1. Stabilize generation
2. Add export reliability
3. Add recovery UX and finalize manual QA

## Notes

- Keep implementation aligned with the existing app structure unless runtime evidence justifies a targeted helper file.
- Do not overwrite existing uncommitted CV-related source changes without first reconciling them with the plan.
