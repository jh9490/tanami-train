# Tasks: Phone-First Onboarding V2

**Input**: Design documents from `/specs/008-phone-onboarding-v2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because the specification defines independent acceptance testing and the plan requires API, reducer, storage, navigation, lifecycle, and regression coverage.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the native secure-storage dependency and shared feature configuration.

- [ ] T001 Install exact-pinned `react-native-keychain@10.0.0`, update package-lock.json and iOS/Podfile.lock, and add the Jest native mock configuration in package.json, package-lock.json, ios/Podfile.lock, and jest.config.js
- [ ] T002 [P] Add the onboarding rollout gate and canonical history-link event constant in src/constants/onboarding.ts
- [ ] T003 [P] Add onboarding, completion, Bootstrap, and safe API error models in src/types/api.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create secure session, persistence, API, reducer, and provider foundations used by all stories.

- [ ] T004 Write secure token migration and clearing tests in __tests__/accessTokenStorage.test.ts
- [ ] T005 Implement Keychain/Keystore access-token storage and one-way AsyncStorage migration in src/storage/accessTokenStorage.ts
- [ ] T006 [P] Write whole-snapshot replacement, clearing, and pending-refresh marker tests in __tests__/onboardingBootstrap.test.tsx
- [ ] T007 [P] Implement non-secret Bootstrap snapshot and pending-refresh storage in src/storage/bootstrapStorage.ts
- [ ] T008 [P] Write exact URL/header/error-metadata/redaction contract tests in __tests__/onboardingApi.test.ts
- [ ] T009 Implement root-relative Start, Resend, Verify, Complete, and Bootstrap calls with safe diagnostics in src/services/onboardingApi.ts
- [ ] T010 [P] Write state transition, idempotency retry, countdown, and secret-clearing tests in __tests__/onboardingReducer.test.ts
- [ ] T011 [P] Implement the memory-only onboarding reducer and selectors in src/auth/onboardingReducer.ts
- [ ] T012 [P] Add bilingual v2 error/copy mapping in src/auth/onboardingErrors.ts
- [ ] T013 [P] Add per-gesture idempotency key generation in src/util/idempotencyKey.ts
- [ ] T014 Refactor src/context/AuthContext.tsx to use secure token storage, token-authoritative authentication, atomic Bootstrap replacement, stale-response protection, and centralized 401 clearing while retaining legacy actions
- [ ] T015 Remove the nested AuthProvider from src/navigation/AppNavigator.tsx so index.js, App.tsx, notifications, and screens share one context

**Checkpoint**: Secure storage, onboarding transport/state, and one authenticated context are ready.

---

## Phase 3: User Story 1 — Verify a phone privately (Priority: P1) 🎯 MVP

**Goal**: Show an informational trainee choice, then start a neutral OTP session and enforce server deadlines/attempts.

**Independent Test**: Both trainee choices lead to the same phone flow without an API call; new/existing phones receive identical acknowledgement; Start retry reuses its key; OTP countdowns survive suspension; all verify errors remain safe.

- [ ] T016 [P] [US1] Write Phone Entry and OTP component tests with fake timers and accessibility assertions in __tests__/onboardingScreens.test.tsx
- [ ] T017 [P] [US1] Write v2 route guards and feature-gated signup navigation tests in __tests__/onboardingNavigation.test.tsx
- [ ] T018 [US1] Implement route-scoped flow ownership in src/screens/onboarding/OnboardingFlowProvider.tsx
- [ ] T019 [US1] Implement neutral phone entry, idempotent manual retry, and rate-limit behavior in src/screens/onboarding/PhoneEntryScreen.tsx
- [ ] T020 [US1] Implement six-digit OTP verification, absolute expiry/resend countdowns, attempts feedback, and AppState recovery in src/screens/onboarding/OtpVerificationScreen.tsx
- [x] T021 [US1] Add the UI-only trainee choice, guarded v2 routes, and feature-gated signup entry while retaining legacy routes in src/screens/onboarding/TraineeTypeScreen.tsx, src/navigation/AppNavigator.tsx, src/screens/auth/SignUpScreen.tsx, src/screens/auth/SignInScreen.tsx, and src/screens/HomeScreen.tsx

**Checkpoint**: The privacy-preserving phone verification journey works independently.

---

## Phase 4: User Story 2 — Complete registration simply (Priority: P1)

**Goal**: Complete registration with only a password and establish a secure authenticated session.

**Independent Test**: Verify returns only `complete_registration`; Complete sends exactly session token and password; linked and unlinked successes install the returned token.

- [x] T022 [P] [US2] Add UI-only trainee-choice and password-only completion tests in __tests__/onboardingScreens.test.tsx
- [x] T023 [US2] Implement password-only completion and idempotent manual retry in src/screens/onboarding/AccountCompletionScreen.tsx
- [x] T024 [P] [US2] Remove obsolete link-status/history-intent/support branches from onboarding state, routes, and request models
- [x] T025 [US2] Integrate secure completion/session installation and initial Bootstrap refresh in src/screens/onboarding/OnboardingFlowProvider.tsx and src/context/AuthContext.tsx

**Checkpoint**: The simplified verified session reaches a secure linked or unlinked authenticated outcome.

---

## Phase 5: User Story 3 — Authoritative account history (Priority: P2)

**Goal**: Make one atomically replaced Bootstrap snapshot feed all profile/history screens and lifecycle refreshes.

**Independent Test**: Linked/unlinked snapshots, empty arrays, same/new versions, overlapping requests, foreground, pull-to-refresh, completion, and history-link notifications all produce authoritative current screens.

- [ ] T026 [P] [US3] Extend Bootstrap context tests for 401, overlapping refreshes, selectors, and lifecycle triggers in __tests__/onboardingBootstrap.test.tsx
- [ ] T027 [US3] Convert My Courses to grouped Bootstrap selectors and shared refresh in src/screens/MyCoursesScreen.tsx
- [ ] T028 [P] [US3] Convert certificates to Bootstrap selectors and shared refresh in src/screens/MyCertificatesScreen.tsx
- [ ] T029 [P] [US3] Convert pending registration requests to Bootstrap selectors and shared refresh in src/screens/MyRegistrationRequests.tsx
- [ ] T030 [US3] Use Bootstrap identity in Account/Home while preserving detailed legacy profile editing and public feeds in src/screens/AccountScreen.tsx and src/screens/HomeScreen.tsx
- [ ] T031 [US3] Expose foreground/open notification data and pending background refresh handling in src/services/notifications.ts, App.tsx, and index.js

**Checkpoint**: Profile/history views agree on one replacement snapshot and refresh at all required triggers.

---

## Phase 6: User Story 4 — Safe legacy rollout (Priority: P3)

**Goal**: Preserve valid existing sessions, guest access, and every legacy flow while v2 is enabled only at signup entry.

**Independent Test**: Feature on/off, fresh install, upgraded valid token, invalid token, guest usage, legacy signup/login/reset, and public/authenticated screens all follow the rollout matrix.

- [ ] T032 [P] [US4] Add feature-gate, upgraded-token, invalid-token, and single-provider regression tests in __tests__/onboardingNavigation.test.tsx and __tests__/App.test.tsx
- [ ] T033 [US4] Finalize boot migration, valid-session bypass, v2/legacy entry selection, and 401 routing behavior in src/context/AuthContext.tsx and src/navigation/AppNavigator.tsx
- [ ] T034 [US4] Preserve legacy API regression coverage and remove secret-bearing auth logs in src/services/api.ts and __tests__/apiSync.test.ts

**Checkpoint**: V2 can be enabled or disabled without removing established behavior.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate security, accessibility, native integration, regression safety, and documentation.

- [ ] T035 [P] Audit Arabic RTL, English copy, numeric LTR fields, screen-reader labels/live regions, disabled states, and touch targets across src/screens/onboarding/
- [ ] T036 [P] Update system_context.md and AGENTS.md only if the implemented structure differs materially from the plan
- [ ] T037 Run focused Jest suites, complete `npm test`, TypeScript compile, ESLint, and fix regressions across src/ and __tests__/
- [ ] T038 Execute and record available Android/iOS manual checks from specs/008-phone-onboarding-v2/quickstart.md, explicitly identifying any device-only checks not run

---

## Dependencies & Execution Order

- Setup tasks T001-T003 start immediately; T002 and T003 can run in parallel with dependency installation.
- Foundational tasks depend on Setup. Tests T004/T006/T008/T010 precede their implementations; T014 depends on T005, T007, and T009; T015 follows T014.
- US1 depends on the foundation and is the MVP.
- US2 depends on the verified flow from US1.
- US3 depends on Bootstrap/session foundations and can proceed after US2 establishes completion integration.
- US4 depends on the completed v2 and Bootstrap paths so it can validate both sides of rollout.
- Polish depends on all selected stories.

## Parallel Opportunities

- T002 and T003 can run independently.
- T006/T007, T008, T010/T011, T012, and T013 affect separate files after secure-storage setup.
- US1 screen and navigation tests can be drafted in parallel.
- US2 request-model cleanup can be implemented independently of completion-screen styling.
- US3 certificates and registration adapters can proceed in parallel after context selectors exist.
- Accessibility audit and context-document review can proceed in parallel before final validation.

## Implementation Strategy

1. Complete secure/API/state foundations and prove migration/redaction behavior.
2. Deliver US1 as the smallest privacy-preserving OTP MVP.
3. Add US2 password-only completion and secure session establishment.
4. Move history consumers to Bootstrap for US3.
5. Validate v2/legacy rollout matrix for US4.
6. Run automated validation, then complete available native/manual checks.

## Notes

- Admin link-preview/confirm operations are external and must not be implemented in the mobile app.
- Never persist or log OTP, password, onboarding session token, access token, or Authorization.
- Mark each task `[x]` only after its implementation and relevant validation succeed.
