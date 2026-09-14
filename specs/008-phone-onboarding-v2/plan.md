# Implementation Plan: Phone-First Onboarding V2

**Branch**: `[008-phone-onboarding-v2]` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification and invitation-free Postman collection supplied on 2026-09-12.

## Summary

Add a feature-gated phone-first onboarding flow that begins with an informational new/previous-trainee choice, starts a privacy-neutral OTP session, enforces server countdown and attempt metadata, completes registration using only a password, and installs the returned access token securely. Extend the existing API and authentication context rather than adding a parallel layer. One authenticated bootstrap response becomes the atomically replaced source for profile and history screens, while legacy endpoints and guest access remain available during rollout.

The implementation also removes the nested duplicate `AuthProvider`, redacts authentication secrets from diagnostics, migrates plaintext tokens from AsyncStorage to OS-protected storage, and connects history-link notifications to bootstrap refresh. The Postman collection's administrator preview/confirm operations are external dependencies and will not be called by the mobile app.

## Technical Context

**Language/Version**: TypeScript 5.0.x, React 19.1, React Native 0.80; Android Kotlin 2.1 project and iOS 15.1+ project  
**Primary Dependencies**: React Navigation 7, React Context, native `fetch`, Firebase Messaging, Notifee, AsyncStorage 2.2; add exact-pinned `react-native-keychain` 10.0.0  
**Storage**: iOS Keychain/Android Keystore for access token; AsyncStorage only for non-secret bootstrap snapshot, profile id, refresh-pending marker, and one-time legacy-token migration source; OTP, password, and onboarding session remain memory-only  
**Testing**: Jest 29, React Test Renderer 19, mocked native storage/messaging, fake timers, API contract and reducer tests; Android emulator/device and iOS simulator/device smoke tests  
**Target Platform**: Android API 24+ and iOS 15.1+  
**Project Type**: Existing bare React Native mobile application consuming the Tanami API  
**Performance Goals**: One bootstrap request per refresh trigger; immediate local validation; correct countdown recovery after suspension  
**Constraints**: No account-existence leakage; no persisted OTP/password/session token; no secrets in logs; no automatic retry loops; bootstrap snapshots replace rather than merge; existing guest and legacy flows remain callable  
**Scale/Scope**: Four onboarding screens, one route-scoped flow owner, five mobile endpoints, three history screens migrated to shared bootstrap state, one secure-token adapter, and lifecycle/notification integration; admin history-link UI is out of scope

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

- **I. Spec Before Implementation — PASS**: The feature spec and completed checklist exist; plan precedes tasks and code.
- **II. Existing Architecture First — PASS**: Work extends existing context, navigation, screens, services, storage, types, and utilities; no new state/networking architecture.
- **III. Authenticated, Arabic-First UX — PASS**: The single existing auth context remains authoritative; screens reuse Tanami styling, Arabic-first RTL, bilingual copy, and LTR numeric fields.
- **IV. Native Reliability — PASS**: Keychain/Keystore validation covers Android and iOS installation, upgrade, restart, logout, invalidation, and process recreation.
- **V. Small, Reversible Increments — PASS**: Storage/API foundations, onboarding, bootstrap consumers, and rollout integration remain independently testable; legacy paths stay available.
- **Current feature pointer — PASS**: `.specify/feature.json` points to `specs/008-phone-onboarding-v2`.
- **Ambiguity gate — PASS**: Research resolves storage, routing, API base, bootstrap ownership, cache semantics, and notifications; no clarification markers remain.

### Post-design re-check

All gates remain passed. The only new native dependency is required for OS-secure storage. The nested provider correction is necessary for consistent existing authentication and notification state, not a parallel architecture.

## Project Structure

### Documentation (this feature)

```text
specs/008-phone-onboarding-v2/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── onboarding-api.md
├── checklists/
│   └── requirements.md
└── tasks.md                 # created by /speckit.tasks
```

### Source Code (repository root)

```text
App.tsx
index.js
src/
├── auth/
│   ├── otp.ts                        # retained legacy mapping
│   ├── onboardingErrors.ts           # v2 error/copy mapping
│   └── onboardingReducer.ts          # memory-only state machine
├── constants/
│   └── onboarding.ts                 # release gate/notification event
├── context/
│   └── AuthContext.tsx               # single session/bootstrap authority
├── navigation/
│   └── AppNavigator.tsx              # v2 routes; remove nested provider
├── screens/
│   ├── auth/                          # legacy routes remain
│   ├── onboarding/
│   │   ├── OnboardingFlowProvider.tsx
│   │   ├── TraineeTypeScreen.tsx
│   │   ├── PhoneEntryScreen.tsx
│   │   ├── OtpVerificationScreen.tsx
│   │   └── AccountCompletionScreen.tsx
│   ├── MyCoursesScreen.tsx
│   ├── MyCertificatesScreen.tsx
│   ├── MyRegistrationRequests.tsx
│   ├── AccountScreen.tsx
│   └── HomeScreen.tsx
├── services/
│   ├── api.ts                         # legacy surface retained
│   └── onboardingApi.ts               # root-relative v2 client
├── storage/
│   ├── accessTokenStorage.ts           # secure storage + migration
│   ├── authStorage.ts                  # non-secret profile id
│   └── bootstrapStorage.ts             # whole snapshot/pending marker
├── types/
│   └── api.ts                          # onboarding/bootstrap models
└── util/
    └── idempotencyKey.ts

__tests__/
├── accessTokenStorage.test.ts
├── onboardingApi.test.ts
├── onboardingReducer.test.ts
├── onboardingNavigation.test.tsx
├── onboardingScreens.test.tsx
├── onboardingBootstrap.test.tsx
└── apiSync.test.ts
```

**Structure Decision**: Keep the feature inside existing application layers. A small onboarding service separates `/api/onboarding/*` from existing `/api/mobile-app/*`; AuthContext owns Bootstrap because current profile/history consumers already use it. Flow secrets live only in a provider mounted around onboarding routes.

## Design Phases

### Phase A — Secure session and API foundations

1. Add exact-pinned `react-native-keychain@10.0.0`, native install steps, and a Jest mock.
2. Add secure-first token reads, one-way AsyncStorage `authToken` migration, secure writes before plaintext deletion, and defensive clearing of both stores on logout/401.
3. Add typed onboarding models and a root-relative client.
4. Extend safe errors with `retry_after` and `attempts_remaining`; redact code, password, session/access tokens, and Authorization.
5. Add a gesture idempotency-key generator used only for deduplication.

### Phase B — Isolated onboarding journey

1. Mount `OnboardingFlowProvider` only around v2 routes; keep phone, attempt key, session, deadlines, and completion status in memory.
2. Add the UI-only new/previous-trainee choice; both options navigate to Phone Entry without storing or submitting the selection.
3. Implement Phone Entry with a flag/code dropdown beside the mobile field, neutral acknowledgement, a new key per fresh gesture, the same key on manual transient retry, and rate-limit disabling.
4. Implement OTP using absolute deadlines, six ASCII digits, AppState correction, attempt feedback, and manual resend.
5. Implement password-only completion; never send trainee selection or profile/history fields.
6. On success, securely install the token, refresh Bootstrap, register push, clear flow memory, and reset to MainTabs.

### Phase C — Authoritative bootstrap adoption

1. Add atomically replaced Bootstrap state to AuthContext with loading/error/version status and a stale-response guard.
2. Persist/restore one whole snapshot; every success replaces it, including empty arrays. Clear on logout, 401, or account change.
3. Use Bootstrap profile and `student_id` for identity/history. Keep legacy detailed-profile fetch only for Account fields absent from Bootstrap.
4. Convert My Courses, Certificates, and Registration Requests to shared selectors/refresh; preserve public Home feeds and legacy writes.
5. Remove the inner provider in AppNavigator, retaining the root provider from `index.js`.

### Phase D — Rollout, lifecycle, and notifications

1. Add a local release gate. Signup CTAs choose v2 Phone Entry when enabled and legacy SignUp when disabled; guest Home remains available.
2. On boot, migrate/read token and call Bootstrap. Valid sessions bypass onboarding; 401 clears session and future auth entry returns to v2 Phone Entry when enabled.
3. Refresh after legacy sign-in, completion, foreground, pull-to-refresh, registration-changing actions, and history-link notification.
4. Expose foreground/opened notification data. Background/quit history-link messages set a non-secret pending marker consumed at boot/foreground.
5. Retain every legacy authentication, profile, course, certificate, and registration method/route for rollback.

## Complexity Tracking

No constitution violations require exceptions.
