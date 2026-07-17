# Research: Homepage Links and Sections

## Decision: Reuse the shared outbound-link helper instead of keeping HomeScreen-specific link logic

**Rationale**: `src/util/Linker.ts` already centralizes safe external-link behavior, including scheme normalization, WhatsApp-specific fallback handling, and user-facing failure alerts. Reusing that path reduces duplicate logic and lowers the risk that one home page icon behaves differently from another.

**Alternatives considered**:

- Keep `HomeScreen.tsx` on its own `Linking.canOpenURL` and `Linking.openURL` implementation: rejected because the screen would continue to duplicate behavior that already exists in `src/util/Linker.ts`.
- Open links directly without capability checks: rejected because the feature explicitly requires graceful failure when the destination cannot be opened on the device.

## Decision: Replace the segmented toggle with derived stacked sections built from the existing course buckets

**Rationale**: The current fetch logic already splits activities into `current` and `upcoming` arrays. Rendering separate sections directly from those arrays removes the need for `activeTab` state while preserving the current data source, course cards, and course detail dialog behavior.

**Alternatives considered**:

- Keep the segmented control and add a second optional section below it: rejected because it keeps the discovery friction the spec is trying to remove.
- Re-fetch current and upcoming courses separately: rejected because the current API response already provides enough information to derive both sections in one load.

## Decision: Hide empty sections entirely and show at most one neutral course empty state when both groups are empty

**Rationale**: The spec requires empty sections to be hidden. Rendering only non-empty sections avoids dead space and confusing blank headings. When both groups are empty, one neutral message is sufficient and keeps the screen readable without implying missing content in a specific section.

**Alternatives considered**:

- Show titled empty placeholders for missing sections: rejected because it conflicts with the requirement to hide empty sections.
- Show no course-area feedback at all when both groups are empty: rejected because a neutral message provides better user feedback during valid no-content states.

## Decision: Add the website destination as a peer home-page icon in the existing social row

**Rationale**: The current home screen already groups outbound destinations in a single icon row under the social title. Adding the website link there preserves the established layout and keeps all public Tanami Train destinations discoverable in one location.

**Alternatives considered**:

- Add the website as a separate text link elsewhere on the screen: rejected because it weakens consistency with the existing icon-driven outbound-link area.
- Move all outbound links to a different section of the page: rejected because the feature does not require a broader home screen redesign.
