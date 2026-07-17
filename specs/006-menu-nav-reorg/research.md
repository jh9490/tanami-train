# Research: Menu Navigation Reorganization

## Decision: Reuse the existing menu stack instead of introducing a new navigation container

**Rationale**: `src/navigation/AppNavigator.tsx` already exposes `MenuRoot` as a bottom-tab destination backed by `MenuStack`. Extending that existing stack to include the settings destination keeps the change narrow and avoids adding a parallel navigator or drawer concept for one utility-screen move.

**Alternatives considered**:

- Introduce a new drawer or modal-based menu: rejected because the feature only needs a destination reorganization, not a new navigation pattern.
- Route Settings directly from the menu screen through a root-stack jump without adding it to the menu stack: rejected because it weakens the menu stack as the source of truth for menu-owned destinations.

## Decision: Move My CV into the authenticated home shortcut grid by replacing the current settings shortcut there

**Rationale**: `src/screens/HomeScreen.tsx` already contains an authenticated shortcut grid with account, settings, notifications, courses, registration requests, and certificate verification actions. Replacing the home-page settings shortcut with a My CV shortcut keeps the home shortcuts cohesive and gives authenticated users a clear in-app entry point without keeping a dedicated tab for one authenticated feature.

**Alternatives considered**:

- Add My CV to the home page without removing any existing shortcut: rejected because the current grid already contains enough items to make layout pressure noticeable.
- Keep My CV in both the bottom tab bar and the home page: rejected because the feature explicitly aims to remove it from the bottom navigation.

## Decision: Make the menu screen scroll vertically instead of trying to compress or hide rows

**Rationale**: The menu screen already holds a header card plus multiple utility rows, and adding Settings increases the chance of clipping on smaller-height devices. A vertical scroll container preserves all actions, is reversible, and fits the current screen structure better than reducing padding or hiding lower-priority actions.

**Alternatives considered**:

- Reduce row spacing or typography until the menu fits: rejected because it only delays the same problem and makes the menu less readable.
- Split the menu into multiple screens or collapsible sections: rejected because the feature does not require a broader information architecture redesign.

## Decision: Preserve the existing CV and Settings screens as destinations without changing their internal behavior

**Rationale**: The requested change is about where users enter these screens, not about redesigning the screens themselves. Reusing the existing destinations keeps the increment small and lowers regression risk.

**Alternatives considered**:

- Create a separate menu-specific settings screen: rejected because it duplicates the existing settings destination with no added user value.
- Create a new home-specific CV wrapper route: rejected because the existing CV screen already handles the required authenticated CV flow.
