import type {
  OnboardingNextAction,
  OnboardingSessionResponse,
  OnboardingStartRequest,
  OnboardingVerifyResponse,
  SafeApiErrorMetadata,
} from '../types/api';

export type OnboardingStep = 'phone' | 'otp' | 'complete';
export type StartAttemptStatus = 'idle' | 'submitting' | 'retryable' | 'rate_limited';
export type CompletionStatus = 'idle' | 'submitting' | 'retryable';

export interface OnboardingStartAttempt {
  idempotencyKey: string;
  payload: Readonly<OnboardingStartRequest>;
  status: StartAttemptStatus;
  retryAt: number | null;
}

export interface OnboardingFlowState {
  step: OnboardingStep;
  countryCode: string;
  mobile: string;
  startAttempt: OnboardingStartAttempt | null;
  sessionToken: string | null;
  expiresAt: number | null;
  resendAt: number | null;
  verifyDisabledUntil: number | null;
  nextAction: OnboardingNextAction | null;
  completionStatus: CompletionStatus;
  error: SafeApiErrorMetadata | null;
}

export function createInitialOnboardingState(): OnboardingFlowState {
  return {
    step: 'phone',
    countryCode: '',
    mobile: '',
    startAttempt: null,
    sessionToken: null,
    expiresAt: null,
    resendAt: null,
    verifyDisabledUntil: null,
    nextAction: null,
    completionStatus: 'idle',
    error: null,
  };
}

export const initialOnboardingState = createInitialOnboardingState();

export type OnboardingAction =
  | { type: 'SET_PHONE_INPUT'; countryCode: string; mobile: string }
  | { type: 'START_SUBMITTING'; payload: OnboardingStartRequest; idempotencyKey: string }
  | { type: 'START_RETRYING' }
  | { type: 'START_SUCCEEDED'; response: OnboardingSessionResponse; now?: number }
  | { type: 'START_FAILED'; error: SafeApiErrorMetadata; now?: number }
  | { type: 'RESEND_SUCCEEDED'; response: OnboardingSessionResponse; now?: number }
  | { type: 'RESEND_FAILED'; error: SafeApiErrorMetadata; now?: number }
  | { type: 'VERIFY_SUCCEEDED'; response: OnboardingVerifyResponse }
  | { type: 'VERIFY_FAILED'; error: SafeApiErrorMetadata; now?: number }
  | { type: 'SET_ERROR'; error: SafeApiErrorMetadata | null }
  | { type: 'INVALIDATE_SESSION' }
  | { type: 'COMPLETION_SUBMITTING' }
  | { type: 'COMPLETION_FAILED'; error: SafeApiErrorMetadata }
  | { type: 'COMPLETION_SUCCEEDED' }
  | { type: 'RESET' };

const deadlineFromSeconds = (now: number, seconds: number | null | undefined): number =>
  now + Math.max(0, seconds ?? 0) * 1_000;

export function onboardingReducer(
  state: OnboardingFlowState,
  action: OnboardingAction,
): OnboardingFlowState {
  switch (action.type) {
    case 'SET_PHONE_INPUT':
      return {
        ...state,
        countryCode: action.countryCode,
        mobile: action.mobile,
        startAttempt:
          state.startAttempt &&
          (state.startAttempt.payload.country_code !== action.countryCode ||
            state.startAttempt.payload.mobile !== action.mobile)
            ? null
            : state.startAttempt,
        error: null,
      };
    case 'START_SUBMITTING':
      return {
        ...state,
        countryCode: action.payload.country_code,
        mobile: action.payload.mobile,
        startAttempt: {
          idempotencyKey: action.idempotencyKey,
          payload: { ...action.payload },
          status: 'submitting',
          retryAt: null,
        },
        error: null,
      };
    case 'START_RETRYING':
      if (!state.startAttempt || state.startAttempt.status !== 'retryable') return state;
      return {
        ...state,
        startAttempt: { ...state.startAttempt, status: 'submitting' },
        error: null,
      };
    case 'START_SUCCEEDED': {
      const currentTime = action.now ?? Date.now();
      return {
        ...state,
        step: 'otp',
        startAttempt: null,
        sessionToken: action.response.session_token,
        expiresAt: deadlineFromSeconds(currentTime, action.response.expires_in),
        resendAt: deadlineFromSeconds(currentTime, action.response.resend_after),
        verifyDisabledUntil: null,
        nextAction: null,
        error: null,
      };
    }
    case 'START_FAILED': {
      if (!state.startAttempt) return { ...state, error: action.error };
      const currentTime = action.now ?? Date.now();
      const rateLimited = action.error.retryAfter !== null;
      return {
        ...state,
        startAttempt: {
          ...state.startAttempt,
          status: rateLimited ? 'rate_limited' : action.error.retryable ? 'retryable' : 'idle',
          retryAt: rateLimited
            ? deadlineFromSeconds(currentTime, action.error.retryAfter)
            : null,
        },
        error: action.error,
      };
    }
    case 'RESEND_SUCCEEDED': {
      const currentTime = action.now ?? Date.now();
      return {
        ...state,
        sessionToken: action.response.session_token,
        expiresAt: deadlineFromSeconds(currentTime, action.response.expires_in),
        resendAt: deadlineFromSeconds(currentTime, action.response.resend_after),
        verifyDisabledUntil: null,
        error: null,
      };
    }
    case 'RESEND_FAILED': {
      const currentTime = action.now ?? Date.now();
      return {
        ...state,
        resendAt:
          action.error.retryAfter === null
            ? state.resendAt
            : deadlineFromSeconds(currentTime, action.error.retryAfter),
        error: action.error,
      };
    }
    case 'VERIFY_SUCCEEDED': {
      return {
        ...state,
        step: 'complete',
        sessionToken: action.response.session_token,
        nextAction: action.response.next_action,
        verifyDisabledUntil: null,
        error: null,
      };
    }
    case 'VERIFY_FAILED': {
      const currentTime = action.now ?? Date.now();
      return {
        ...state,
        verifyDisabledUntil:
          action.error.retryAfter === null
            ? state.verifyDisabledUntil
            : deadlineFromSeconds(currentTime, action.error.retryAfter),
        error: action.error,
      };
    }
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'INVALIDATE_SESSION':
    case 'COMPLETION_SUCCEEDED':
    case 'RESET':
      return createInitialOnboardingState();
    case 'COMPLETION_SUBMITTING':
      return { ...state, completionStatus: 'submitting', error: null };
    case 'COMPLETION_FAILED':
      return {
        ...state,
        completionStatus: action.error.retryable ? 'retryable' : 'idle',
        error: action.error,
      };
    default:
      return state;
  }
}

export function secondsUntil(deadline: number | null, now = Date.now()): number {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}

export const canRetryStart = (state: OnboardingFlowState): boolean =>
  state.step === 'phone' && state.startAttempt?.status === 'retryable';

export const canSubmitStart = (state: OnboardingFlowState, now = Date.now()): boolean => {
  const attempt = state.startAttempt;
  if (!attempt) return true;
  if (attempt.status === 'submitting') return false;
  if (attempt.status === 'rate_limited') return secondsUntil(attempt.retryAt, now) === 0;
  return true;
};

export const canResendOtp = (state: OnboardingFlowState, now = Date.now()): boolean =>
  state.step === 'otp' &&
  Boolean(state.sessionToken) &&
  secondsUntil(state.resendAt, now) === 0;

export const canVerifyOtp = (state: OnboardingFlowState, now = Date.now()): boolean =>
  state.step === 'otp' &&
  Boolean(state.sessionToken) &&
  secondsUntil(state.expiresAt, now) > 0 &&
  secondsUntil(state.verifyDisabledUntil, now) === 0;

export const selectOtpSecondsRemaining = (
  state: OnboardingFlowState,
  now = Date.now(),
): number => secondsUntil(state.expiresAt, now);

export const selectResendSecondsRemaining = (
  state: OnboardingFlowState,
  now = Date.now(),
): number => secondsUntil(state.resendAt, now);

export const canAccessOtpStep = (state: OnboardingFlowState): boolean =>
  state.step === 'otp' && Boolean(state.sessionToken);

export const canAccessCompletionStep = (state: OnboardingFlowState): boolean =>
  state.step === 'complete' &&
  Boolean(state.sessionToken) &&
  state.nextAction === 'complete_registration';
