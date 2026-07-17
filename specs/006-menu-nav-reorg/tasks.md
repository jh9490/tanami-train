# Tasks: Menu Navigation Reorganization

**Input**: Design documents from `/specs/006-menu-nav-reorg/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/navigation-ui.md`

**Tests**: Manual navigation validation is required from `specs/006-menu-nav-reorg/quickstart.md`. Automated coverage is not required by this spec increment.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Review the current navigation and menu composition before making changes

- [ ] T001 Review the current bottom-tab, home authenticated shortcut, and menu-screen routing flow in `src/navigation/AppNavigator.tsx`, `src/screens/HomeScreen.tsx`, and `src/screens/menu/MenuScreen.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the navigation touchpoints that later story work will update

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Define the updated route touchpoints for tab labels, tab icons, and menu-stack destinations in `src/navigation/AppNavigator.tsx`
- [ ] T003 [P] Confirm the authenticated home shortcut grid structure that will host the new `My CV` entry in `src/screens/HomeScreen.tsx`

**Checkpoint**: The navigator and home/menu entry points are understood and ready for story-specific changes.

---

## Phase 3: User Story 1 - Reach My CV from the home page instead of the bottom bar (Priority: P1) 🎯 MVP

**Goal**: Remove `My CV` from the bottom navigation and keep it reachable from the authenticated home shortcuts

**Independent Test**: Sign in, open the home page, confirm `My CV` is available there, and confirm the bottom navigation no longer shows a `My CV` tab.

### Implementation for User Story 1

- [ ] T004 [US1] Remove the `CVGenerator` bottom-tab destination, labels, and related tab metadata from `src/navigation/AppNavigator.tsx`
- [ ] T005 [US1] Replace the home authenticated `Settings` shortcut with a `My CV` shortcut that opens the existing CV screen in `src/screens/HomeScreen.tsx`
- [ ] T006 [US1] Preserve guest visibility rules so unauthenticated users do not see an unusable `My CV` shortcut in `src/screens/HomeScreen.tsx`

**Checkpoint**: Authenticated users can open My CV from the home page without a bottom-tab My CV item.

---

## Phase 4: User Story 2 - Use the bottom bar for Menu and find Settings inside it (Priority: P2)

**Goal**: Keep Menu as the utility destination and move Settings access into that screen

**Independent Test**: Open the app, enter the menu from the bottom bar, and confirm tapping `Settings` reaches the existing settings screen.

### Implementation for User Story 2

- [ ] T007 [US2] Add the `Settings` destination to the menu-owned navigation path in `src/navigation/AppNavigator.tsx`
- [ ] T008 [US2] Add a `Settings` utility row to the menu screen and route it to the existing settings screen in `src/screens/menu/MenuScreen.tsx`
- [ ] T009 [US2] Preserve the remaining menu utility rows and authenticated actions after inserting the new settings entry in `src/screens/menu/MenuScreen.tsx`

**Checkpoint**: The bottom navigation still exposes Menu, and Settings is reachable from the menu screen.

---

## Phase 5: User Story 3 - Scroll the menu screen vertically without content clipping (Priority: P3)

**Goal**: Ensure the menu remains usable on smaller-height devices after the extra row is added

**Independent Test**: Open the menu screen on a shorter device or emulator, scroll top-to-bottom, and confirm every row remains fully visible and tappable.

### Implementation for User Story 3

- [ ] T010 [US3] Convert the menu screen container to a vertically scrollable layout in `src/screens/menu/MenuScreen.tsx`
- [ ] T011 [US3] Add bottom spacing and layout adjustments so the final menu rows remain visible above tab and system insets in `src/screens/menu/MenuScreen.tsx`

**Checkpoint**: The menu screen scrolls vertically and no longer clips bottom content on shorter viewports.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the completed navigation flow and refresh context docs if the documented app flow changes

- [ ] T012 Run manual validation from `specs/006-menu-nav-reorg/quickstart.md`
- [ ] T013 [P] Refresh `AGENTS.md` and `system_context.md` if the implemented navigation flow changes the documented app structure or user-entry paths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup and blocks all story work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **User Story 3 (Phase 5)**: Depends on User Story 2 because the new menu entry increases the vertical menu content that must remain scrollable
- **Polish (Phase 6)**: Depends on all intended user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers the MVP navigation move for My CV
- **User Story 2 (P2)**: Starts after Foundational and delivers the Settings move into Menu
- **User Story 3 (P3)**: Starts after User Story 2 because the scrollability work must validate the menu after Settings is added

### Within Each User Story

- Navigation metadata should be updated before final screen wiring in the relevant story
- Home shortcut updates should preserve authenticated visibility logic
- Menu entry additions should be complete before final scroll-layout adjustments
- Manual validation should happen after all intended stories are implemented

### Parallel Opportunities

- T003 can run in parallel with T002 after Setup
- User Story 1 and User Story 2 can proceed in parallel after Foundational if the navigator edits are coordinated carefully
- T013 can run in parallel with T012 during polish if documentation updates are required

---

## Parallel Example: User Story 2

```bash
# Launch the menu route and menu-screen row updates together once navigation ownership is clear:
Task: "Add the Settings destination to the menu-owned navigation path in src/navigation/AppNavigator.tsx"
Task: "Add a Settings utility row to the menu screen and route it to the existing settings screen in src/screens/menu/MenuScreen.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate that My CV is reachable from Home and removed from the bottom tabs
5. Stop and demo if the CV navigation move is the immediate priority

### Incremental Delivery

1. Establish the navigation touchpoints in `AppNavigator`, `HomeScreen`, and `MenuScreen`
2. Deliver User Story 1 for the My CV entry-point move
3. Deliver User Story 2 for the Settings move into Menu
4. Deliver User Story 3 for menu scroll usability on short screens
5. Finish with manual quickstart validation and any needed context refresh

### Parallel Team Strategy

1. One engineer completes Setup and Foundational work
2. After Foundational completion:
   - Engineer A: User Story 1 home and tab reorganization
   - Engineer B: User Story 2 menu settings entry
3. Rejoin for User Story 3 menu scroll adjustments and final validation

---

## Notes

- Keep the implementation within the existing navigator and screen files instead of adding a new navigation layer.
- Reuse the existing `CVFormScreen` and `SettingsScreen` destinations rather than creating wrapper routes.
- Make the menu scroll behavior solve the current height limitation instead of hiding lower-priority rows.
