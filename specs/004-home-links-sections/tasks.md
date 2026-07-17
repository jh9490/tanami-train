# Tasks: Homepage Links and Sections

**Input**: Design documents from `/specs/004-home-links-sections/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/home-screen-ui.md`

**Tests**: Manual home screen validation is required from `specs/004-home-links-sections/quickstart.md`. Automated coverage is not required by this spec increment.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Review the current home screen link handling and course presentation before making changes

- [X] T001 Review the existing home outbound-link, segmented toggle, and course dialog flow in `src/screens/HomeScreen.tsx`, `src/util/Linker.ts`, and `src/screens/components/CourseDialog.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared home-screen render inputs before user-story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Define derived course section metadata and shared section-heading copy in `src/screens/HomeScreen.tsx`
- [X] T003 [P] Confirm `src/util/Linker.ts` supports normalized website and social destinations for home-screen usage

**Checkpoint**: The home screen has shared section derivation and a reusable safe-link path ready for story work.

---

## Phase 3: User Story 1 - Open Home Page External Links (Priority: P1) 🎯 MVP

**Goal**: Let home page visitors open every Tanami Train social destination plus the website without broken navigation

**Independent Test**: Open the home page, tap each displayed icon, and confirm the intended destination opens or a clear failure alert appears while the app stays on the home screen.

### Implementation for User Story 1

- [X] T004 [P] [US1] Add configured outbound-link metadata for Facebook, Instagram, WhatsApp, and website in `src/screens/HomeScreen.tsx`
- [X] T005 [P] [US1] Refine destination opening and failure-alert behavior for website and social links in `src/util/Linker.ts`
- [X] T006 [US1] Replace inline social icon taps with mapped outbound icons that use the shared safe-link helper in `src/screens/HomeScreen.tsx`

**Checkpoint**: The home page outbound icon row opens the correct Tanami Train destinations, including `http://tanamitrain.com`.

---

## Phase 4: User Story 2 - View Current and Upcoming Courses Together (Priority: P2)

**Goal**: Show current and upcoming courses together in one vertical scroll flow without a filter toggle

**Independent Test**: Load the home page with both course groups available and confirm there is no switch control and both sections render vertically with the existing course-card behavior.

### Implementation for User Story 2

- [X] T007 [US2] Remove segmented-toggle state and sticky filter controls from `src/screens/HomeScreen.tsx`
- [X] T008 [US2] Render current and upcoming course sections sequentially with the existing course-card grid and `src/screens/components/CourseDialog.tsx` behavior from `src/screens/HomeScreen.tsx`
- [X] T009 [US2] Show one neutral course-area empty message only when both availability groups are empty in `src/screens/HomeScreen.tsx`

**Checkpoint**: Visitors can browse both course groups from one scrollable home screen without switching tabs.

---

## Phase 5: User Story 3 - Hide Empty Course Sections (Priority: P3)

**Goal**: Hide empty current or upcoming sections so the course area only shows relevant content

**Independent Test**: Load the home page with current-only, upcoming-only, and no-course states and confirm only non-empty sections appear.

### Implementation for User Story 3

- [X] T010 [US3] Filter derived course sections so empty current or upcoming groups do not render in `src/screens/HomeScreen.tsx`
- [X] T011 [US3] Recompute visible sections on fetch and refresh updates without restoring filter interaction in `src/screens/HomeScreen.tsx`

**Checkpoint**: Empty course groups stay hidden across first load and refresh flows.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the completed home screen flow and refresh shared context if documentation changes

- [ ] T012 Run manual validation from `specs/004-home-links-sections/quickstart.md`
- [ ] T013 [P] Refresh `AGENTS.md` and `system_context.md` if implementation changes the documented home-screen flow or active technology assumptions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks all story work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **User Story 3 (Phase 5)**: Depends on User Story 2 because empty-section hiding builds on the stacked-section rendering
- **Polish (Phase 6)**: Depends on all intended user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers the MVP outbound-link fix
- **User Story 2 (P2)**: Starts after Foundational and delivers stacked current and upcoming course browsing
- **User Story 3 (P3)**: Starts after User Story 2 establishes stacked section rendering

### Within Each User Story

- Shared destination handling should be aligned before final home-screen icon wiring
- Home screen section derivation should exist before stacked-section rendering
- Manual validation should happen after all intended stories are implemented

### Parallel Opportunities

- T003 can run in parallel with T002 after Setup
- T004 and T005 can run in parallel for User Story 1
- User Story 1 and User Story 2 can proceed in parallel after Foundational if staffing allows
- T013 can run in parallel with T012 during the polish phase when documentation changes are required

---

## Parallel Example: User Story 1

```bash
# Launch the link metadata and helper updates together:
Task: "Add configured outbound-link metadata for Facebook, Instagram, WhatsApp, and website in src/screens/HomeScreen.tsx"
Task: "Refine destination opening and failure-alert behavior for website and social links in src/util/Linker.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate every home outbound icon on device or emulator
5. Stop and demo if the outbound-link fix is the immediate priority

### Incremental Delivery

1. Establish shared home-screen section derivation and safe-link handling
2. Deliver User Story 1 for reliable outbound links and website access
3. Deliver User Story 2 for stacked current and upcoming sections
4. Deliver User Story 3 for hidden empty sections
5. Finish with manual quickstart validation and any needed context refresh

### Parallel Team Strategy

1. One engineer completes Setup and Foundational work
2. After Foundational completion:
   - Engineer A: User Story 1 outbound-link fixes
   - Engineer B: User Story 2 stacked course sections
3. Rejoin for User Story 3 visibility rules and final validation

---

## Notes

- Keep the implementation inside `src/screens/HomeScreen.tsx` and `src/util/Linker.ts` rather than adding a new home-screen architecture layer.
- Preserve the existing `CourseDialog` interaction while changing course section presentation.
- Hide empty course sections entirely instead of showing blank titled placeholders.
