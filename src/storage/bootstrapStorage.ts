import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OnboardingBootstrap } from '../types/api';

export const BOOTSTRAP_SNAPSHOT_KEY = 'onboarding_bootstrap_snapshot_v2';
export const BOOTSTRAP_REFRESH_PENDING_KEY = 'onboarding_bootstrap_refresh_pending_v2';

/** Persist one authoritative snapshot. AsyncStorage.setItem replaces the old value. */
export async function saveBootstrapSnapshot(snapshot: OnboardingBootstrap): Promise<void> {
  await AsyncStorage.setItem(BOOTSTRAP_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export async function loadBootstrapSnapshot(): Promise<OnboardingBootstrap | null> {
  const stored = await AsyncStorage.getItem(BOOTSTRAP_SNAPSHOT_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as OnboardingBootstrap;
  } catch {
    // A corrupt cache must never prevent a fresh authoritative Bootstrap fetch.
    await AsyncStorage.removeItem(BOOTSTRAP_SNAPSHOT_KEY);
    return null;
  }
}

export async function clearBootstrapSnapshot(): Promise<void> {
  await AsyncStorage.removeItem(BOOTSTRAP_SNAPSHOT_KEY);
}

export async function markBootstrapRefreshPending(): Promise<void> {
  await AsyncStorage.setItem(BOOTSTRAP_REFRESH_PENDING_KEY, '1');
}

/** Return and clear the background refresh marker in one consumer operation. */
export async function consumeBootstrapRefreshPending(): Promise<boolean> {
  const pending = await AsyncStorage.getItem(BOOTSTRAP_REFRESH_PENDING_KEY);
  if (pending !== '1') return false;

  await AsyncStorage.removeItem(BOOTSTRAP_REFRESH_PENDING_KEY);
  return true;
}

export async function clearBootstrapRefreshPending(): Promise<void> {
  await AsyncStorage.removeItem(BOOTSTRAP_REFRESH_PENDING_KEY);
}

export async function clearBootstrapStorage(): Promise<void> {
  await Promise.all([
    clearBootstrapSnapshot(),
    clearBootstrapRefreshPending(),
  ]);
}
