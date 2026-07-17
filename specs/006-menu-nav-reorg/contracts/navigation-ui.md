# UI Contract: Navigation Reorganization

## Scope

Define the user-facing navigation contract for moving My CV to the home page, placing Settings in the menu, and making the menu screen scrollable.

## Bottom Navigation

- The bottom navigation continues to expose the app’s primary global destinations.
- `My CV` is no longer shown as a bottom-tab destination.
- `Menu` remains available from the bottom navigation and serves as the entry point for menu utilities.

## Home Authenticated Shortcuts

- The authenticated home-page shortcut area includes a `My CV` entry after this feature is applied.
- The `My CV` shortcut opens the existing CV screen.
- Guest users do not see an unusable authenticated `My CV` shortcut.

## Menu Screen

- The menu screen contains the app’s utility and account-related navigation entries.
- The menu includes a `Settings` row that opens the existing settings screen.
- Existing menu actions remain reachable after the settings row is added.
- The menu screen supports vertical scrolling when the full content exceeds the viewport height.
- The final visible menu row remains fully tappable above the bottom navigation and system inset area.

## Settings Destination

- The existing settings screen remains functionally the same.
- Only its primary access point changes from the home-page shortcut to the menu screen.

## Validation Expectations

- Manual QA must verify the bottom navigation no longer shows `My CV`.
- Manual QA must verify authenticated users can still reach `My CV` from the home page.
- Manual QA must verify `Settings` opens correctly from the menu.
- Manual QA must verify menu content remains scrollable and unclipped on smaller-height devices.
