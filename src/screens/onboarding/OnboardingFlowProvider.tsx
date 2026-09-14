import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  canAccessCompletionStep,
  canResendOtp,
  canRetryStart,
  createInitialOnboardingState,
  onboardingReducer,
  type OnboardingFlowState,
} from '../../auth/onboardingReducer';
import { OnboardingApiError, onboardingApi } from '../../services/onboardingApi';
import type {
  OnboardingCompleteRequest,
  OnboardingCompleteResponse,
  OnboardingSessionResponse,
  OnboardingStartRequest,
  OnboardingVerifyResponse,
  SafeApiErrorMetadata,
} from '../../types/api';
import { createIdempotencyKey } from '../../util/idempotencyKey';

type CompletionSuccessHandler = (result: OnboardingCompleteResponse) => void | Promise<void>;

export interface OnboardingFlowContextValue {
  state: OnboardingFlowState;
  setPhoneInput: (countryCode: string, mobile: string) => void;
  start: (payload: OnboardingStartRequest) => Promise<OnboardingSessionResponse | null>;
  retryStart: () => Promise<OnboardingSessionResponse | null>;
  resend: () => Promise<OnboardingSessionResponse | null>;
  verify: (code: string) => Promise<OnboardingVerifyResponse | null>;
  complete: (password: string) => Promise<OnboardingCompleteResponse | null>;
  clearError: () => void;
  restart: () => void;
}

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | null>(null);

const toSafeError = (error: unknown): SafeApiErrorMetadata => {
  if (error instanceof OnboardingApiError) {
    return {
      code: error.code,
      status: error.status,
      retryAfter: error.retryAfter,
      attemptsRemaining: error.attemptsRemaining,
      retryable: error.retryable,
    };
  }

  return {
    code: 'network_error',
    status: 0,
    retryAfter: null,
    attemptsRemaining: null,
    retryable: true,
  };
};

export function buildCompletionRequest(
  state: OnboardingFlowState,
  password: string,
): OnboardingCompleteRequest | null {
  const { sessionToken } = state;
  if (!sessionToken || password.length < 8 || !canAccessCompletionStep(state)) return null;

  return {
    session_token: sessionToken,
    password,
  };
}

export function OnboardingFlowProvider({
  children,
  onSuccess,
  initialState,
}: React.PropsWithChildren<{
  onSuccess?: CompletionSuccessHandler;
  initialState?: OnboardingFlowState;
}>) {
  const [state, dispatch] = useReducer(
    onboardingReducer,
    initialState ?? createInitialOnboardingState(),
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const inFlight = useRef({ start: false, resend: false, verify: false, complete: false });

  const setPhoneInput = useCallback((countryCode: string, mobile: string) => {
    dispatch({ type: 'SET_PHONE_INPUT', countryCode, mobile });
  }, []);

  const runStart = useCallback(async (
    attempt: { payload: OnboardingStartRequest; idempotencyKey: string },
    retry: boolean,
  ) => {
    if (inFlight.current.start) return null;
    inFlight.current.start = true;
    if (retry) dispatch({ type: 'START_RETRYING' });
    else dispatch({ type: 'START_SUBMITTING', ...attempt });

    try {
      const response = await onboardingApi.start(attempt.payload, attempt.idempotencyKey);
      dispatch({ type: 'START_SUCCEEDED', response });
      return response;
    } catch (error) {
      dispatch({ type: 'START_FAILED', error: toSafeError(error) });
      return null;
    } finally {
      inFlight.current.start = false;
    }
  }, []);

  const start = useCallback(
    (payload: OnboardingStartRequest) =>
      runStart({ payload, idempotencyKey: createIdempotencyKey() }, false),
    [runStart],
  );

  const retryStart = useCallback(() => {
    const current = stateRef.current;
    if (!canRetryStart(current) || !current.startAttempt) return Promise.resolve(null);
    return runStart(current.startAttempt, true);
  }, [runStart]);

  const resend = useCallback(async () => {
    const current = stateRef.current;
    if (inFlight.current.resend || !current.sessionToken || !canResendOtp(current)) return null;
    inFlight.current.resend = true;
    try {
      const response = await onboardingApi.resend({ session_token: current.sessionToken });
      dispatch({ type: 'RESEND_SUCCEEDED', response });
      return response;
    } catch (error) {
      const safeError = toSafeError(error);
      if (safeError.code === 'invalid_session') dispatch({ type: 'INVALIDATE_SESSION' });
      else dispatch({ type: 'RESEND_FAILED', error: safeError });
      return null;
    } finally {
      inFlight.current.resend = false;
    }
  }, []);

  const verify = useCallback(async (code: string) => {
    const current = stateRef.current;
    if (inFlight.current.verify || !current.sessionToken || !/^\d{6}$/.test(code)) return null;
    inFlight.current.verify = true;
    try {
      const response = await onboardingApi.verify({ session_token: current.sessionToken, code });
      dispatch({ type: 'VERIFY_SUCCEEDED', response });
      return response;
    } catch (error) {
      const safeError = toSafeError(error);
      if (safeError.code === 'invalid_session') dispatch({ type: 'INVALIDATE_SESSION' });
      else dispatch({ type: 'VERIFY_FAILED', error: safeError });
      return null;
    } finally {
      inFlight.current.verify = false;
    }
  }, []);

  const complete = useCallback(async (password: string) => {
    const current = stateRef.current;
    const request = buildCompletionRequest(current, password);
    if (inFlight.current.complete || !request) return null;
    inFlight.current.complete = true;
    dispatch({ type: 'COMPLETION_SUBMITTING' });
    try {
      const response = await onboardingApi.complete(request);
      await onSuccess?.(response);
      dispatch({ type: 'COMPLETION_SUCCEEDED' });
      return response;
    } catch (error) {
      const safeError = toSafeError(error);
      if (safeError.code === 'verification_required') {
        dispatch({ type: 'INVALIDATE_SESSION' });
      } else {
        dispatch({ type: 'COMPLETION_FAILED', error: safeError });
      }
      return null;
    } finally {
      inFlight.current.complete = false;
    }
  }, [onSuccess]);

  const clearError = useCallback(() => dispatch({ type: 'SET_ERROR', error: null }), []);
  const restart = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = useMemo<OnboardingFlowContextValue>(() => ({
    state,
    setPhoneInput,
    start,
    retryStart,
    resend,
    verify,
    complete,
    clearError,
    restart,
  }), [
    clearError,
    complete,
    resend,
    restart,
    retryStart,
    setPhoneInput,
    start,
    state,
    verify,
  ]);

  return <OnboardingFlowContext.Provider value={value}>{children}</OnboardingFlowContext.Provider>;
}

export function useOnboardingFlow(): OnboardingFlowContextValue {
  const context = useContext(OnboardingFlowContext);
  if (!context) throw new Error('useOnboardingFlow must be used within OnboardingFlowProvider');
  return context;
}
