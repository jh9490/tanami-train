import {api} from '../src/services/api';
import type {RegisterPushInstallationBody} from '../src/types/api';

const body: RegisterPushInstallationBody = {
  installation_id: 'installation-123',
  fcm_token: 'fcm-token',
  platform: 'android',
  app_version: '1.1.12',
  notification_permission: 'granted',
};

const successResponse = {
  ok: true,
  installation_id: 'installation-123',
  device_row_id: 1,
  profile_id: 456,
  linked_profile: 456,
  audience: 'authenticated',
  active: true,
  notification_permission: 'granted',
  last_seen_at: '2026-09-29 10:00:00',
};

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(successResponse)),
    }),
  ) as jest.Mock;
});

test('registration sends the preferred body with optional Bearer authentication', async () => {
  await api.registerPushInstallation(body, 'access-token');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://admin.tanamitrain.com/api/fcm/register',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer access-token',
      }),
      body: JSON.stringify(body),
    }),
  );
});

test('registration preserves a backend 401 for authentication resolution', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(
          JSON.stringify({ok: false, error: 'unauthenticated'}),
        ),
    }),
  ) as jest.Mock;

  await expect(
    api.registerPushInstallation(body, 'invalid-token'),
  ).rejects.toEqual(
    expect.objectContaining({status: 401, code: 'unauthenticated'}),
  );
});

test('unlink identifies the installation and authenticates the request', async () => {
  await api.unlinkPushInstallation('installation-123', 'access-token');

  expect(global.fetch).toHaveBeenCalledWith(
    'https://admin.tanamitrain.com/api/fcm/unlink',
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer access-token',
      }),
      body: JSON.stringify({installation_id: 'installation-123'}),
    }),
  );
});
