# Data Model: Menu Navigation Reorganization

## Bottom Navigation Destination

**Purpose**: Represent one primary route exposed in the app’s bottom tab bar.

**Fields**:

- `routeName`: Stable tab route identifier such as `Home`, `Courses`, `Gallery`, or `MenuRoot`
- `label`: User-facing tab label shown in Arabic
- `iconName`: Material icon used in the tab bar
- `visibility`: Whether the destination is always visible or conditionally visible by session state

**Validation Rules**:

- `routeName` must map to a registered bottom-tab screen.
- The post-feature tab set must not include `CVGenerator`.
- Menu must remain represented by one bottom navigation destination.

## Home Shortcut Item

**Purpose**: Represent one tappable shortcut rendered in the authenticated section of the home page.

**Fields**:

- `id`: Stable identifier such as `account`, `my-cv`, `notifications`, or `my-courses`
- `label`: User-facing shortcut label
- `iconName`: Icon used in the shortcut card
- `target`: Destination opened when tapped
- `requiresAuth`: Whether the shortcut should be hidden when the user is not authenticated

**Validation Rules**:

- `target` must map to an existing navigator destination.
- `requiresAuth` shortcuts must not render for guests.
- The authenticated home shortcut set must include `My CV` after this feature is applied.

## Menu Utility Entry

**Purpose**: Represent one row inside the menu screen that opens a utility screen or executes a utility action.

**Fields**:

- `id`: Stable identifier such as `verify-certificate`, `contact-us`, `settings`, or `logout`
- `title`: User-facing row label
- `iconName`: Icon displayed alongside the row label
- `kind`: Whether the row navigates, opens an external utility, or performs an in-app action
- `target`: Destination or behavior invoked on press
- `requiresAuth`: Whether the row should appear only for authenticated users

**Validation Rules**:

- Navigation rows must map to a registered menu or root destination.
- The menu entry set must include `Settings` after this feature is applied.
- Auth-only entries must remain hidden for guests.

## Menu Screen Layout State

**Purpose**: Represent the visible state of the menu screen once its content exceeds or fits the current viewport height.

**Fields**:

- `headerVisible`: Whether the top identity card is visible
- `entries`: Ordered list of visible menu rows
- `scrollEnabled`: Whether vertical scrolling is active for the current content height
- `bottomInsetClearance`: Space preserved above the bottom navigation and system insets

**Validation Rules**:

- `entries` must preserve row order across renders for the same session state.
- `scrollEnabled` must allow the user to reach the final row whenever the content exceeds the viewport height.
- `bottomInsetClearance` must keep the final row fully tappable.

## Screen Rendering States

### Guest Navigation

- The user is not authenticated.
- Guest-only home and menu visibility rules apply, and auth-only shortcuts such as My CV remain hidden.

### Authenticated Navigation

- The user is authenticated.
- The home shortcut grid includes My CV and the menu includes Settings plus existing authenticated utilities.

### Menu Fits Viewport

- All visible menu content fits within the current screen height.
- The layout remains stable without clipped rows.

### Menu Requires Scroll

- The visible menu content exceeds the available screen height.
- The user scrolls vertically to reach all rows, including the last item.
