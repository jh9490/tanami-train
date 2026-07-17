# Quickstart: Menu Navigation Reorganization

## Prerequisites

- Install dependencies for the React Native app.
- Launch the application on an Android emulator, iOS simulator, or physical device.
- Prepare one authenticated session and one guest session for validation.

## Scenario 1: Verify bottom-tab reorganization

1. Open the app as an authenticated user.
2. Inspect the bottom navigation.
3. Confirm `My CV` is no longer present as a bottom-tab item.
4. Confirm `Menu` is still available as a bottom-tab destination.

## Scenario 2: Verify My CV from the home page

1. Stay signed in and open the home page.
2. Locate the authenticated shortcut grid.
3. Confirm a `My CV` shortcut is visible there.
4. Tap the shortcut and confirm it opens the existing CV screen.

## Scenario 3: Verify Settings from the menu

1. Open the menu screen from the bottom navigation.
2. Confirm a `Settings` row is present in the menu list.
3. Tap `Settings`.
4. Confirm the app opens the existing settings screen successfully.

## Scenario 4: Verify guest visibility rules

1. Sign out or launch the app in a guest session.
2. Open the home page and confirm `My CV` is not shown in an unauthenticated shortcut context.
3. Open the menu screen and confirm guest-safe menu items still appear correctly.

## Scenario 5: Verify menu scrolling on a short viewport

1. Open the menu screen on a smaller-height device or emulator.
2. Scroll from top to bottom.
3. Confirm every menu row, including the last visible item, is fully visible and tappable.
4. Confirm the bottom-most row is not hidden behind the bottom tab bar or system navigation area.
