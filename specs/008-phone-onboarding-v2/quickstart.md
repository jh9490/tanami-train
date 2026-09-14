# Quickstart: Phone-First Onboarding V2

## Prerequisites

- Use branch `008-phone-onboarding-v2` and the invitation-free Postman collection supplied on 2026-09-12.
- Keep the existing Tanami API base and every legacy endpoint.
- Install the exact secure-storage dependency and iOS pods before native builds.
- Prepare linked and unlinked completion responses.
- Prepare linked/unlinked Bootstrap responses, changed versions, and authoritative empty arrays.
- Make device logs available for secret-redaction checks.

## Automated validation

```sh
npm test -- accessTokenStorage
npm test -- onboardingApi
npm test -- onboardingReducer
npm test -- onboardingNavigation
npm test -- onboardingScreens
npm test -- onboardingBootstrap
npm test
npm run lint
```

Cover exact URLs/headers, all documented error metadata, neutral Start copy, log redaction, snapshot replacement, empty arrays, 401 invalidation, and legacy API regression.

## Phone and OTP validation

1. Enable v2 and open signup from a fresh unauthenticated install; the trainee-choice screen opens while guest Home remains usable.
2. Select new trainee and previous trainee separately; both open the same Phone Entry and neither selection causes an API request.
3. Start with new, existing, matched, and unmatched identities; acknowledgement text remains identical.
4. Double-tap Submit; only one in-flight request occurs.
5. Simulate network/503, manually retry unchanged input, and verify the same idempotency key. A fresh gesture uses a different key.
6. OTP accepts six digits, shows expiry/resend countdowns, and does not enable Resend early.
7. Background during countdown and return; time reflects the absolute deadline.
8. Exercise invalid/expired/missing sessions, remaining attempts, too many attempts, and rate limiting; no automatic retry occurs.
9. Inspect AsyncStorage, navigation state, console/device logs, and crash output; no OTP, password, session token, access token, or Authorization value appears.

## Completion

1. Verify success contains `next_action=complete_registration` and no link status.
2. Enter a password of at least eight characters; Complete sends only `session_token` and `password`.
3. Confirm linked success includes `student_id`; unlinked success includes `student_id=null`.
4. Exercise weak-password, verification-required, and transient failure behavior; password remains on transient failure and retry is manual.
5. Repeat equivalent consumed-session completion; no duplicate account/profile appears.

## Bootstrap and lifecycle

1. Complete onboarding; secure token installation precedes authenticated UI and one Bootstrap refresh follows.
2. Profile, grouped courses, certificates, and pending registrations render from the same snapshot.
3. Replace populated data with empty arrays at the same and changed version; old items disappear in both cases and version-derived views invalidate.
4. Foreground, pull to refresh, legacy sign-in, and v2 completion each refresh Bootstrap once.
5. Deliver `event=history_link_status_changed` foreground, opened, background, and quit; refresh immediately or from the pending marker.
6. Unrelated notification does not trigger special refresh.
7. A `401` clears secure and legacy token keys, profile id, and Bootstrap, then routes future auth entry according to the v2 gate.
8. `profile.mobile` remains the verified phone; history lookups use `profile.student_id`.

## Android API 24+ native validation

1. Install the previous app, sign in to create AsyncStorage `authToken`, then upgrade without clearing data.
2. Launch; confirm secure migration and plaintext deletion only after secure-write success.
3. Relaunch, reboot, background/restore, and force process recreation; token remains available without prompts.
4. Exercise logout, server 401, app-data clear, uninstall/reinstall, and migration write failure.
5. Stress process/activity recreation for Keychain v10 DataStore issues; if reproduced, halt release and vet the documented 9.2.3 fallback rather than floating versions.

## iOS 15.1+ native validation

1. Repeat upgrade, relaunch, reboot, background/restore, logout, 401, and failed migration scenarios on simulator and device.
2. Confirm no biometric prompt and access only while device is unlocked.
3. Validate and document uninstall/reinstall behavior because Keychain may outlive the app container.

## Rollout regression

1. Disable v2; legacy SignUp/OTP routes and methods remain usable.
2. Enable v2; signup CTAs route to trainee choice while Sign In, Reset Password, and guest access remain.
3. Upgrade with a valid token; the user is not forced through onboarding.
4. Public Home/course/gallery and authenticated Account/CV flows still work.
5. App and screens observe the same AuthContext after nested-provider removal.

## Validation record — 2026-09-13

- Passed all 14 Jest suites (104 tests), including the v2 phone picker, onboarding API, reducer, screens, secure storage, Bootstrap storage, rollout routing, and legacy regressions.
- Passed `npx tsc --noEmit` and changed-file ESLint with no errors.
- Passed Android `assembleDebug`, including native autolinking and compilation of `react-native-keychain` 10.0.0.
- Completed iOS CocoaPods integration; `Podfile.lock` resolves RNKeychain 10.0.0.
- Repo-wide ESLint still reports pre-existing CV/certificate errors outside this feature; no new onboarding lint errors remain.
- Device-only OTP delivery, lifecycle, notification delivery, OS secure-storage inspection, upgrade migration, reinstall behavior, and all backend identity fixtures were not run because no configured device/backend fixtures were available in this workspace session.
- Revalidated the simplified trainee-choice and password-only contract: all 14 suites (104 tests), TypeScript, and changed-file ESLint pass; Complete request tests assert that no choice, history, or profile fields are sent.
