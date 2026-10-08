import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_UNLINK_KEY = 'push_installation_pending_unlink_v1';

export async function markPushUnlinkPending(): Promise<void> {
  await AsyncStorage.setItem(PENDING_UNLINK_KEY, '1');
}

export async function isPushUnlinkPending(): Promise<boolean> {
  return (await AsyncStorage.getItem(PENDING_UNLINK_KEY)) === '1';
}

export async function clearPushUnlinkPending(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_UNLINK_KEY);
}
