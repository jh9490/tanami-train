# Feature Specification: Menu Navigation Reorganization

**Feature Branch**: `[006-menu-nav-reorg]`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Reorganize the app navigation UI by moving My CV from the bottom tab bar to the home page, replacing the bottom tab item with Menu, moving Settings into the menu screen, and making the menu screen vertically scrollable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reach My CV from the home page instead of the bottom bar (Priority: P1)

As an authenticated user, I want to open My CV from the home page shortcuts instead of a dedicated bottom-tab item, so the bottom navigation stays focused on the app’s primary global destinations while CV access remains easy to find.

**Why this priority**: This is the core navigation change that motivated the feature and directly affects one of the app’s primary authenticated actions.

**Independent Test**: Sign in, open the home page, confirm a visible home shortcut opens the My CV screen, and confirm the bottom navigation no longer shows a separate My CV item.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the home page, **When** the user reviews the authenticated shortcut area, **Then** the page shows a My CV entry that opens the existing CV screen.
2. **Given** an authenticated user is using the bottom navigation, **When** the user looks across the tab items after this feature is applied, **Then** My CV is no longer present as a bottom-tab destination.
3. **Given** a guest user opens the home page, **When** the authenticated shortcut area is not available, **Then** the app does not expose an unusable My CV shortcut in that guest-only context.

---

### User Story 2 - Use the bottom bar for Menu and find Settings inside it (Priority: P2)

As a user, I want the bottom navigation to expose the menu screen, and I want Settings to be reachable from inside that menu, so account and configuration options are grouped in one predictable place.

**Why this priority**: Replacing the bottom-bar My CV entry with Menu only works if the menu becomes the clear home for settings and utility navigation.

**Independent Test**: Open the app, confirm the bottom navigation includes Menu, open Menu from the bottom bar, and verify that tapping Settings from the menu reaches the existing settings screen.

**Acceptance Scenarios**:

1. **Given** the app is displaying the bottom navigation, **When** the user scans the available tabs, **Then** the bottom bar includes Menu as a destination.
2. **Given** the user opens the menu screen from the bottom navigation, **When** the user selects Settings, **Then** the app navigates to the existing settings experience.
3. **Given** the menu screen contains several utility actions, **When** Settings is added to that list, **Then** the surrounding menu actions remain reachable and clearly labeled.

---

### User Story 3 - Scroll the menu screen vertically without content clipping (Priority: P3)

As a user, I want the menu screen to scroll vertically when its content grows, so I can reach every menu item on smaller screens and devices without layout cutoff.

**Why this priority**: Moving more actions into the menu increases its height pressure; without vertical scrolling, the reorganization creates a usability regression on smaller devices.

**Independent Test**: Open the menu screen on a smaller-height device or emulator, scroll from top to bottom, and confirm every visible menu action remains reachable without clipping or overlap.

**Acceptance Scenarios**:

1. **Given** the menu screen contains more content than fits within the device height, **When** the user scrolls vertically, **Then** the menu allows access to all items from top to bottom.
2. **Given** the menu screen is displayed on a taller device where content fits naturally, **When** the screen loads, **Then** the layout still appears stable without unnecessary clipping, overlap, or hidden content.
3. **Given** settings and other utility entries are shown in the menu screen, **When** the user reaches the bottom of the menu, **Then** the last item is fully visible and tappable above any system navigation area.

---

### Edge Cases

- What happens when an authenticated user signs out from the menu after Settings and other authenticated items have been added there?
- How does the home page behave when the authenticated shortcut area is unavailable and My CV should not be shown to guests?
- What happens on smaller devices when the menu contains both utility links and account actions plus the newly added Settings entry?
- How does the app preserve the existing Settings screen destination if it is moved under a different navigation entry point?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST remove My CV as a bottom-tab navigation item.
- **FR-002**: The system MUST keep My CV reachable for authenticated users from the home page.
- **FR-003**: The system MUST reuse the existing CV screen destination for the new home-page My CV entry rather than creating a separate CV flow.
- **FR-004**: The system MUST preserve the existing authenticated access behavior for My CV after its entry point moves to the home page.
- **FR-005**: The system MUST keep Menu available as a bottom-tab destination.
- **FR-006**: The system MUST expose Settings as a menu-screen action instead of relying on the home page shortcut that currently opens Settings.
- **FR-007**: The system MUST preserve navigation to the existing Settings screen after moving its entry point into the menu.
- **FR-008**: The system MUST keep the rest of the current menu utilities reachable after adding Settings to that screen.
- **FR-009**: The system MUST allow the menu screen to scroll vertically when its content exceeds the available viewport height.
- **FR-010**: The system MUST ensure the bottom-most menu item remains fully visible and tappable above system insets and bottom navigation.
- **FR-011**: The system MUST preserve the existing bottom navigation destinations other than the My CV replacement described in this feature.

### Key Entities *(include if feature involves data)*

- **Bottom Navigation Destination**: One primary app destination exposed in the bottom tab bar.
- **Home Shortcut Item**: A tappable action in the authenticated home-page shortcuts area that opens an app screen.
- **Menu Utility Entry**: A tappable action row inside the menu screen that routes to another screen or utility action.
- **Settings Destination**: The existing in-app settings screen that remains functionally the same while its access point moves.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual QA, 100% of authenticated test sessions can reach the existing My CV screen from the home page without using a bottom-tab My CV entry.
- **SC-002**: In manual QA, the bottom navigation no longer displays My CV and still exposes Menu as a working destination in 100% of tested sessions.
- **SC-003**: In manual QA, 100% of tested Settings navigations launched from the menu screen reach the existing settings experience successfully.
- **SC-004**: On representative small and standard-height devices in manual QA, all visible menu actions remain reachable through vertical scrolling without clipped or untappable bottom items.

## Assumptions

- The current home page authenticated shortcut area is the intended place to host the new My CV entry.
- Menu remains a bottom-tab destination rather than becoming a modal or drawer in this feature.
- The Settings screen itself does not need new settings content for this increment; only its access point changes.
- The existing CV screen and settings screen remain functionally unchanged outside their new navigation entry points.
- Menu scrolling should be resolved within the current screen structure rather than by reducing content or hiding actions.
