# UI Contract: Live Preview Tab

## Entry Point

From My Courses, the user taps a course card action for a course item. The app navigates to the existing course detail top-tab screen.

## Route Inputs

The course detail screen accepts the existing route values plus:

- `liveUrl`: Optional string containing the selected course item's `activity.live_url`, with root `live_url` as a compatibility fallback.

Existing route values remain unchanged:

- `courseId`
- `title`
- `activityId`
- `studentId`

## Live Preview Tab

The course detail top-tab navigator includes a tab titled `البث المباشر`.

### Happy path

When `liveUrl` contains a supported YouTube URL:

- The tab displays an in-app video preview area.
- The preview attempts to load the selected course's YouTube live broadcast.
- The embedded player includes YouTube-compatible referrer policy configuration to avoid player configuration errors such as Error 153.
- Existing detail, media, and certificate tabs remain available.

### Unavailable path

When `liveUrl` is missing, empty, malformed, unsupported, or fails to load:

- The tab remains present.
- The tab shows Arabic unavailable messaging.
- The user can continue using other course detail tabs.

## Supported URL Inputs

The first increment supports common YouTube URL forms that include a video id:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/live/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

Unsupported URLs enter the unavailable path.
