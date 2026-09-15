/* eslint-env jest */

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
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() =>
    Promise.resolve({
      service: 'com.tanamitrain.auth.access-token.v2',
      storage: 'KeystoreAESGCM_NoAuth',
    }),
  ),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));
