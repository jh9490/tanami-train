# Feature Specification: Phone-First Onboarding V2

**Feature Branch**: `[008-phone-onboarding-v2]`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: User description: "Introduce an isolated phone onboarding flow with an informational trainee-type choice, OTP verification, password-only completion, authenticated bootstrap refresh, replacement caching, and a feature-flagged migration that preserves all legacy flows."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify a phone without revealing account history (Priority: P1)

As a prospective or returning user, I want to verify my phone number with a one-time code, so I can begin onboarding without the app revealing whether my number already belongs to an account.

**Why this priority**: Phone verification is the secure and privacy-preserving entry point for every other onboarding path.

**Independent Test**: Start onboarding with valid new-account and existing-account phone numbers, confirm both receive the same acknowledgement, then enter the issued six-digit code and verify that account-link information appears only after successful verification.

**Acceptance Scenarios**:

1. **Given** a user enters a country code and reachable mobile number, **When** the user submits once, **Then** the app displays the same neutral code-sent acknowledgement regardless of whether an account or training history exists.
2. **Given** the initial request has a temporary network or service failure, **When** the user manually retries without starting a new submission gesture, **Then** the request is treated as the same attempt and the current screen state is preserved.
3. **Given** a verification session is active, **When** the user views the code screen, **Then** the app shows the session expiry and prevents resend until the server-provided countdown ends.
4. **Given** a valid, unexpired six-digit code, **When** the user submits it, **Then** the phone is verified and the app proceeds to password completion without revealing matching details.
5. **Given** an invalid, expired, or over-attempted code, **When** verification fails, **Then** the app communicates the actionable failure, preserves safe screen state, and never stores the submitted code.

---

### User Story 2 - Complete registration simply (Priority: P1)

As a prospective or returning trainee, I want to identify myself for guidance, verify my phone, and set a password, so registration stays simple.

**Why this priority**: Completion turns verification into authenticated access with the minimum required user input.

**Independent Test**: Select either trainee option, confirm both lead to the same phone flow without an API call, then verify and complete using only a valid password. Confirm the request contains no trainee choice or profile/history fields.

**Acceptance Scenarios**:

1. **Given** signup begins, **When** the user selects new trainee or previous trainee, **Then** either selection opens the same phone screen and sends nothing to the API.
2. **Given** a verified phone session, **When** the user enters a password of at least eight characters, **Then** Complete sends only the session token and password.
3. **Given** the server safely matches an existing Student, **When** completion succeeds, **Then** the authenticated result is linked and includes its Student identifier.
4. **Given** the server cannot safely match a Student, **When** completion succeeds, **Then** the authenticated result is unlinked with a null Student identifier.
5. **Given** a previous trainee completes registration but sees no previous courses, **When** they review the informational guidance, **Then** they know to contact support through the established support path.
6. **Given** an already completed verification session is submitted again equivalently, **When** completion is retried, **Then** the same completed account outcome is returned without duplication.

---

### User Story 3 - See authoritative account history after authentication (Priority: P2)

As an authenticated user, I want my profile, courses, certificates, registration requests, and history-link state refreshed together, so every history screen reflects the latest authoritative account state.

**Why this priority**: Onboarding is only useful if the resulting account reliably exposes the correct linked history and reacts when support finishes a pending link.

**Independent Test**: Authenticate users in linked and unlinked states, refresh at every required lifecycle trigger, and confirm the complete local snapshot is replaced—including authoritative empty arrays—and derived screens refresh when its version changes.

**Acceptance Scenarios**:

1. **Given** a user has just signed in or completed onboarding, **When** authenticated home data loads, **Then** the app fetches one authoritative snapshot containing link state, profile, course groups, certificates, registration requests, history-link request, and cache metadata.
2. **Given** the app returns to the foreground or the user pulls to refresh, **When** refresh runs, **Then** the app replaces the previous local snapshot with the complete latest snapshot.
3. **Given** the user receives a history-link notification, **When** the notification is handled, **Then** the app refreshes the authoritative snapshot and invalidates derived screens when its version has changed.
4. **Given** the account is not yet linked, **When** bootstrap data is displayed, **Then** all history collections remain empty and any empty collections received from the server replace previously cached contents.
5. **Given** linked legacy history used a former or differently formatted phone, **When** the profile is displayed, **Then** the verified app/login phone remains unchanged and the durable trainee identifier represents the history relationship.

---

### User Story 4 - Roll out without disrupting legacy users (Priority: P3)

As an existing mobile user, I want the onboarding upgrade to preserve my current session and established app flows, so rollout does not force me through signup again or remove functionality.

**Why this priority**: A safe migration protects current users and permits staged adoption before legacy signup is retired separately.

**Independent Test**: Exercise new-install, feature-disabled, existing-authenticated, and invalid-token scenarios and confirm routing follows the rollout policy while all legacy endpoints and flows remain usable.

**Acceptance Scenarios**:

1. **Given** a new install eligible for onboarding v2, **When** the app starts unauthenticated, **Then** the phone-first flow is used.
2. **Given** an existing authenticated user, **When** the updated app starts, **Then** the current credential is retained and the authoritative account snapshot is refreshed without forcing onboarding.
3. **Given** the rollout flag excludes the installed app version, **When** an unauthenticated user starts signup, **Then** the existing legacy flow remains available.
4. **Given** an authenticated request reports an invalid credential, **When** the app handles the response, **Then** secure credentials are cleared and the user returns to phone entry.

### Edge Cases

- A mobile value may be national or international, while the country code is supplied separately; malformed or unsupported combinations must fail without revealing account existence.
- Repeated taps are separate user gestures and receive separate request identities, while a manual retry after a transient failure reuses the original request identity.
- A resend attempt before the countdown ends must remain disabled; a rate-limited action must remain disabled until the supplied retry interval passes and must not retry in a loop.
- Verification sessions may be missing, expired, consumed, or exhausted; completion must not proceed without successful verification.
- Invalid codes may include a remaining-attempt count, which should be displayed without weakening the neutral pre-verification privacy behavior.
- Passwords shorter than eight characters must produce actionable validation without losing the password field state.
- A network or service failure at any write step preserves screen state and offers a user-triggered retry; automatic retry loops are not allowed.
- A refreshed authoritative snapshot may contain empty course or certificate arrays; those empty arrays must clear stale cached content.
- A history-link push may arrive while the app is backgrounded; the next handled notification or foreground transition must refresh the authoritative snapshot.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a feature- and app-version-controlled phone-first onboarding entry point for eligible unauthenticated users.
- **FR-002**: The phone entry step MUST collect a digits-only country code and a national or international mobile value.
- **FR-003**: Each explicit start submission gesture MUST receive a new request identity, and a manual retry of that same gesture after a transient failure MUST retain its original request identity and outcome.
- **FR-004**: Before verification, every valid start attempt MUST show the same neutral acknowledgement and MUST NOT disclose whether an account or training history exists.
- **FR-005**: The system MUST NOT perform a legacy phone lookup before phone verification succeeds.
- **FR-006**: The verification step MUST use the active session, accept exactly six digits, show the server-provided expiry interval, and prevent resend until the server-provided resend interval ends.
- **FR-007**: The system MUST enforce server-provided verification expiry, attempt limits, resend limits, and rate-limit intervals without automatic retry loops.
- **FR-008**: The app MUST NOT persist one-time verification codes.
- **FR-009**: The onboarding entry MUST first display new-trainee and previous-trainee choices, and both choices MUST lead to the same phone step.
- **FR-010**: The trainee choice MUST remain informational only and MUST NOT be stored in onboarding state, sent to an API, or change matching behavior.
- **FR-011**: After successful verification, the system MUST route to registration completion without receiving or displaying a link-status branch.
- **FR-012**: Registration completion MUST require only a password of at least eight characters in addition to the verified session.
- **FR-013**: Completion MUST NOT submit trainee choice, history intent, matching hints, names, birth date, or email.
- **FR-014**: A linked completion result MUST expose the matched Student identifier, and an unlinked result MUST expose a null Student identifier.
- **FR-015**: Previous trainees MUST be informed that they should use the established support path if prior courses do not appear after registration.
- **FR-016**: The app MUST treat Student matching as a server-owned operation and MUST NOT guess or perform legacy lookups.
- **FR-017**: Completion MUST preserve the password field across transient errors and retry only after an explicit user action.
- **FR-018**: Repeating an equivalent completion for a consumed session MUST return the same account outcome without duplicating the account or profile.
- **FR-019**: The system MUST reject completion when verification is missing and MUST present actionable outcomes for weak password and unexpected completion failure.
- **FR-020**: Successful completion MUST securely retain the issued access credential using operating-system-protected storage.
- **FR-021**: Authenticated requests MUST use the retained access credential, and credential rejection MUST clear secure credentials and return the user to phone entry.
- **FR-022**: The system MUST refresh the complete authenticated account snapshot after sign-in, app foregrounding, successful completion, user-initiated refresh, and a history-link notification.
- **FR-023**: The authenticated account snapshot MUST include link state, profile identity, upcoming/current/previous courses, certificates, registration requests, current history-link request, and cache version/strategy.
- **FR-024**: Until the account link state is linked, all history collections MUST be treated as authoritatively empty.
- **FR-025**: The profile's trainee identifier MUST be treated as the durable training-history identity, while the verified profile phone MUST remain the app/login identity regardless of legacy formatting or former numbers.
- **FR-026**: A replacement snapshot MUST replace the entire prior locally cached snapshot; course and certificate collections MUST NOT be merged, and empty collections MUST clear old values.
- **FR-027**: A changed snapshot version MUST invalidate all screens or views derived from the previous snapshot.
- **FR-028**: For rate-limited actions, the relevant control MUST remain disabled until the supplied retry interval or countdown passes.
- **FR-029**: For transient service or connectivity failures, the app MUST preserve the current screen and safe user input, offer manual retry, and reuse the applicable request identity.
- **FR-030**: Existing authenticated users MUST keep valid credentials during rollout and refresh their authenticated account snapshot without being forced through onboarding.
- **FR-031**: Existing legacy signup, verification, login, profile, course, certificate, and registration flows MUST remain supported during the v2 rollout.
- **FR-032**: Retirement of legacy signup MUST remain outside this feature and require a separate release decision.
- **FR-033**: All user-facing onboarding, validation, countdown, support, and retry states MUST be understandable in Arabic and English and preserve correct RTL presentation.

### Key Entities *(include if feature involves data)*

- **Onboarding Session**: A short-lived, privacy-preserving phone verification journey with a token, expiry interval, resend interval, verification state, attempt limits, and completion outcome.
- **Verified Phone Identity**: The country code and mobile identity proven by OTP; it remains the user's app/login phone even when linked legacy history has a different phone representation.
- **Trainee Type Choice**: A route-local informational choice between new and previous trainee that has no API or matching effect.
- **Account-Link State**: The authenticated Bootstrap classification indicating whether training history is linked or unlinked.
- **Trainee History Identity**: The durable identifier that owns legacy training history independently of the verified login phone.
- **Authenticated Account Snapshot**: The complete replaceable local view of link state, profile, course history, certificates, registrations, link request, and cache metadata.
- **Secure Credential**: The access credential issued after completion or login and retained only in operating-system-protected storage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of pre-verification start outcomes use identical account-neutral acknowledgement language for new, existing, matched, and unmatched phone identities.
- **SC-002**: In acceptance testing, both trainee choices lead to the same registration requests, and 100% of Complete requests contain only session token and password.
- **SC-003**: At least 90% of testers with valid inputs can complete the direct phone onboarding journey in under three minutes, excluding time spent waiting for message delivery.
- **SC-004**: In retry testing, 100% of transient failures preserve the current safe screen state, and retries of the same gesture produce no duplicate onboarding or account outcome.
- **SC-005**: In security testing, zero OTP values are found in persisted app storage, and 100% of issued access credentials are retained only in protected credential storage.
- **SC-006**: In lifecycle testing, 100% of sign-in, completion, foreground, pull-to-refresh, and history-link-notification events refresh the authoritative account snapshot.
- **SC-007**: In cache testing, 100% of replacement snapshots—including snapshots with empty arrays—fully replace stale history data, and every version change refreshes derived views.
- **SC-008**: During rollout validation, 100% of existing users with valid credentials remain signed in, while eligible new installs enter the v2 flow and legacy flows remain available when required.
- **SC-009**: The trainee choice, phone, OTP, password, validation, countdown, and retry screens pass Arabic RTL and English accessibility review without clipped or directionally incorrect critical content.

## Assumptions

- The existing Tanami service remains the source of truth for verification, account identity, history linking, and authenticated account snapshots.
- The server supplies authoritative expiry, resend, remaining-attempt, retry, link-state, and cache metadata where applicable.
- The existing app-version and feature-flag mechanism determines v2 eligibility; defining server-side rollout percentages or administrative flag management is outside this feature.
- Push/notification delivery already exists; this feature consumes a history-link notification as a refresh trigger rather than introducing a new notification platform.
- Backend account creation, matching, and legacy endpoint preservation are delivered by the mobile-team contract and are not redesigned by this mobile feature.
