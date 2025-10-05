import AsyncStorage from '@react-native-async-storage/async-storage';

const K_PROFILE_ID = 'profile_id';

export async function setStoredProfileId(id: number | string) {
  await AsyncStorage.setItem(K_PROFILE_ID, String(id));
}

export async function getStoredProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(K_PROFILE_ID);
}

export async function clearStoredProfileId() {
  await AsyncStorage.removeItem(K_PROFILE_ID);
}
