# Quickstart: Homepage Links and Sections

## Prerequisites

- Install dependencies for the React Native app.
- Launch the application on an Android emulator, iOS simulator, or physical device.
- Ensure the home page can fetch the current slider and activities data.

## Scenario 1: Verify outbound icons

1. Open the home page.
2. Locate the outbound-links row in the social section.
3. Tap the Facebook icon and confirm the correct Tanami Train Facebook destination opens.
4. Repeat for Instagram and WhatsApp.
5. Tap the website icon and confirm `http://tanamitrain.com` opens.

## Scenario 2: Verify graceful outbound-link failure

1. Run the app on a device or simulator state where opening a destination can fail, or temporarily replace one icon URL during development with an unsupported target.
2. Tap the affected icon.
3. Confirm the app remains on the home screen and shows a clear failure alert.

## Scenario 3: Verify both course sections

1. Load the home page with both current and upcoming course items available.
2. Confirm there is no segmented switch.
3. Confirm the home page shows separate stacked sections for current and upcoming courses.
4. Tap one card in each section and confirm the existing course detail dialog opens.

## Scenario 4: Verify current-only state

1. Load the home page with current courses only.
2. Confirm the current section is visible.
3. Confirm the upcoming section is hidden.

## Scenario 5: Verify upcoming-only state

1. Load the home page with upcoming courses only.
2. Confirm the upcoming section is visible.
3. Confirm the current section is hidden.

## Scenario 6: Verify no-course state

1. Load the home page with no current or upcoming items.
2. Confirm the page does not show empty current or upcoming titled sections.
3. Confirm the course area either stays absent or shows only one neutral no-content message.
