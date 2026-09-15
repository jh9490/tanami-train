import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export const ACCESS_TOKEN_SERVICE = 'com.tanamitrain.auth.access-token.v2';
export const ACCESS_TOKEN_USERNAME = 'access_token';

const LEGACY_TOKEN_KEY = 'authToken';

const SECURE_WRITE_OPTIONS: Keychain.SetOptions = {
  service: ACCESS_TOKEN_SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

const SECURE_READ_OPTIONS: Keychain.GetOptions = {
  service: ACCESS_TOKEN_SERVICE,
};

async function writeSecureToken(token: string): Promise<void> {
  const result = await Keychain.setGenericPassword(
    ACCESS_TOKEN_USERNAME,
    token,
    SECURE_WRITE_OPTIONS,
  );

  if (!result) {
    throw new Error('Failed to store the access token securely');
  }
}

/**
 * Reads the OS-protected token first and migrates the legacy AsyncStorage value
 * only when no secure credential exists. A failed secure operation never falls
 * back to plaintext, and migration never deletes plaintext before a confirmed
 * secure write.
 */
export async function getAccessToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword(SECURE_READ_OPTIONS);

  if (credentials) {
    if (
      credentials.username !== ACCESS_TOKEN_USERNAME ||
      credentials.password.length === 0
    ) {
      throw new Error('Secure access-token credential is invalid');
    }
    return credentials.password;
  }

  const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacyToken) {
    return null;
  }

  await writeSecureToken(legacyToken);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  return legacyToken;
}

/** Stores a new token in OS-protected storage and removes any legacy copy. */
export async function setAccessToken(token: string): Promise<void> {
  if (!token) {
    throw new Error('Access token must not be empty');
  }

  await writeSecureToken(token);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

/**
 * Clears secure and legacy credentials. Both stores are attempted even if the
 * first clear fails so logout and 401 handling cannot leave an avoidable copy.
 */
export async function clearAccessToken(): Promise<void> {
  const results = await Promise.allSettled([
    Keychain.resetGenericPassword({service: ACCESS_TOKEN_SERVICE}),
    AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
  ]);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failure) {
    throw failure.reason;
  }
}
