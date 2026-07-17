# Data Model: YouTube Live Course Preview

## Course Item

Represents one course row displayed in My Courses.

### Existing fields used

- `registration_id`: Stable registration identifier for list keys when present.
- `phase`: Course status group: `current`, `upcoming`, or `previous`.
- `activity.id`: Activity identifier used by course detail media and certificate APIs.
- `activity.date`: Activity start date shown on the course card.
- `activity.end_date`: Activity end date shown on the course card.
- `activity.live`: Numeric live flag returned by the API.
- `activity.live_url`: Optional string URL for the activity's YouTube live broadcast preview.
- `course.id`: Course identifier used to fetch course details.
- `course.name_ar`: Arabic course title shown in the app.
- `course.name_en`: English course title when available.

### Compatibility field

- `live_url`: Optional root-level fallback URL if the API returns the broadcast link outside `activity`.

### Validation rules

- `activity.live_url` may be absent, empty, or invalid; the UI must not crash.
- A valid `activity.live_url` must resolve to a supported YouTube video identifier before preview rendering.
- The selected course's `activity.live_url` must be passed to the selected course detail route only, falling back to root `live_url` if present.

## Live Preview

Represents the normalized player state shown in the live preview tab.

### Fields

- `sourceUrl`: Original course `live_url` value.
- `embedUrl`: Normalized YouTube embed URL derived from `sourceUrl`, or `null` if unavailable.
- `isAvailable`: Whether an embeddable preview can be attempted.
- `unavailableMessage`: Arabic message shown when preview cannot be attempted or playback fails.

### State transitions

- Missing or unsupported URL -> unavailable state.
- Supported URL -> player loading state.
- Player load error -> unavailable state.
- Player loaded -> playable preview state.

## Course Status Group

Represents the My Courses filter group containing the selected course.

### Values

- `current`
- `upcoming`
- `previous`

### Validation rules

- Live preview behavior must not differ by status group in this increment.
