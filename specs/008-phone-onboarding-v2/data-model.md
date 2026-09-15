# Data Model: Phone-First Onboarding V2

## Onboarding flow state (memory only)

| Field | Type | Rules |
|---|---|---|
| `step` | `phone \| otp \| complete` | Server-driven after the informational trainee-choice screen; guarded screens reset to the flow start when prerequisites are absent. |
| `countryCode` | `string` | Digits only; submitted separately. |
| `mobile` | `string` | National or international input; no legacy lookup before verification. |
| `startAttempt` | `StartAttempt \| null` | Retained for manual transient retry; replaced by a fresh gesture. |
| `sessionToken` | `string \| null` | Server token; memory only, never logged or placed in navigation state. |
| `expiresAt` | `number \| null` | Epoch milliseconds derived from `expires_in`. |
| `resendAt` | `number \| null` | Epoch milliseconds derived from `resend_after`. |
| `verifyDisabledUntil` | `number \| null` | Retry deadline when supplied. |
| `nextAction` | `complete_registration \| null` | Set only after successful OTP verification. |
| `completionStatus` | `idle \| submitting \| retryable` | Prevents duplicate completion and supports manual retry. |
| `error` | `OnboardingErrorState \| null` | Redacted safe code/message/metadata only. |

### StartAttempt

| Field | Type | Rules |
|---|---|---|
| `idempotencyKey` | `string` | New per fresh gesture; reused only by manual retry of that gesture. |
| `payload` | `{country_code: string, mobile: string}` | Immutable within an attempt. |
| `status` | `idle \| submitting \| retryable \| rate_limited` | Prevents double submission and retry loops. |
| `retryAt` | `number \| null` | Derived from `retry_after`. |

Transitions:

- Start success: `phone → otp`, setting session/deadlines.
- Resend success: remain on `otp`, replacing session/deadlines.
- Verify success: `otp → complete`.
- Invalid session: clear session and return to `phone`.
- Completion success: securely install token, refresh Bootstrap, then destroy flow state.

## Informational trainee choice

The `new trainee | previous trainee` selection exists only in the route-local UI. It is not stored in onboarding state, does not alter routing, and is never included in Start, Verify, or Complete requests.

The password is held only by the completion screen while visible, must contain at least eight characters, and is never persisted or placed in navigation state.

## Successful session response

| Field | Type | Rules |
|---|---|---|
| `message` | `string` | Neutral reachability wording only. |
| `session_token` | `string` | Memory only. |
| `expires_in` | `number` | Non-negative seconds. |
| `resend_after` | `number` | Non-negative seconds. |

## Completion result

| Field | Type | Rules |
|---|---|---|
| `access_token` | `string` | Securely stored before authentication state is exposed. |
| `user_id` | `number` | Optional legacy enrichment; full User is not required. |
| `profile_id` | `number` | Push registration identity until Bootstrap confirms profile. |
| `student_id` | `number \| null` | Matched durable training identity, or null when there is no safe match. |
| `link_status` | `linked \| unlinked` | Authenticated status; history arrays remain empty unless linked. |

## Secure credential record

| Field | Value | Rules |
|---|---|---|
| Service | `com.tanamitrain.auth.access-token.v2` | Fixed namespace. |
| Username | `access_token` | Fixed non-secret identifier. |
| Password/value | bearer token | OS-protected; never copied to AsyncStorage. |

Migration: `legacy plaintext → confirmed secure write → plaintext removed → secure only`. Failed secure writes retain the legacy source for retry but do not authenticate the current process.

## Authenticated Bootstrap snapshot

```text
OnboardingBootstrap
├── ok: true
├── link_status: linked | unlinked
├── profile: BootstrapProfile | null
├── courses
│   ├── upcoming: CourseItem[]
│   ├── current: CourseItem[]
│   └── previous: CourseItem[]
├── certificates: HistoricalCertificateItem[]
├── registration_requests: RegistrationRequestItem[]
├── history_link_request: HistoryLinkRequest | null
└── cache
    ├── version: number
    └── strategy: replace
```

### BootstrapProfile

| Field | Type | Meaning |
|---|---|---|
| `id` | `number` | Profile and push identity. |
| `student_id` | `number \| null` | Durable training-history identity. |
| `fullname_ar` | `string \| null` | Arabic display name. |
| `fullname_en` | `string \| null` | English display name. |
| `mobile` | `string \| null` | Verified login phone, never a copied legacy phone. |
| `email` | `string \| null` | Profile email. |
| `date_of_birth` | `YYYY-MM-DD \| null` | Date-only value. |

`HistoryLinkRequest` is server-owned, display-only forward-compatible data; `link_status` is authoritative.

### Snapshot invariants

- Every success replaces the complete in-memory and persisted snapshot.
- Arrays never merge; empty arrays clear prior values.
- When `link_status !== linked`, selectors return empty history arrays.
- Changed `cache.version` invalidates derived views.
- Older overlapping responses cannot replace a newer request result.
- Logout, 401, or account change clears the snapshot.

## API error state

| Field | Type | Meaning |
|---|---|---|
| `code` | `string` | Server error identifier. |
| `status` | `number` | HTTP status. |
| `retryAfter` | `number \| null` | Seconds until retry is allowed. |
| `attemptsRemaining` | `number \| null` | Optional invalid-code feedback. |
| `retryable` | `boolean` | True only for manual network/5xx retry paths. |

Errors contain no credential or verification secret.
