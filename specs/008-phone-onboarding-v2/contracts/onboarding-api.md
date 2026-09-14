# Mobile Contract: Phone Onboarding V2

**Base**: existing Tanami API root (`https://admin.tanamitrain.com` in Postman)  
**Writes**: `Content-Type: application/json`  
**Authenticated**: `Authorization: Bearer <access_token>`  
**Redaction**: never log `code`, `password`, `session_token`, `access_token`, or Authorization values.

## POST `/api/onboarding/start`

Headers:

```http
Content-Type: application/json
Idempotency-Key: <new per fresh submit gesture>
```

Body:

```json
{"country_code":"963","mobile":"0912345678"}
```

Success `200`:

```json
{"ok":true,"message":"If the phone can receive messages, a verification code has been sent.","session_token":"opaque","expires_in":300,"resend_after":20}
```

| Status | Code | Client behavior |
|---|---|---|
| 422 | `invalid_phone` | Keep Phone Entry; reveal no account information. |
| 429 | `rate_limited` | Disable until `retry_after`; never auto-retry. |
| 503 | `temporarily_unavailable` | Preserve payload/key; manual retry uses the same key. |
| network/5xx | safe transport/server code | Preserve payload/key; manual retry uses the same key. |

Equivalent reuse of a key returns the same session. A new deliberate submission gets a new key.

## POST `/api/onboarding/resend`

```json
{"session_token":"opaque"}
```

Success `200` uses the Start session response shape. Replace in-memory token/deadlines. Errors include `invalid_session` (`404`) and `rate_limited`/`too_many_attempts` (`429`). Never call before `resend_after` reaches zero or loop retries.

## POST `/api/onboarding/verify`

```json
{"session_token":"opaque","code":"123456"}
```

Success `200`:

```json
{"ok":true,"verified":true,"session_token":"opaque","next_action":"complete_registration"}
```

| Status | Code | Optional metadata | Client behavior |
|---|---|---|---|
| 404 | `invalid_session` | — | Clear session and restart. |
| 422 | `invalid_code` | `attempts_remaining` | Stay, clear OTP input, display attempts. |
| 410 | `expired_code` | — | Disable verify; offer allowed restart/resend. |
| 429 | `too_many_attempts` | `retry_after` | Disable until deadline or restart. |

## POST `/api/onboarding/complete`

Completion includes only the verified session and a password of at least eight characters. The preceding new/previous-trainee choice is informational UI only and is never submitted.

```json
{"session_token":"opaque","password":"a-strong-password"}
```

Matched Student success `200`:

```json
{"ok":true,"access_token":"bearer-token","user_id":123,"profile_id":456,"student_id":77,"link_status":"linked"}
```

No safe Student match success `200`:

```json
{"ok":true,"access_token":"bearer-token","user_id":123,"profile_id":456,"student_id":null,"link_status":"unlinked"}
```

Completion status: `linked | unlinked`. Equivalent completion of a consumed session is idempotent.

| Status | Code | Client behavior |
|---|---|---|
| 403 | `verification_required` | Discard invalid verification state; restart. |
| 422 | `weak_password` | Preserve password input; focus password. |
| 500 | `completion_failed` | Preserve identical payload/session; manual retry. |
| network/5xx | safe transport/server code | Preserve identical payload/session; manual retry. |

## GET `/api/onboarding/bootstrap`

```http
Accept: application/json
Authorization: Bearer <access_token>
```

Success `200`:

```json
{
  "ok": true,
  "link_status": "linked",
  "profile": {"id":456,"student_id":77,"fullname_ar":"الاسم","fullname_en":"Name","mobile":"+963912345678","email":"name@example.com","date_of_birth":"1990-04-21"},
  "courses": {"upcoming":[],"current":[],"previous":[]},
  "certificates": [],
  "registration_requests": [],
  "history_link_request": null,
  "cache": {"version":1720000000,"strategy":"replace"}
}
```

Rules:

- Refresh after sign-in, completion, foreground, pull-to-refresh, and history-link notification.
- Replace the whole snapshot; never merge arrays; empty arrays are authoritative.
- History collections remain empty until `link_status=linked`.
- `profile.student_id` is the durable history identity; `profile.mobile` remains login identity.
- `401 unauthorized` clears secure credential and snapshot.
- Non-empty courses, certificates, and registrations follow existing `CourseItem`, `HistoricalCertificateItem`, and `RegistrationRequestItem` shapes. Unknown additive fields are ignored; missing top-level collections normalize to empty without merging stale values.

## History-link notification

Canonical data payload:

```json
{"event":"history_link_status_changed"}
```

Foreground receipt/open refreshes immediately. Background/quit receipt stores a non-secret pending marker consumed at boot/foreground. Unrelated events do not trigger this special refresh; normal foreground refresh remains a fallback.

## Excluded administrator operations

The Postman collection also includes authenticated admin-only `GET /mobile-app/link-preview` and `POST /mobile-app/confirm-history-link`. The mobile client does not call them or expose admin UI; it observes their eventual result through Bootstrap and notification refresh.
