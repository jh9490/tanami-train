import { BASE_ROOT } from './api';
import type {
  OnboardingBootstrap,
  OnboardingCompleteRequest,
  OnboardingCompleteResponse,
  OnboardingResendRequest,
  OnboardingSessionResponse,
  OnboardingStartRequest,
  OnboardingVerifyRequest,
  OnboardingVerifyResponse,
  SafeApiErrorMetadata,
} from '../types/api';

export const ONBOARDING_API_URL = `${BASE_ROOT}/api/onboarding`;

type OnboardingMethod = 'GET' | 'POST';

export class OnboardingApiError extends Error implements SafeApiErrorMetadata {
  readonly retryAfter: number | null;
  readonly attemptsRemaining: number | null;
  readonly retryable: boolean;

  constructor(
    readonly code: string,
    readonly status: number,
    metadata: {
      retryAfter?: number | null;
      attemptsRemaining?: number | null;
      retryable?: boolean;
    } = {},
  ) {
    super(code);
    this.name = 'OnboardingApiError';
    this.retryAfter = metadata.retryAfter ?? null;
    this.attemptsRemaining = metadata.attemptsRemaining ?? null;
    this.retryable = metadata.retryable ?? (status === 0 || status >= 500);
  }
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function safeDiagnostic(
  method: OnboardingMethod,
  path: string,
  status: number,
  code: string,
) {
  // Deliberately exclude headers, request/response bodies, tokens, codes, and passwords.
  console.warn('[Onboarding API]', { method, path, status, code });
}

async function onboardingRequest<T>(
  path: string,
  method: OnboardingMethod,
  options: {
    body?: unknown;
    accessToken?: string;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${ONBOARDING_API_URL}/${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: method === 'POST' ? JSON.stringify(options.body ?? {}) : undefined,
    });
  } catch {
    safeDiagnostic(method, path, 0, 'network_error');
    throw new OnboardingApiError('network_error', 0, { retryable: true });
  }

  const responseText = await response.text();
  let json: any = {};
  if (responseText) {
    try {
      json = JSON.parse(responseText);
    } catch {
      json = {};
    }
  }

  if (!response.ok || json?.ok === false) {
    const code = typeof json?.error === 'string'
      ? json.error
      : `HTTP_${response.status}`;
    safeDiagnostic(method, path, response.status, code);
    throw new OnboardingApiError(code, response.status, {
      retryAfter: optionalNumber(json?.retry_after),
      attemptsRemaining: optionalNumber(json?.attempts_remaining),
    });
  }

  return json as T;
}

function normalizeBootstrap(snapshot: OnboardingBootstrap): OnboardingBootstrap {
  return {
    ...snapshot,
    courses: {
      upcoming: snapshot.courses?.upcoming ?? [],
      current: snapshot.courses?.current ?? [],
      previous: snapshot.courses?.previous ?? [],
    },
    certificates: snapshot.certificates ?? [],
    registration_requests: snapshot.registration_requests ?? [],
    history_link_request: snapshot.history_link_request ?? null,
  };
}

export const onboardingApi = {
  start: (body: OnboardingStartRequest, idempotencyKey: string) =>
    onboardingRequest<OnboardingSessionResponse>('start', 'POST', {
      body,
      idempotencyKey,
    }),

  resend: (body: OnboardingResendRequest) =>
    onboardingRequest<OnboardingSessionResponse>('resend', 'POST', { body }),

  verify: (body: OnboardingVerifyRequest) =>
    onboardingRequest<OnboardingVerifyResponse>('verify', 'POST', { body }),

  complete: (body: OnboardingCompleteRequest) =>
    onboardingRequest<OnboardingCompleteResponse>('complete', 'POST', { body }),

  bootstrap: async (accessToken: string) => {
    const snapshot = await onboardingRequest<OnboardingBootstrap>('bootstrap', 'GET', {
      accessToken,
    });
    return normalizeBootstrap(snapshot);
  },
};
