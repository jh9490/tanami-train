import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  ACCESS_TOKEN_SERVICE,
  ACCESS_TOKEN_USERNAME,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../src/storage/accessTokenStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
  },
  STORAGE_TYPE: {
    AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
  },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const mockedAsyncStorage = jest.mocked(AsyncStorage);
const mockedKeychain = jest.mocked(Keychain);

const secureOptions = {
  service: ACCESS_TOKEN_SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

describe('accessTokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedAsyncStorage.removeItem.mockResolvedValue();
    mockedKeychain.getGenericPassword.mockResolvedValue(false);
    mockedKeychain.setGenericPassword.mockResolvedValue({
      service: ACCESS_TOKEN_SERVICE,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
    mockedKeychain.resetGenericPassword.mockResolvedValue(true);
  });

  it('returns the secure token before consulting the legacy store', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      username: ACCESS_TOKEN_USERNAME,
      password: 'secure-token',
      service: ACCESS_TOKEN_SERVICE,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    await expect(getAccessToken()).resolves.toBe('secure-token');

    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
      service: ACCESS_TOKEN_SERVICE,
    });
    expect(mockedAsyncStorage.getItem).not.toHaveBeenCalled();
  });

  it('returns null when neither secure nor legacy storage has a token', async () => {
    await expect(getAccessToken()).resolves.toBeNull();

    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('authToken');
    expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled();
    expect(mockedAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('migrates a legacy token securely before removing the plaintext', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue('legacy-token');

    await expect(getAccessToken()).resolves.toBe('legacy-token');

    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      ACCESS_TOKEN_USERNAME,
      'legacy-token',
      secureOptions,
    );
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(
      mockedKeychain.setGenericPassword.mock.invocationCallOrder[0],
    ).toBeLessThan(mockedAsyncStorage.removeItem.mock.invocationCallOrder[0]);
  });

  it('retains the legacy token when secure migration reports failure', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue('legacy-token');
    mockedKeychain.setGenericPassword.mockResolvedValue(false);

    await expect(getAccessToken()).rejects.toThrow(
      'Failed to store the access token securely',
    );

    expect(mockedAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('does not fall back to plaintext when secure storage cannot be read', async () => {
    mockedKeychain.getGenericPassword.mockRejectedValue(
      new Error('secure storage unavailable'),
    );

    await expect(getAccessToken()).rejects.toThrow('secure storage unavailable');
    expect(mockedAsyncStorage.getItem).not.toHaveBeenCalled();
  });

  it('stores new tokens only in secure storage and removes any legacy copy', async () => {
    await setAccessToken('new-token');

    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      ACCESS_TOKEN_USERNAME,
      'new-token',
      secureOptions,
    );
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
  });

  it('attempts to clear both stores even when secure clearing fails', async () => {
    mockedKeychain.resetGenericPassword.mockRejectedValue(
      new Error('secure clear failed'),
    );

    await expect(clearAccessToken()).rejects.toThrow('secure clear failed');

    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: ACCESS_TOKEN_SERVICE,
    });
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
  });
});
