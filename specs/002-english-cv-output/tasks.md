# Tasks: English CV Output From Arabic Drafts

**Input**: Design documents from `/specs/002-english-cv-output/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cv-translation-service.md`

**Tests**: Automated service-level tests are required for generation branching and translation fallback. Manual Android validation is required for the native English path.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Activate the new feature context and prepare the repo for the bilingual CV increment

- [X] T001 Record the active feature context in `.specify/feature.json` for `specs/002-english-cv-output`
- [X] T002 Review the current CV-related dirty worktree before extending `src/screens/cv/CVFormScreen.tsx`, `src/services/cvService.ts`, and native app files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared language and translation boundaries before UI or native generation work

- [X] T003 Create CV output-language and translation result types in `src/services/cvTypes.ts`
- [X] T004 [P] Add a dedicated translation helper in `src/services/cvTranslationService.ts`
- [X] T005 [P] Extend HTML rendering in `src/services/cvHtmlRenderer.ts` for Arabic and English document output

**Checkpoint**: Service boundaries support Arabic and English generation paths without breaking the existing export contract.

---

## Phase 3: User Story 1 - Generate an English CV from the Arabic draft on-device (Priority: P1) 🎯 MVP

**Goal**: Generate an English PDF on supported devices from the Arabic source draft

**Independent Test**: On Android, fill the Arabic draft, select English, generate the PDF, and confirm translated English output with a distinct artifact.

### Implementation for User Story 1

- [X] T006 [P] [US1] Extend `src/services/cvService.ts` to translate the draft before English rendering and to emit language-aware PDF artifacts
- [X] T007 [P] [US1] Add the Android native translation bridge in `android/app/build.gradle`, `android/app/src/main/java/com/tanamitrain/MainApplication.kt`, and new files under `android/app/src/main/java/com/tanamitrain/cv/`
- [X] T008 [US1] Cover Arabic and English generation branching in `__tests__/cvService.test.ts`

**Checkpoint**: Supported Android devices can generate English PDF output from the Arabic draft.

---

## Phase 4: User Story 2 - Keep Arabic as the default output while allowing language switching (Priority: P2)

**Goal**: Preserve Arabic-first behavior while making English selection explicit

**Independent Test**: Open the CV screen, confirm Arabic is the default, switch languages, and generate without losing the draft.

### Implementation for User Story 2

- [X] T009 [US2] Update language selection, status messaging, and artifact presentation in `src/screens/cv/CVFormScreen.tsx`
- [X] T010 [US2] Keep authenticated routing and CV tab behavior aligned with the existing flow in `src/navigation/AppNavigator.tsx` if route metadata or labels need adjustment

**Checkpoint**: Arabic remains default and English is an intentional alternate output.

---

## Phase 5: User Story 3 - Explain unsupported Android or translation failures clearly (Priority: P3)

**Goal**: Make English availability and failure states explicit without breaking Arabic generation

**Independent Test**: Select English on an unsupported Android path or trigger a translation failure and confirm the app preserves the draft and offers Arabic fallback.

### Implementation for User Story 3

- [X] T011 [P] [US3] Add unsupported-device and translation-failure handling in `src/services/cvTranslationService.ts` and `src/services/cvService.ts`
- [X] T012 [P] [US3] Define Android-only unsupported-device handling in `src/services/cvTranslationService.ts` and related feature docs
- [X] T013 [US3] Surface unsupported English generation messaging and retry behavior in `src/screens/cv/CVFormScreen.tsx`

**Checkpoint**: Unsupported or failed English generation is clear, recoverable, and non-destructive.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refresh shared docs and validate native behavior

- [X] T014 Update `system_context.md` if the bilingual CV flow materially changes documented architecture
- [X] T015 Refresh `AGENTS.md` with `.specify/scripts/bash/update-agent-context.sh codex`
- [ ] T016 Run Android manual QA from `specs/002-english-cv-output/quickstart.md`
- [ ] T017 Run unsupported-Android-device fallback validation from `specs/002-english-cv-output/quickstart.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks story work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses the artifact shape from User Story 1
- **User Story 3 (Phase 5)**: Depends on translation boundaries existing from Foundational and User Story 1
- **Polish (Phase 6)**: Depends on all intended stories being complete

### Parallel Opportunities

- T004 and T005 can run in parallel
- T006 and T007 can run in parallel once shared types are in place
- T011 and T012 can run in parallel because their write scopes are separate

## Implementation Strategy

### MVP First

1. Establish the translation service boundary and bilingual renderer
2. Implement Android English generation
3. Wire the language selector while keeping Arabic default

### Incremental Delivery

1. Preserve Arabic stability
2. Add supported-device English generation
3. Add unsupported-device messaging and validate runtime behavior

## Notes

- Keep English generation scoped to the current CV form instead of introducing a bilingual draft editor.
- Do not regress the stable Arabic PDF/export behavior already delivered by feature `001`.
