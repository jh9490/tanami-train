# Tasks: YouTube Live Course Preview

**Input**: Design documents from `/specs/007-youtube-live-preview/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/live-preview-ui.md, quickstart.md

## Phase 1: Setup

- [x] T001 Verify current feature pointer in `.specify/feature.json`
- [x] T002 Verify existing WebView dependency in `package.json`

## Phase 2: Foundational

- [x] T003 Update course item type with optional `live_url` in `src/types/api.ts`
- [x] T004 Add YouTube URL normalization utility in `src/util/youtubeLive.ts`
- [x] T005 [P] Add focused tests for YouTube URL normalization in `__tests__/courseLivePreview.test.ts`

## Phase 3: User Story 1 - Preview a course live broadcast from My Courses (Priority: P1)

**Goal**: User opens a course from My Courses and previews its live YouTube broadcast in a dedicated course detail tab.

**Independent Test**: Open a course with a valid `live_url`, select `البث المباشر`, and confirm the expected preview loads while existing tabs remain available.

- [x] T006 [US1] Pass selected course `live_url` through navigation in `src/screens/MyCoursesScreen.tsx`
- [x] T007 [US1] Add LivePreviewTab component and WebView player rendering in `src/screens/CourseTabsScreen.tsx`
- [x] T008 [US1] Add `البث المباشر` top tab with selected course live URL params in `src/screens/CourseTabsScreen.tsx`

## Phase 4: User Story 2 - Support live preview for all course status groups (Priority: P2)

**Goal**: Live preview behaves the same for previous, current, and upcoming course items.

**Independent Test**: Open one valid live course from each My Courses filter and confirm the live preview tab is available and attempts playback.

- [x] T009 [US2] Preserve current, upcoming, and previous course filter behavior while carrying `live_url` in `src/screens/MyCoursesScreen.tsx`
- [x] T010 [US2] Ensure live preview tab has no course-status blocking logic in `src/screens/CourseTabsScreen.tsx`

## Phase 5: User Story 3 - Handle unavailable live broadcast links clearly (Priority: P3)

**Goal**: Missing, malformed, unsupported, or failed live links show a stable unavailable state.

**Independent Test**: Open a course with invalid or missing `live_url` and confirm Arabic unavailable messaging appears without breaking other tabs.

- [x] T011 [US3] Render Arabic unavailable state for missing or invalid live URLs in `src/screens/CourseTabsScreen.tsx`
- [x] T012 [US3] Handle WebView load errors without leaving a blank player in `src/screens/CourseTabsScreen.tsx`

## Phase 6: Polish & Validation

- [x] T013 Run focused Jest test `npm test -- courseLivePreview`
- [x] T014 Run broader Jest validation `npm test`
- [x] T015 Review changed files and confirm no unrelated dirty-worktree changes were modified

## Validation Notes

- `npm test -- courseLivePreview` passed.
- `npm test` passed.
- `npx tsc --noEmit` passed.

## Dependencies

- Phase 1 must complete before Phase 2.
- Phase 2 must complete before story implementation.
- US1 is the MVP and must complete before US2 and US3 validation.
- US2 depends on US1 navigation and tab rendering.
- US3 depends on US1 live preview tab rendering.

## Parallel Opportunities

- T005 can be written after T004 and before UI wiring.
- US2 validation tasks can be reviewed alongside US3 behavior after the live tab exists.

## Implementation Strategy

1. Complete setup and foundational type/utility work.
2. Deliver US1 as the MVP: route `live_url`, render the live tab, and load a valid YouTube preview.
3. Confirm no status-based restrictions were introduced for US2.
4. Add and validate clear unavailable handling for US3.
5. Run focused and broad tests, then review the final diff.
