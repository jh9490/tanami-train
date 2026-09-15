import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BOOTSTRAP_REFRESH_PENDING_KEY,
  BOOTSTRAP_SNAPSHOT_KEY,
  clearBootstrapStorage,
  consumeBootstrapRefreshPending,
  loadBootstrapSnapshot,
  markBootstrapRefreshPending,
  saveBootstrapSnapshot,
} from '../src/storage/bootstrapStorage';
import type { OnboardingBootstrap } from '../src/types/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const storage = jest.mocked(AsyncStorage);

const snapshot = (version: number, courseIds: number[] = []): OnboardingBootstrap => ({
  ok: true,
  link_status: 'linked',
  profile: null,
  courses: {
    upcoming: [],
    current: courseIds.map(id => ({ registration_id: id } as any)),
    previous: [],
  },
  certificates: [],
  registration_requests: [],
  history_link_request: null,
  cache: { version, strategy: 'replace' },
});

describe('Bootstrap storage', () => {
  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
    storage.removeItem.mockReset();
    storage.setItem.mockResolvedValue();
    storage.removeItem.mockResolvedValue();
  });

  it('writes each Bootstrap as one whole replacement snapshot', async () => {
    const oldSnapshot = snapshot(1, [10, 11]);
    const replacement = snapshot(2);

    await saveBootstrapSnapshot(oldSnapshot);
    await saveBootstrapSnapshot(replacement);

    expect(storage.setItem).toHaveBeenNthCalledWith(
      1,
      BOOTSTRAP_SNAPSHOT_KEY,
      JSON.stringify(oldSnapshot),
    );
    expect(storage.setItem).toHaveBeenNthCalledWith(
      2,
      BOOTSTRAP_SNAPSHOT_KEY,
      JSON.stringify(replacement),
    );
    expect(JSON.parse(storage.setItem.mock.calls[1][1])).toEqual(replacement);
    expect(JSON.parse(storage.setItem.mock.calls[1][1]).courses.current).toEqual([]);
  });

  it('loads a stored snapshot and removes an unreadable snapshot', async () => {
    const saved = snapshot(3, [20]);
    storage.getItem.mockResolvedValueOnce(JSON.stringify(saved));

    await expect(loadBootstrapSnapshot()).resolves.toEqual(saved);

    storage.getItem.mockResolvedValueOnce('{not-json');
    await expect(loadBootstrapSnapshot()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(BOOTSTRAP_SNAPSHOT_KEY);
  });

  it('clears both the snapshot and a pending refresh marker', async () => {
    await clearBootstrapStorage();

    expect(storage.removeItem).toHaveBeenCalledWith(BOOTSTRAP_SNAPSHOT_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(BOOTSTRAP_REFRESH_PENDING_KEY);
  });

  it('marks, consumes, and clears a pending background refresh exactly once', async () => {
    await markBootstrapRefreshPending();
    expect(storage.setItem).toHaveBeenCalledWith(BOOTSTRAP_REFRESH_PENDING_KEY, '1');

    storage.getItem.mockResolvedValueOnce('1').mockResolvedValueOnce(null);
    await expect(consumeBootstrapRefreshPending()).resolves.toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith(BOOTSTRAP_REFRESH_PENDING_KEY);
    await expect(consumeBootstrapRefreshPending()).resolves.toBe(false);
  });
});
