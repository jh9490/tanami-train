import { api, ApiError, MOBILE_API_URL } from '../src/services/api';

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  }) as unknown as Response;

describe('mobile synchronization API', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it.each([
    ['profile', () => api.getProfile('token-123')],
    ['my-certificates', () => api.fetchCertificates('token-123')],
    ['my-registrations', () => api.myRegistrations('token-123')],
  ])('sends the bearer token to GET /%s', async (path, call) => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true, items: [] }));

    await call();

    expect(fetchMock).toHaveBeenCalledWith(
      `${MOBILE_API_URL}/${path}`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      }),
    );
  });

  it('uses token-authoritative course lookup without requiring a mobile number', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { result: 1, items: [] }));

    await api.fetchCourses('token-123', 'previous');

    expect(fetchMock).toHaveBeenCalledWith(
      `${MOBILE_API_URL}/my-courses`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
        body: JSON.stringify({ phase: 'previous' }),
      }),
    );
  });

  it('preserves registration validation status and error code', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, { ok: false, error: 'online_registration_unavailable' }),
    );

    await expect(api.registerForActivity('token-123', 30, 1)).rejects.toMatchObject<
      Partial<ApiError>
    >({
      code: 'online_registration_unavailable',
      status: 422,
    });
  });
});
