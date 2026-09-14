# Research: Phone-First Onboarding V2

## Decision: Use an isolated onboarding service at the API root

**Rationale**: Existing mobile methods are rooted at `/api/mobile-app`, while the new contract uses `/api/onboarding`. A focused client can share safe error conventions without risking legacy path regressions. Start alone adds an idempotency header; Bootstrap adds bearer authentication.

**Alternatives considered**:

- Change the existing global base: rejected because it breaks legacy methods.
- Hard-code URLs in screens: rejected because it duplicates networking, errors, and redaction.

## Decision: Keep onboarding secrets in a route-scoped memory reducer

**Rationale**: OTPs, passwords, and session tokens need not survive process death. A provider mounted around onboarding screens keeps state consistent without navigation params or persistence. Restored screens missing prerequisites reset safely to Phone Entry.

**Alternatives considered**:

- Persist the flow: rejected because the session is short-lived and secrets must not persist.
- Put secrets in navigation params: rejected because navigation state may be inspected or persisted.
- Put transient state in AuthContext: rejected because it extends secret lifetime beyond the isolated flow.

## Decision: Derive countdowns from absolute deadlines

**Rationale**: Compute `expiresAt` and `resendAt` from server seconds and derive remaining time from the current clock. Recalculate on foreground so mobile timer suspension cannot extend validity. Resend remains user-triggered.

**Alternatives considered**:

- Decrement counters: rejected because timers pause in background.
- Auto-resend at zero: rejected because the contract forbids retry loops.

## Decision: Use exact-pinned react-native-keychain

**Rationale**: This bare React Native app has no secure credential library. `react-native-keychain` supplies iOS Keychain and Android Keystore and supports the app's Android API 24 minimum. Pin `10.0.0`; use service `com.tanamitrain.auth.access-token.v2`, username `access_token`, iOS `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, and Android AES-GCM without biometric prompts. Validate process recreation before release. Official references: [documentation](https://oblador.github.io/react-native-keychain/docs/), [platform storage behavior](https://oblador.github.io/react-native-keychain/docs/platform-value-storage/), and [releases](https://github.com/oblador/react-native-keychain/releases).

**Alternatives considered**:

- AsyncStorage plus app-held encryption: not OS-protected.
- Expo SecureStore: unnecessary Expo Modules overhead.
- Custom Swift/Kotlin bridge: added security and maintenance risk.
- Biometric access: incompatible with silent bootstrap refresh.

## Decision: Migrate plaintext tokens secure-first and once

**Rationale**: Read Keychain first. If absent, read legacy `authToken`, write securely, confirm success, then remove plaintext. Never delete before success or dual-write new tokens. A failed secure write does not establish an authenticated session and leaves the legacy value for a later migration attempt. Logout/401 clear both stores.

**Alternatives considered**:

- Log out upgraded users: conflicts with migration requirements.
- Keep both copies for rollback: preserves the plaintext vulnerability.

## Decision: Authentication is token-authoritative; Bootstrap is history-authoritative

**Rationale**: Completion returns a token and numeric IDs, not a legacy User object. `isAuthenticated` derives from a successfully installed token. Bootstrap supplies profile and history. The optional legacy User can still be populated by legacy login/Me but no longer gates authentication.

**Alternatives considered**:

- Synthesize a full legacy User: the contract lacks required fields.
- Require Me after completion: unnecessary for a valid v2 session.

## Decision: Replace one whole Bootstrap snapshot

**Rationale**: Current refresh performs four legacy requests but discards three results, while history screens own separate arrays. AuthContext will atomically replace one `OnboardingBootstrap`, expose selectors, accept authoritative empty arrays, and use request sequencing to prevent stale overlapping responses. Version is exposed for derived memo keys.

**Alternatives considered**:

- Merge arrays: prohibited by the contract.
- Keep screen-owned requests: permits stale contradictory history.
- Add Redux/Zustand: unnecessary parallel architecture.

## Decision: Preserve detailed legacy profile editing as a supplement

**Rationale**: Bootstrap omits title/address/approval fields used by Account and CV. Bootstrap remains authoritative for identity/link state; Account may fetch legacy detail when opened and refresh Bootstrap after update. Supplemental fields never merge into the cached Bootstrap object.

**Alternatives considered**:

- Assume omitted fields exist: unsupported by the supplied contract.
- Remove current fields: violates legacy compatibility.

## Decision: Gate signup entry, not guest access

**Rationale**: The app deliberately supports guest Home/courses/gallery. Eligible signup actions route to an informational trainee-type choice and then the shared Phone Entry, while Sign In, Reset Password, guest access, and legacy routes remain. The choice is never stored or sent. A valid stored token bootstraps directly. The release containing the enabled local flag provides app-version gating.

**Alternatives considered**:

- Force onboarding at every unauthenticated launch: unrequested removal of guest behavior.
- Delete legacy routes: violates staged rollout.

## Decision: Use a canonical history-link notification event

**Rationale**: Handle `event=history_link_status_changed`. Foreground receipt/open refresh immediately; background/quit sets a boolean pending marker for boot/foreground. Required foreground refresh remains a fallback for missed/older messages.

**Alternatives considered**:

- Refresh on every push: unnecessary traffic.
- Call React state from a headless handler: no provider is mounted.

## Decision: Treat Postman admin operations as external dependencies

**Rationale**: `/mobile-app/link-preview` and `/mobile-app/confirm-history-link` require an admin session and perform review/linking. The user app only observes results through Bootstrap and notifications.

**Alternatives considered**:

- Add mobile admin controls: no mobile authorization or UI requirement exists.

## Decision: Redact secrets at the networking boundary

**Rationale**: Current debug logging prints bodies. Onboarding diagnostics must omit or replace `code`, `password`, `session_token`, `access_token`, and Authorization, recording only method/path/status/safe code.

**Alternatives considered**:

- Depend on disabling a debug constant: secrets could still leak in development or misconfigured builds.
