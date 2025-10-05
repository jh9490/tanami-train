// src/utils/deviceId.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'device_id';
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) { id = uuidv4(); await AsyncStorage.setItem(KEY, id); }
  return id;
}
