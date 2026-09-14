import {
  canResendOtp,
  canRetryStart,
  canSubmitStart,
  canVerifyOtp,
  createInitialOnboardingState,
  onboardingReducer,
  secondsUntil,
} from '../src/auth/onboardingReducer';
import type { OnboardingSessionResponse, SafeApiErrorMetadata } from '../src/types/api';
import { createIdempotencyKey } from '../src/util/idempotencyKey';

const now = 1_000_000;
const payload = { country_code: '963', mobile: '0912345678' };
const session: OnboardingSessionResponse = {
  ok: true,
  message: 'neutral',
  session_token: 'session-secret',
  expires_in: 300,
  resend_after: 20,
};

const retryableError: SafeApiErrorMetadata = {
  code: 'temporarily_unavailable',
  status: 503,
  retryAfter: null,
  attemptsRemaining: null,
  retryable: true,
};

describe('onboardingReducer', () => {
  it('creates a fresh phone-only state without persisted secrets', () => {
    expect(createInitialOnboardingState()).toEqual(
      expect.objectContaining({
        step: 'phone',
        sessionToken: null,
      }),
    );
  });

  it('retains the immutable payload and key for a manual transient retry', () => {
    let state = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUBMITTING',
      payload,
      idempotencyKey: 'gesture-1',
    });
    state = onboardingReducer(state, { type: 'START_FAILED', error: retryableError, now });

    expect(canRetryStart(state)).toBe(true);
    expect(state.startAttempt).toEqual(
      expect.objectContaining({
        idempotencyKey: 'gesture-1',
        payload,
        status: 'retryable',
      }),
    );

    const retried = onboardingReducer(state, { type: 'START_RETRYING' });
    expect(retried.startAttempt).toEqual(
      expect.objectContaining({ idempotencyKey: 'gesture-1', payload, status: 'submitting' }),
    );
  });

  it('replaces a prior attempt when a fresh gesture supplies a new key', () => {
    const first = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUBMITTING',
      payload,
      idempotencyKey: 'gesture-1',
    });
    const nextPayload = { country_code: '971', mobile: '0501234567' };
    const second = onboardingReducer(first, {
      type: 'START_SUBMITTING',
      payload: nextPayload,
      idempotencyKey: 'gesture-2',
    });

    expect(second.startAttempt).toEqual(
      expect.objectContaining({ idempotencyKey: 'gesture-2', payload: nextPayload }),
    );
  });

  it('invalidates a retry attempt when the visible phone input changes', () => {
    let state = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUBMITTING',
      payload,
      idempotencyKey: 'gesture-1',
    });
    state = onboardingReducer(state, { type: 'START_FAILED', error: retryableError, now });
    state = onboardingReducer(state, {
      type: 'SET_PHONE_INPUT',
      countryCode: payload.country_code,
      mobile: '0999999999',
    });

    expect(state.startAttempt).toBeNull();
    expect(canRetryStart(state)).toBe(false);
  });

  it('uses absolute session deadlines and replaces them after resend', () => {
    const submitting = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUBMITTING',
      payload,
      idempotencyKey: 'gesture-1',
    });
    const otp = onboardingReducer(submitting, { type: 'START_SUCCEEDED', response: session, now });

    expect(otp.step).toBe('otp');
    expect(otp.expiresAt).toBe(now + 300_000);
    expect(otp.resendAt).toBe(now + 20_000);
    expect(canResendOtp(otp, now + 19_999)).toBe(false);
    expect(canResendOtp(otp, now + 20_000)).toBe(true);
    expect(canVerifyOtp(otp, now + 299_999)).toBe(true);
    expect(canVerifyOtp(otp, now + 300_000)).toBe(false);

    const resent = onboardingReducer(otp, {
      type: 'RESEND_SUCCEEDED',
      response: { ...session, session_token: 'replacement', expires_in: 120, resend_after: 30 },
      now: now + 20_000,
    });
    expect(resent.sessionToken).toBe('replacement');
    expect(resent.expiresAt).toBe(now + 140_000);
    expect(resent.resendAt).toBe(now + 50_000);
  });

  it('routes a verified session to simplified registration completion', () => {
    const otp = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUCCEEDED',
      response: session,
      now,
    });
    const complete = onboardingReducer(otp, {
      type: 'VERIFY_SUCCEEDED',
      response: {
        ok: true,
        verified: true,
        session_token: 'verified-secret',
        next_action: 'complete_registration',
      },
    });

    expect(complete.step).toBe('complete');
    expect(complete.nextAction).toBe('complete_registration');
  });

  it('records attempt metadata and enforces a server retry deadline', () => {
    const otp = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUCCEEDED',
      response: session,
      now,
    });
    const limited = onboardingReducer(otp, {
      type: 'VERIFY_FAILED',
      now,
      error: {
        code: 'too_many_attempts',
        status: 429,
        retryAfter: 60,
        attemptsRemaining: 0,
        retryable: false,
      },
    });

    expect(limited.error?.attemptsRemaining).toBe(0);
    expect(canVerifyOtp(limited, now + 59_999)).toBe(false);
    expect(canVerifyOtp(limited, now + 60_000)).toBe(true);
  });

  it('moves the resend deadline forward when resend is rate limited', () => {
    const otp = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUCCEEDED',
      response: { ...session, resend_after: 0 },
      now,
    });
    const limited = onboardingReducer(otp, {
      type: 'RESEND_FAILED',
      now,
      error: {
        code: 'rate_limited',
        status: 429,
        retryAfter: 45,
        attemptsRemaining: null,
        retryable: false,
      },
    });

    expect(canResendOtp(limited, now + 44_999)).toBe(false);
    expect(canResendOtp(limited, now + 45_000)).toBe(true);
  });

  it('clears the verification session when completion succeeds', () => {
    let state = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUCCEEDED',
      response: session,
      now,
    });
    state = onboardingReducer(state, {
      type: 'VERIFY_SUCCEEDED',
      response: {
        ok: true,
        verified: true,
        session_token: 'verified-secret',
        next_action: 'complete_registration',
      },
    });

    const cleared = onboardingReducer(state, { type: 'COMPLETION_SUCCEEDED' });
    expect(cleared).toEqual(createInitialOnboardingState());
    expect(JSON.stringify(cleared)).not.toContain('session-secret');
  });

  it('derives stable countdown values from an absolute deadline', () => {
    expect(secondsUntil(now + 1_001, now)).toBe(2);
    expect(secondsUntil(now - 1, now)).toBe(0);
    expect(secondsUntil(null, now)).toBe(0);
  });

  it('blocks another start while submitting or rate limited', () => {
    const submitting = onboardingReducer(createInitialOnboardingState(), {
      type: 'START_SUBMITTING',
      payload,
      idempotencyKey: 'gesture-1',
    });
    expect(canSubmitStart(submitting, now)).toBe(false);

    const limited = onboardingReducer(submitting, {
      type: 'START_FAILED',
      now,
      error: { ...retryableError, code: 'rate_limited', status: 429, retryAfter: 20, retryable: false },
    });
    expect(canSubmitStart(limited, now + 19_999)).toBe(false);
    expect(canSubmitStart(limited, now + 20_000)).toBe(true);
  });

  it('generates a fresh UUID-shaped idempotency key for each gesture', () => {
    const first = createIdempotencyKey();
    const second = createIdempotencyKey();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second).not.toBe(first);
  });
});
