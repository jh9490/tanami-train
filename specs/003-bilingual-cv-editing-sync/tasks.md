# Tasks: Bilingual CV Editing Sync

**Input**: Design documents from `/specs/003-bilingual-cv-editing-sync/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cv-bilingual-sync-service.md`

**Tests**: Jest coverage is required for CV sync-state and generation logic in `__tests__/cvService.test.ts`. Manual Android validation is required from `specs/003-bilingual-cv-editing-sync/quickstart.md`.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Review the current editor and native translation baseline before modifying the bilingual CV flow

- [X] T001 Review the current CV editor and service baseline in `src/screens/cv/CVFormScreen.tsx`, `src/services/cvService.ts`, `src/services/cvTypes.ts`, and `src/services/cvTranslationService.ts`
- [X] T002 Review the Android translation bridge surface in `android/app/src/main/java/com/tanamitrain/cv/CVTranslationModule.kt` and `android/app/src/main/java/com/tanamitrain/cv/CVTranslationPackage.kt`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared bilingual draft structures and export/rendering seams before user-story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Extend bilingual draft, localized field pair, sync result, certification, and volunteer entry types in `src/services/cvTypes.ts`
- [X] T004 [P] Add bidirectional translation availability and batch field-sync helpers in `src/services/cvTranslationService.ts`
- [X] T005 [P] Refactor bilingual draft normalization and selected-language export preparation in `src/services/cvService.ts`
- [X] T006 [P] Update localized HTML rendering for certifications and courses and volunteer experience in `src/services/cvHtmlRenderer.ts`

**Checkpoint**: Shared types, sync helpers, and export/rendering boundaries support bilingual draft data without breaking the existing PDF flow.

---

## Phase 3: User Story 1 - Switch languages without re-entering the CV (Priority: P1) 🎯 MVP

**Goal**: Let authenticated users switch between Arabic and English and immediately see editable auto-populated fields, including the new CV sections

**Independent Test**: Sign in, fill the CV in Arabic including certifications and courses plus volunteer experience, switch to English, and confirm the visible English fields are populated while remaining editable.

### Implementation for User Story 1

- [X] T007 [P] [US1] Add Jest coverage for Arabic-to-English and English-to-Arabic auto-population in `__tests__/cvService.test.ts`
- [X] T008 [P] [US1] Implement `syncDraftForLanguage` success flow and localized field mapping in `src/services/cvService.ts`
- [X] T009 [US1] Extend bilingual editor state and language-switch handlers in `src/screens/cv/CVFormScreen.tsx`
- [X] T010 [US1] Add certifications and courses and volunteer experience editor sections with bilingual switch support in `src/screens/cv/CVFormScreen.tsx`

**Checkpoint**: Language switching auto-populates editable counterpart fields across the core CV content and the two new sections.

---

## Phase 4: User Story 2 - Edit either language and keep the other language aligned (Priority: P2)

**Goal**: Treat the most recently edited language as the next sync source so user corrections persist across switches

**Independent Test**: Enter Arabic content, switch to English, edit translated English values, switch back to Arabic, and confirm the corresponding Arabic fields reflect the latest English edits instead of stale text.

### Implementation for User Story 2

- [X] T011 [P] [US2] Add Jest coverage for last-edited-language propagation and preserved target wording in `__tests__/cvService.test.ts`
- [X] T012 [P] [US2] Implement per-field `lastEditedLanguage`, preserved-target, and refresh rules in `src/services/cvService.ts`
- [X] T013 [US2] Update field change handlers to mark manual edits and resync repeatable entries in `src/screens/cv/CVFormScreen.tsx`

**Checkpoint**: User edits in either language propagate predictably to the opposite language on the next switch.

---

## Phase 5: User Story 3 - Stay in control when translation is incomplete or unsuitable (Priority: P3)

**Goal**: Preserve protected text, surface partial sync failures clearly, and keep the draft usable when translation is degraded

**Independent Test**: Populate a mixed draft, verify full-name syncing, trigger at least one translation failure, and confirm the app preserves the draft, identifies affected fields, and allows manual recovery.

### Implementation for User Story 3

- [X] T014 [P] [US3] Add Jest coverage for protected text preservation and field-level sync failures in `__tests__/cvService.test.ts`
- [X] T015 [P] [US3] Preserve protected text and emit field-level sync failure results in `src/services/cvTranslationService.ts` and `src/services/cvService.ts`
- [X] T016 [P] [US3] Extend Android translation error mapping for sync failures in `android/app/src/main/java/com/tanamitrain/cv/CVTranslationModule.kt`
- [X] T017 [US3] Surface auto-populated indicators, failed-field messaging, and manual recovery UI in `src/screens/cv/CVFormScreen.tsx`

**Checkpoint**: Translation problems are explicit, recoverable, and non-destructive while bilingual editing remains available.

---

## Phase 6: User Story 4 - Prefill ATS contact data and restore local drafts (Priority: P2)

**Goal**: Start the bilingual CV from authenticated profile defaults and keep both language versions saved locally on the device

**Independent Test**: Open the CV editor with an existing profile, confirm bilingual names and ATS contact defaults are prefilled from account/profile data, edit the draft in both languages, close and reopen the app, and confirm the local draft restores.

### Implementation for User Story 4

- [X] T018 [P] [US4] Add Jest coverage for profile-default merging and local draft restore behavior in `__tests__/cvService.test.ts`
- [X] T019 [P] [US4] Extend bilingual CV data structures and export rendering for ATS contact fields in `src/services/cvTypes.ts`, `src/services/cvService.ts`, and `src/services/cvHtmlRenderer.ts`
- [X] T020 [P] [US4] Add device draft persistence helpers in `src/storage/cvDraftStorage.ts`
- [X] T021 [US4] Expand authenticated profile usage in `src/context/AuthContext.tsx` and `src/screens/cv/CVFormScreen.tsx` to prefill bilingual names and ATS contact defaults from the account/profile API
- [X] T022 [US4] Persist and restore the bilingual draft locally in `src/screens/cv/CVFormScreen.tsx` using `src/storage/cvDraftStorage.ts`

**Checkpoint**: The CV editor opens with profile-based defaults, renders an ATS contact section, and restores local bilingual draft progress on the same device.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full bilingual draft flow and refresh shared documentation if implementation changes the architecture

- [X] T023 Run Jest validation for bilingual sync behavior in `__tests__/cvService.test.ts`
- [ ] T024 Run Android manual validation from `specs/003-bilingual-cv-editing-sync/quickstart.md`
- [ ] T025 Refresh shared architecture context in `system_context.md` and `AGENTS.md` if implementation changes the documented flow or active technology assumptions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks all story work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 because edit propagation builds on the initial bilingual switch flow
- **User Story 3 (Phase 5)**: Depends on User Story 1 because failure handling and protected-text behavior build on the active sync path
- **User Story 4 (Phase 6)**: Depends on Foundational completion and reuses the authenticated profile/session data and bilingual draft model established earlier
- **Polish (Phase 7)**: Depends on all intended user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers the MVP bilingual switching flow
- **User Story 2 (P2)**: Starts after User Story 1 establishes bilingual draft switching and repeatable section support
- **User Story 3 (P3)**: Starts after User Story 1 establishes sync execution and can run independently of User Story 2 once that path exists
- **User Story 4 (P2)**: Starts after Foundational and can be implemented after the shared bilingual draft model exists; it adds profile-prefill and local persistence without changing the core sync contract

### Within Each User Story

- Jest coverage tasks should be written before or alongside the corresponding service change and must fail before the final implementation is considered complete
- Service-layer sync behavior should land before screen wiring
- Screen integration should finish before manual validation

### Parallel Opportunities

- T004, T005, and T006 can run in parallel after T003
- T007 and T008 can run in parallel for User Story 1
- T011 and T012 can run in parallel for User Story 2
- T014, T015, and T016 can run in parallel for User Story 3
- T018, T019, and T020 can run in parallel for User Story 4

---

## Parallel Example: User Story 1

```bash
# Launch the service test and sync implementation together:
Task: "Add Jest coverage for Arabic-to-English and English-to-Arabic auto-population in __tests__/cvService.test.ts"
Task: "Implement syncDraftForLanguage success flow and localized field mapping in src/services/cvService.ts"
```

---

## Parallel Example: User Story 3

```bash
# Launch failure-path work on separate write scopes:
Task: "Add Jest coverage for protected text preservation and field-level sync failures in __tests__/cvService.test.ts"
Task: "Preserve protected text and emit field-level sync failure results in src/services/cvTranslationService.ts and src/services/cvService.ts"
Task: "Extend Android translation error mapping for sync failures in android/app/src/main/java/com/tanamitrain/cv/CVTranslationModule.kt"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate bilingual switching and editable auto-population on Android
5. Stop and demo if the MVP is sufficient

### Incremental Delivery

1. Establish shared bilingual draft and export boundaries
2. Deliver User Story 1 for editable language switching
3. Add User Story 2 for last-edited-language propagation
4. Add User Story 3 for failure handling, protected text, and recovery messaging
5. Add User Story 4 for ATS contact defaults and local draft persistence
6. Finish with full Jest and Android validation

### Parallel Team Strategy

1. One engineer completes Setup and Foundational work
2. After Foundational completion:
   - Engineer A: User Story 1 screen integration
   - Engineer B: User Story 2 sync-state logic
   - Engineer C: User Story 3 failure handling and Android error mapping
3. Rejoin for polish and device validation

---

## Notes

- Keep the bilingual editor inside `src/screens/cv/CVFormScreen.tsx` rather than creating a separate screen.
- Reuse the existing export pipeline in `src/services/cvService.ts` and `src/services/cvHtmlRenderer.ts`.
- Do not silently overwrite manual target-language edits during sync.
