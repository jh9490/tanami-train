# Data Model: Homepage Links and Sections

## Home External Link

**Purpose**: Represent one tappable outbound destination shown in the home page icon row.

**Fields**:

- `id`: Stable identifier for rendering and testing, such as `facebook`, `instagram`, `whatsapp`, or `website`
- `label`: User-facing label for accessibility and future UI copy
- `iconName`: Icon identifier used by the home screen visual presentation
- `url`: Destination URL or scheme-backed web destination opened when the user taps the icon
- `kind`: Destination category used for behavior grouping, such as `social` or `website`

**Validation Rules**:

- `id` must be unique within the rendered link list.
- `url` must be a non-empty destination supported by the shared safe-link helper.
- Every rendered link must map to one intended Tanami Train destination.

## Course Availability Bucket

**Purpose**: Hold the already-classified home screen course cards for one availability state.

**Fields**:

- `key`: Availability identifier, either `current` or `upcoming`
- `title`: Section heading shown above the course cards
- `items`: Array of `CourseLite` entries already prepared by the current home screen fetch logic

**Validation Rules**:

- `key` must correspond to an existing home screen course classification.
- `items` can be empty in source state but must not produce a rendered section when empty.

## Visible Course Section

**Purpose**: Represent a course section that is eligible to render on the home page after empty groups are filtered out.

**Fields**:

- `bucketKey`: Source availability bucket, either `current` or `upcoming`
- `title`: Display heading for the visible section
- `count`: Number of course cards in the section
- `cards`: Ordered course cards rendered in the section
- `isVisible`: Derived render flag based on whether `count > 0`

**Validation Rules**:

- `isVisible` must be `true` only when `count` is greater than zero.
- `cards.length` must equal `count`.
- The section must preserve course-card tap behavior and continue to open the existing detail dialog.

## Screen Rendering States

### Loading

- Slider or course data is still being fetched.
- The screen may show loading indicators instead of final section content.

### Populated

- At least one visible course section exists.
- The screen renders only non-empty sections in the chosen vertical order.

### Empty

- Neither `current` nor `upcoming` contains items.
- The screen hides both titled sections and may show one neutral no-content message for the course area.

### Link Failure

- A user taps an outbound icon and the device cannot open the destination.
- The app stays on the home screen and shows a clear failure alert.
