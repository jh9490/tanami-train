# Quickstart: YouTube Live Course Preview

## Prerequisites

- App can authenticate and open My Courses.
- My Courses test data includes previous, current, and upcoming course items.
- At least one item in each status group has a valid `live_url`.
- At least one item has a missing or invalid `live_url` for unavailable-state testing.

## Manual Validation

1. Start the app and sign in.
2. Open My Courses.
3. Select the current courses filter and open a course with a valid `live_url`.
4. Confirm the course detail screen includes a `البث المباشر` tab.
5. Open the tab and confirm the in-app preview attempts to load the expected YouTube broadcast.
6. Switch to the existing details, media, and certificate tabs and confirm they still work.
7. Repeat steps 3-6 for upcoming and previous course filters.
8. Open a course with a missing or invalid `live_url`.
9. Confirm the live preview tab shows an Arabic unavailable state and the course detail screen remains usable.

## Automated Validation

Run:

```sh
npm test -- courseLivePreview
```

The focused test validates YouTube URL normalization and invalid URL handling.
