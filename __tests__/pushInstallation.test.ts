const mockRegisterDeviceForRemoteMessages = jest.fn(() => Promise.resolve());
const mockGetToken = jest.fn(() => Promise.resolve('fcm-token'));
const mockOnTokenRefresh = jest.fn(() => jest.fn());

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    registerDeviceForRemoteMessages: mockRegisterDeviceForRemoteMessages,
    getToken: mockGetToken,
    onTokenRefresh: mockOnTokenRefresh,
  }),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
  default: {
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({authorizationStatus: 1}),
    ),
    requestPermission: jest.fn(() =>
      Promise.resolve({authorizationStatus: 1}),
    ),
  },
}));

jest.mock('../src/services/api', () => {
  const actual = jest.requireActual('../src/services/api');

  return {
    ApiError: actual.ApiError,
    api: {
      registerPushInstallation: jest.fn(),
      unlinkPushInstallation: jest.fn(),
    },
  };
});

jest.mock('../src/storage/accessTokenStorage', () => ({
  getAccessToken: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../src/util/deviceId', () => ({
  getOrCreateInstallationId: jest.fn(() =>
    Promise.resolve('installation-123'),
  ),
}));

jest.mock('../src/storage/pushInstallationStorage', () => ({
  markPushUnlinkPending: jest.fn(() => Promise.resolve()),
  isPushUnlinkPending: jest.fn(() => Promise.resolve(false)),
  clearPushUnlinkPending: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/constants/appMetadata', () => ({
  CURRENT_APP_VERSION: '1.1.12',
}));

import {ApiError, api} from '../src/services/api';
import type {PushInstallationResponse} from '../src/types/api';
import {getAccessToken} from '../src/storage/accessTokenStorage';
import {
  clearPushUnlinkPending,
  isPushUnlinkPending,
  markPushUnlinkPending,
} from '../src/storage/pushInstallationStorage';
import {
  reconcilePushInstallation,
  unlinkPushInstallation,
} from '../src/services/pushInstallation';

const mockGetAccessToken = getAccessToken as jest.MockedFunction<
  typeof getAccessToken
>;
const mockRegisterPushInstallation =
  api.registerPushInstallation as jest.MockedFunction<
    typeof api.registerPushInstallation
  >;
const mockUnlinkPushInstallation =
  api.unlinkPushInstallation as jest.MockedFunction<
    typeof api.unlinkPushInstallation
  >;
const mockMarkPending = markPushUnlinkPending as jest.MockedFunction<
  typeof markPushUnlinkPending
>;
const mockIsPending = isPushUnlinkPending as jest.MockedFunction<
  typeof isPushUnlinkPending
>;
const mockClearPending = clearPushUnlinkPending as jest.MockedFunction<
  typeof clearPushUnlinkPending
>;

function response(profileId: number | null = null): PushInstallationResponse {
  return {
    ok: true,
    installation_id: 'installation-123',
    device_row_id: 7,
    profile_id: profileId,
    linked_profile: profileId,
    audience: profileId == null ? 'guest' : 'authenticated',
    active: true,
    notification_permission: 'granted',
    last_seen_at: '2026-09-29 10:00:00',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsPending.mockResolvedValue(false);
  mockGetAccessToken.mockResolvedValue(null);
  mockGetToken.mockResolvedValue('fcm-token');
  mockRegisterPushInstallation.mockResolvedValue(response());
  mockUnlinkPushInstallation.mockResolvedValue(response());
});

test('registers a guest using only the preferred installation contract', async () => {
  await reconcilePushInstallation(null);

  expect(mockRegisterPushInstallation).toHaveBeenCalledTimes(1);
  const [body, accessToken] = mockRegisterPushInstallation.mock.calls[0];
  expect(accessToken).toBeNull();
  expect(body).toEqual(
    expect.objectContaining({
      installation_id: 'installation-123',
      fcm_token: 'fcm-token',
      app_version: '1.1.12',
      notification_permission: 'granted',
    }),
  );
  expect(body).not.toHaveProperty('profile_id');
  expect(body).not.toHaveProperty('device_id');
  expect(body).not.toHaveProperty('token');
});

test('uses the Bearer credential for authenticated reconciliation', async () => {
  mockRegisterPushInstallation.mockResolvedValue(response(456));

  await reconcilePushInstallation('access-token');

  expect(mockRegisterPushInstallation).toHaveBeenCalledWith(
    expect.objectContaining({installation_id: 'installation-123'}),
    'access-token',
  );
});

test('never retries an invalid authenticated request as a guest', async () => {
  mockRegisterPushInstallation.mockRejectedValue(
    new ApiError('unauthenticated', 401, 'Unauthenticated'),
  );

  await expect(reconcilePushInstallation('invalid-token')).rejects.toMatchObject({
    status: 401,
  });
  expect(mockRegisterPushInstallation).toHaveBeenCalledTimes(1);
  expect(mockRegisterPushInstallation.mock.calls[0][1]).toBe('invalid-token');
});

test('marks unlink pending before calling the authenticated unlink endpoint', async () => {
  const events: string[] = [];
  mockMarkPending.mockImplementation(async () => {
    events.push('marked');
  });
  mockUnlinkPushInstallation.mockImplementation(async () => {
    events.push('unlinked');
    return response();
  });
  mockClearPending.mockImplementation(async () => {
    events.push('cleared');
  });

  await unlinkPushInstallation('access-token');

  expect(mockUnlinkPushInstallation).toHaveBeenCalledWith(
    'installation-123',
    'access-token',
  );
  expect(events).toEqual(['marked', 'unlinked', 'cleared']);
});
