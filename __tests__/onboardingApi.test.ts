import {
  ONBOARDING_API_URL,
  OnboardingApiError,
  onboardingApi,
} from '../src/services/onboardingApi';

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  }) as unknown as Response;

describe('onboarding API', () => {
  const fetchMock = jest.fn();
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('sends Start to the root-relative endpoint with JSON and the supplied idempotency key', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {
      ok: true,
      message: 'If reachable, a code was sent.',
      session_token: 'session-secret',
      expires_in: 300,
      resend_after: 20,
    }));

    await onboardingApi.start(
      { country_code: '963', mobile: '0912345678' },
      'gesture-key',
    );

    expect(fetchMock).toHaveBeenCalledWith(`${ONBOARDING_API_URL}/start`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'gesture-key',
      },
      body: JSON.stringify({ country_code: '963', mobile: '0912345678' }),
    });
  });

  it.each([
    ['resend', () => onboardingApi.resend({ session_token: 'session-secret' })],
    ['verify', () => onboardingApi.verify({ session_token: 'session-secret', code: '123456' })],
    ['complete', () => onboardingApi.complete({
      session_token: 'session-secret',
      password: 'password-secret',
    })],
  ])('sends %s as a JSON POST without an idempotency header', async (path, call) => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await call();

    expect(fetchMock).toHaveBeenCalledWith(
      `${ONBOARDING_API_URL}/${path}`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );

    if (path === 'complete') {
      expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({
        session_token: 'session-secret',
        password: 'password-secret',
      }));
    }
  });

  it('sends Bootstrap with bearer authentication and normalizes missing collections to empty', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {
      ok: true,
      link_status: 'unlinked',
      profile: null,
      courses: {},
      cache: { version: 9, strategy: 'replace' },
    }));

    const result = await onboardingApi.bootstrap('access-secret');

    expect(fetchMock).toHaveBeenCalledWith(`${ONBOARDING_API_URL}/bootstrap`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer access-secret',
      },
      body: undefined,
    });
    expect(result.courses).toEqual({ upcoming: [], current: [], previous: [] });
    expect(result.certificates).toEqual([]);
    expect(result.registration_requests).toEqual([]);
    expect(result.history_link_request).toBeNull();
  });

  it('preserves safe retry and attempts metadata without logging secrets', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, {
      ok: false,
      error: 'too_many_attempts',
      retry_after: 60,
      attempts_remaining: 0,
      session_token: 'session-secret',
      access_token: 'access-secret',
      password: 'password-secret',
      code: '123456',
    }));

    await expect(onboardingApi.verify({
      session_token: 'request-session-secret',
      code: '654321',
    })).rejects.toMatchObject<Partial<OnboardingApiError>>({
      code: 'too_many_attempts',
      status: 429,
      retryAfter: 60,
      attemptsRemaining: 0,
      retryable: false,
    });

    const diagnostics = JSON.stringify(warnSpy.mock.calls);
    expect(diagnostics).toContain('too_many_attempts');
    expect(diagnostics).not.toContain('session-secret');
    expect(diagnostics).not.toContain('access-secret');
    expect(diagnostics).not.toContain('password-secret');
    expect(diagnostics).not.toContain('123456');
    expect(diagnostics).not.toContain('654321');
    expect(diagnostics).not.toContain('Authorization');
  });

  it('wraps network failures as safe manually retryable errors', async () => {
    fetchMock.mockRejectedValue(new Error('connection failed with access-secret'));

    await expect(onboardingApi.start(
      { country_code: '963', mobile: '0912345678' },
      'gesture-key',
    )).rejects.toMatchObject<Partial<OnboardingApiError>>({
      code: 'network_error',
      status: 0,
      retryable: true,
    });

    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('access-secret');
  });
});
