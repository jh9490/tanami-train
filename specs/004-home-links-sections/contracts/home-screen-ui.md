# UI Contract: Home Screen Links and Course Sections

## Scope

Define the user-facing contract for the home page outbound-links area and the stacked course sections.

## Outbound Links Area

- The home page shows one outbound-links row in the existing social area.
- The row includes the existing Tanami Train social destinations plus a website destination for `http://tanamitrain.com`.
- Each icon opens only its mapped destination.
- If the device cannot open a destination, the app remains on the home screen and shows a clear alert instead of failing silently.

## Course Sections

- The home page no longer shows a segmented switch or filter for `current` and `upcoming`.
- The home page renders separate vertical sections for the two availability groups using the existing fetched course data.
- Each visible section preserves the existing course-card layout and tap-to-open detail dialog behavior.
- A section is hidden when its availability group has zero items.
- If both groups are empty, the home page avoids rendering empty titled sections and may show one neutral no-content message for the course area.

## Ordering and Visibility

- The screen renders sections in one consistent vertical order for every refresh cycle.
- Visibility is derived only from the latest loaded course groups.
- Refreshing the home page recalculates which sections are visible without requiring user filter interaction.

## Validation Expectations

- Manual QA must verify every visible icon opens the intended destination.
- Manual QA must verify both-section, current-only, upcoming-only, and no-course states.
- Manual QA must verify that tapping a course card from any visible section still opens the existing details dialog.
