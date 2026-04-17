# Quickstart: Bilingual CV Editing Sync

## Prerequisites

- Authenticated TanamiTrain user account
- Android device or emulator for automatic translation-sync validation
- Existing CV generator flow available in the authenticated tab navigation
- Optional ability to simulate translation-module failure for negative-path validation

## Scenario 1: Arabic remains the default editing language

1. Sign in and open the CV generator.
2. Confirm the editor opens in Arabic by default.
3. Confirm the draft is still accessible only in the authenticated flow.
4. Enter or keep Arabic values for full name, summary, and at least one existing section.

## Scenario 2: Switch from Arabic to English and review editable translated fields

1. From the Arabic editor, enter values for full name, summary, experience, education, and skills.
2. Add at least one certifications and courses entry and one volunteer experience entry.
3. Switch the editing language to English.
4. Allow the device to prepare the local translation model if needed.
5. Confirm the visible English fields are auto-populated.
6. Confirm the translated values remain editable instead of read-only.

## Scenario 3: Edit English and see those changes reflected back into Arabic

1. While viewing the English editor, change one or more translated values, including the full name or a repeatable-section entry.
2. Switch back to Arabic.
3. Confirm the corresponding Arabic fields reflect the latest English edits through the sync workflow.
4. Confirm unrelated fields remain unchanged.

## Scenario 4: Verify repeatable bilingual sections

1. Add multiple certifications and courses entries with a mix of complete and partial data.
2. Add multiple volunteer experience entries.
3. Switch languages in both directions.
4. Confirm each entry keeps its stable position and synced field values.
5. Confirm partially completed entries retain entered text without silent deletion.

## Scenario 5: Recover from translation or field-sync failure

1. Trigger a translation failure or make the native translation path unavailable.
2. Switch languages.
3. Confirm the app identifies the affected field or fields and preserves the current draft.
4. Manually edit the target-language field if needed.
5. Confirm export remains available for a valid active-language draft.

## Scenario 6: Export the selected language after bilingual editing

1. Complete or partially complete a bilingual draft.
2. Choose Arabic output and generate the PDF.
3. Confirm the Arabic PDF uses the latest Arabic values.
4. Choose English output and generate the PDF.
5. Confirm the English PDF uses the latest English values, including certifications and courses and volunteer experience.
