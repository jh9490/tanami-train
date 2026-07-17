# Research: YouTube Live Course Preview

## Decision: Use the existing WebView dependency for YouTube preview

**Rationale**: `react-native-webview` is already installed in the app and can render a YouTube embed without adding a new native package. This keeps the increment small and avoids native dependency churn while still supporting in-app preview.

**Alternatives considered**:

- Open the YouTube URL externally: simpler, but does not satisfy the in-app preview requirement.
- Add a YouTube-specific React Native player package: unnecessary for the first testable increment and adds native dependency risk.

## Decision: Pass `live_url` through navigation from My Courses to CourseTabs

**Rationale**: The selected course item already exists in `MyCoursesScreen` when the user taps a course card. Passing the link alongside existing route params avoids an extra fetch and ensures the preview uses the selected course item's own link.

**Alternatives considered**:

- Fetch `live_url` again inside `CourseTabsScreen`: more moving parts and unnecessary if the My Courses item already carries the field.
- Store `live_url` globally: not needed for transient per-course navigation state.

## Decision: Normalize YouTube links before rendering

**Rationale**: Course data may contain YouTube watch, share, shorts, live, or embed URLs. A small utility can extract the video id and create a stable embed URL while returning `null` for unsupported or malformed links.

**Alternatives considered**:

- Render raw URLs directly in WebView: less reliable across YouTube URL formats.
- Accept only one URL format: too brittle for admin-entered course data.

## Decision: Show a stable unavailable state for missing or invalid links

**Rationale**: The first increment must remain testable even when live links are missing, private, deleted, or invalid. A clear message is better than a blank player surface or navigation failure.

**Alternatives considered**:

- Hide the live tab when a link is missing: conflicts with the spec's explicit unavailable-state behavior.
- Block previous or upcoming courses: deferred because this increment must not add new restrictions.
