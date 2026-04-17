# Quickstart: English CV Output From Arabic Drafts

## Prerequisites

- Authenticated TanamiTrain user account
- Existing CV generator flow from feature `001`
- Android device or emulator for supported English generation validation
- Optional unsupported Android device state or temporary native-module disable path to validate fallback messaging

## Scenario 1: Arabic remains the default

1. Sign in and open the CV generator.
2. Confirm the output language control defaults to Arabic.
3. Enter or keep a valid Arabic draft.
4. Generate the PDF.
5. Confirm the Arabic PDF still generates and exports through the existing flow.

## Scenario 2: Generate English output from the Arabic draft on Android

1. Sign in and open the CV generator on Android.
2. Enter a valid Arabic draft with summary, at least one experience, one education item, and skills.
3. Switch the output language to English.
4. Generate the PDF.
5. If the local translation model is not prepared yet, allow the device to complete that preparation.
6. Confirm the generated PDF uses English section labels and translated body text.
7. Confirm the entered full name remains as originally entered.
8. Export or share the English PDF successfully.

## Scenario 3: Unsupported Android-device fallback

1. Open the CV generator on an Android device where English translation is not supported in this increment.
2. Select English output.
3. Confirm the app shows a specific explanation instead of a generic PDF error.
4. Switch back to Arabic.
5. Confirm Arabic generation still works without re-entering the draft.

## Scenario 4: Retry after English translation failure

1. Trigger an English generation failure after selecting English output.
2. Confirm the screen shows a retryable translation-specific message.
3. Confirm the form data remains intact.
4. Retry English generation or switch back to Arabic generation without losing the draft.
