jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getOrCreateInstallationId} from '../src/util/deviceId';

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

test('concurrent callers create only one persistent installation ID', async () => {
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);

  const [first, second, third] = await Promise.all([
    getOrCreateInstallationId(),
    getOrCreateInstallationId(),
    getOrCreateInstallationId(),
  ]);

  expect(first).toBe(second);
  expect(second).toBe(third);
  expect(mockGetItem).toHaveBeenCalledTimes(1);
  expect(mockSetItem).toHaveBeenCalledTimes(1);
  expect(mockSetItem).toHaveBeenCalledWith('device_id', first);
});
