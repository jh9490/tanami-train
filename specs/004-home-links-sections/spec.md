# Feature Specification: Homepage Links and Sections

**Feature Branch**: `004-home-links-sections`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "in the home page we have social accounts, we need to make sure they navigate without issues; add a new icon link for http://tanamitrain.com; remove the homepage switch for upcoming/current courses and keep two vertically stacked sections, hiding any empty section"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Home Page External Links (Priority: P1)

As a visitor on the home page, I want every social or website icon to open the correct destination so I can reach Tanami Train channels without broken navigation.

**Why this priority**: Broken outbound links directly block a core promotional and contact path on the home page.

**Independent Test**: Can be fully tested by tapping each displayed icon on the home page and confirming the device opens the intended destination or shows a clear failure state when opening is impossible.

**Acceptance Scenarios**:

1. **Given** the user is viewing the home page, **When** they tap a social account icon, **Then** the system opens the matching Tanami Train social destination without navigating to the wrong account.
2. **Given** the user is viewing the home page, **When** they tap the website icon, **Then** the system opens `http://tanamitrain.com`.
3. **Given** the device cannot open an external destination, **When** the user taps any home page external-link icon, **Then** the system keeps the user in the app and shows a clear failure message.

---

### User Story 2 - View Current and Upcoming Courses Together (Priority: P2)

As a visitor on the home page, I want current courses and upcoming courses shown as separate stacked sections so I can browse both states without switching tabs.

**Why this priority**: The current toggle adds friction and hides one course state at a time, making discovery harder.

**Independent Test**: Can be fully tested by loading the home page with both current and upcoming course data and verifying that both sections appear in vertical order without a toggle control.

**Acceptance Scenarios**:

1. **Given** the home page has both current and upcoming course items, **When** the course area loads, **Then** the page shows a current section and an upcoming section stacked vertically.
2. **Given** the course area is visible, **When** the user scrolls the home page, **Then** they can review both course sections without using a filter or switch control.

---

### User Story 3 - Hide Empty Course Sections (Priority: P3)

As a visitor on the home page, I want empty course sections to be hidden so the page only shows relevant content.

**Why this priority**: Empty sections create dead space and imply missing content.

**Independent Test**: Can be fully tested by loading the home page with only one course state populated and confirming that only the non-empty section is shown.

**Acceptance Scenarios**:

1. **Given** there are current courses and no upcoming courses, **When** the home page loads, **Then** only the current section is shown.
2. **Given** there are upcoming courses and no current courses, **When** the home page loads, **Then** only the upcoming section is shown.
3. **Given** there are no current or upcoming courses, **When** the home page loads, **Then** the page does not show empty current or upcoming sections.

### Edge Cases

- If one external destination is temporarily unavailable or unsupported on the device, the corresponding tap should fail gracefully without affecting the other icons.
- If the course feed changes between refreshes, the home page should recalculate which sections are shown based on the latest available current and upcoming items.
- If both course groups are empty, the course area should avoid showing empty titled containers or an unused filter control.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display home page external-link icons that navigate to the correct Tanami Train social destinations.
- **FR-002**: The system MUST add a home page website icon that opens `http://tanamitrain.com`.
- **FR-003**: The system MUST attempt to open each home page external destination from the icon the user selected.
- **FR-004**: The system MUST keep the user in the app and provide a clear failure message if an external destination cannot be opened.
- **FR-005**: The system MUST remove the current/upcoming course filter switch from the home page.
- **FR-006**: The system MUST render current courses and upcoming courses as separate home page sections in vertical order on the same scrollable page.
- **FR-007**: The system MUST show the current section only when at least one current course is available.
- **FR-008**: The system MUST show the upcoming section only when at least one upcoming course is available.
- **FR-009**: The system MUST preserve access to the existing course cards within whichever sections are visible.

### Key Entities *(include if feature involves data)*

- **Home External Link**: A tappable icon on the home page that represents one Tanami Train destination and resolves to a single external URL.
- **Course Section**: A titled group of home page course cards representing one availability state, either current or upcoming.
- **Course Availability State**: The classification used to place a course card into the current section or the upcoming section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation of the home page, 100% of displayed social and website icons open the intended destination or present a clear in-app failure message.
- **SC-002**: Users can reach either the current courses list or the upcoming courses list from the home page without interacting with a filter control.
- **SC-003**: When only one course state contains content, the home page shows exactly one course section and no empty section placeholder.
- **SC-004**: When both course states contain content, both sections are discoverable within one vertical scroll flow on the home page.

## Assumptions

- The existing home page course data already identifies whether an item belongs in the current or upcoming group.
- Existing social account destinations remain valid and only require reliable navigation behavior plus the addition of the website destination.
- The website link should be treated as a peer to the social icons within the same home page outbound-links area.
- This feature changes the home page presentation only and does not alter course data definitions or backend behavior.
