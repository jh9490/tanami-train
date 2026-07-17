# Feature Specification: YouTube Live Course Preview

**Feature Branch**: `[007-youtube-live-preview]`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: User description: "Make user able to see live YouTube broadcasting of the course on his mobile app. When user views his course in My Courses tab, every course now becomes with live_url attribute for every item in items array. User will click on course card and see a new tab to preview the player of live YouTube video. This applies for all kinds of courses: previous, current, and upcoming. After testing the feature, more restrictions and new UI enhancements will be added."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview a course live broadcast from My Courses (Priority: P1)

As an enrolled user, I want to open a course from My Courses and preview its live broadcast in a dedicated course tab, so I can watch the course broadcast from inside the mobile app.

**Why this priority**: This is the core user value of the feature and provides a complete testable flow from course discovery to video preview.

**Independent Test**: Sign in as a user with at least one course containing a valid `live_url`, open My Courses, tap the course card, open the new live preview tab, and confirm the live video player loads the expected broadcast.

**Acceptance Scenarios**:

1. **Given** an enrolled user is viewing My Courses and a course item has a valid `live_url`, **When** the user taps that course card, **Then** the course detail experience includes a live preview tab for that course.
2. **Given** the user is on the course detail experience for a course with a valid `live_url`, **When** the user opens the live preview tab, **Then** the app displays a playable preview of the course's YouTube live broadcast.
3. **Given** the live preview tab is open, **When** the user leaves the course detail experience or switches away from the live tab, **Then** the user can continue navigating the app without losing access to the existing course detail tabs.

---

### User Story 2 - Support live preview for all course status groups (Priority: P2)

As an enrolled user, I want the live preview option to work for previous, current, and upcoming courses, so course status does not prevent me from testing or accessing the broadcast preview.

**Why this priority**: The requirement explicitly applies to every course category shown in My Courses, and inconsistent status handling would make the feature incomplete.

**Independent Test**: Use test data with previous, current, and upcoming courses that each include `live_url`, open each course from My Courses, and verify that each one exposes and loads the live preview tab.

**Acceptance Scenarios**:

1. **Given** a previous course has a valid `live_url`, **When** the user opens the course from My Courses, **Then** the live preview tab is available and can load the broadcast preview.
2. **Given** a current course has a valid `live_url`, **When** the user opens the course from My Courses, **Then** the live preview tab is available and can load the broadcast preview.
3. **Given** an upcoming course has a valid `live_url`, **When** the user opens the course from My Courses, **Then** the live preview tab is available and can load the broadcast preview.

---

### User Story 3 - Handle unavailable live broadcast links clearly (Priority: P3)

As an enrolled user, I want clear feedback when a course live broadcast cannot be previewed, so I understand that the course opened correctly even if the video is unavailable.

**Why this priority**: The primary happy path assumes every course item includes `live_url`, but real data can still contain empty, invalid, private, expired, or unavailable links.

**Independent Test**: Open a course whose live broadcast link is missing or cannot be played, then confirm the live preview tab stays stable and shows a clear unavailable state instead of a broken or blank experience.

**Acceptance Scenarios**:

1. **Given** a course item has no usable live broadcast link, **When** the user opens the live preview tab, **Then** the app shows a clear unavailable message within the live preview area.
2. **Given** the video service refuses playback or the broadcast is not currently available, **When** the user opens the live preview tab, **Then** the app keeps the course detail screen usable and communicates that the broadcast cannot be previewed.

---

### Edge Cases

- What happens when `live_url` exists on the course item but is empty, malformed, or points to unsupported content?
- How does the app behave when the YouTube broadcast is private, deleted, age-restricted, not started, or no longer live?
- What happens when the user opens a course while the device is offline or has unstable connectivity?
- How does the live preview tab behave when the user quickly switches between course detail tabs or opens several courses in sequence?
- How is the course detail experience preserved when a course has no playable live preview but still has other existing course content?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST recognize `live_url` as a live broadcast link attribute on every course item provided to the My Courses list.
- **FR-002**: Users MUST be able to open a course card from My Courses and reach the existing course detail experience.
- **FR-003**: The system MUST add a dedicated live preview tab to the course detail experience for course items that include live broadcast link data.
- **FR-004**: The live preview tab MUST display the selected course's YouTube live broadcast using that course item's `live_url`.
- **FR-005**: The live preview tab MUST be available for previous, current, and upcoming course items without adding status-based restrictions in this increment.
- **FR-006**: The system MUST preserve all existing course card navigation and existing course detail tabs while adding the live preview tab.
- **FR-007**: The system MUST ensure the live preview tab uses the selected course's own live broadcast link and does not reuse a link from another course.
- **FR-008**: The system MUST show a clear unavailable state when the selected course has no usable live broadcast link or the broadcast cannot be previewed.
- **FR-009**: The system MUST keep the course detail screen navigable if the live broadcast preview fails to load.
- **FR-010**: The system MUST avoid adding new access restrictions, entitlement checks, or status-specific blocking rules for live preview in this first testing increment.
- **FR-011**: The system MUST support both Arabic and English user-facing messaging for live preview labels and unavailable states consistent with the current app localization approach.

### Key Entities *(include if feature involves data)*

- **Course Item**: A course displayed in My Courses. It now includes a `live_url` attribute in addition to the existing course data used by course cards and course details.
- **Live Broadcast Link**: The per-course URL used to preview the course's YouTube live broadcast.
- **Course Status Group**: The user's previous, current, or upcoming course grouping; live preview behavior applies across all three groups.
- **Live Preview Tab**: A course detail tab that presents the selected course's live broadcast preview and related unavailable state when playback cannot proceed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual QA, 100% of tested courses with valid live broadcast links open a live preview tab that displays the expected course broadcast.
- **SC-002**: In manual QA, previous, current, and upcoming course samples each expose the live preview tab and attempt playback successfully when given valid live broadcast links.
- **SC-003**: In manual QA, 100% of tested invalid or unavailable live broadcast links show a clear unavailable state without leaving the user on a blank or crashed screen.
- **SC-004**: In manual QA, all existing course detail tabs and course card navigation remain usable after the live preview tab is added.
- **SC-005**: In manual QA, the live preview tab label and unavailable messaging are understandable in the app's supported user-facing languages.

## Assumptions

- My Courses already receives or will receive course items that include a `live_url` attribute in each item.
- The first increment is for preview and testing only; additional restrictions, eligibility rules, analytics, and visual refinements are intentionally deferred.
- The live preview should be available from the course detail experience rather than directly embedded on the course card.
- Course status groups already exist in My Courses and can be identified as previous, current, or upcoming.
- Existing authentication and course enrollment behavior remains unchanged by this feature.
