// src/services/notifications.ts
import { Platform } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, Event, EventType } from '@notifee/react-native';
import { api } from '../services/api';
import { getOrCreateDeviceId } from '../util/deviceId';

// ✅ import storage helper
import { getStoredProfileId } from '../storage/authStorage';

type InitOpts = {
  onMessage?: (data: Record<string, string>) => void | Promise<void>;
  onOpen?: (data: Record<string, string>) => void | Promise<void>;
};

function stringifyNotificationData(
  data?: Record<string, string | object>,
): Record<string, string> {
  if (!data) return {};

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ])
  );
}

/** Ensure a default Android channel exists (required on Android 8+) */
async function ensureDefaultChannel(): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'General',
    importance: AndroidImportance.HIGH,
  });
  return channelId;
}

/** Nicely show a local notification (used for foreground messages) */
async function displayLocalNotification(msg: FirebaseMessagingTypes.RemoteMessage) {
  const channelId = await ensureDefaultChannel();
  const data = stringifyNotificationData(msg.data);
  const title = msg.notification?.title || data.title || 'Tanami Train';
  const body = msg.notification?.body || data.body || 'لديك إشعار جديد';
  await notifee.displayNotification({
    title,
    body,
    android: { channelId, smallIcon: 'ic_launcher', pressAction: { id: 'default' } },
    data,
  });
}

/** ACK to backend ONLY if signed-in (profile id comes from storage) */
async function ackIfSignedIn(msg: FirebaseMessagingTypes.RemoteMessage) {
  try {
    const pid = await getStoredProfileId();
    if (!pid) {
      console.log('[ACK] skip — no profile id in storage');
      return;
    }

    const profileId = Number(pid);
    const deviceId = await getOrCreateDeviceId();
    const via: 'token' | 'profile' | 'topic' =
      (msg.from || '').startsWith('/topics/') ? 'topic' : 'token';

    const payload = {
      profile_id: profileId,
      device_id: deviceId,
      notification_id: msg.data?.notification_id ? Number(msg.data.notification_id) : undefined,
      fcm_message_id: msg.messageId || undefined,
      title: msg.notification?.title,
      body: msg.notification?.body,
      data: stringifyNotificationData(msg.data),
      via,
      received_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    console.log('[ACK] sending →', payload);
    const res = await api.inboxAck(payload as any);
    console.log('[ACK] response ←', res);
  } catch (e) {
    console.log('inboxAck error:', e);
  }
}

async function emitNotificationData(
  callback: InitOpts['onMessage'] | InitOpts['onOpen'],
  data?: Record<string, string | object>,
) {
  if (!callback || !data) return;
  try {
    await callback(stringifyNotificationData(data));
  } catch (e) {
    console.log('notification data callback error:', e);
  }
}

/** Listen to foreground FCM messages, expose their data, and show them via Notifee. */
function listenForegroundMessages(onMessage?: InitOpts['onMessage']) {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    try {
      await ackIfSignedIn(remoteMessage); // ✅ storage-based
      await emitNotificationData(onMessage, remoteMessage.data);
      await displayLocalNotification(remoteMessage);
    } catch (e) {
      console.log('displayLocalNotification error:', e);
    }
  });
  return unsubscribe;
}

/** Handle when the user taps a notification to open the app */
function attachOpenHandlers(onOpen?: InitOpts['onOpen']) {
  const unsubOpened = messaging().onNotificationOpenedApp(async (remoteMessage) => {
    await ackIfSignedIn(remoteMessage);
    await emitNotificationData(onOpen, remoteMessage?.data);
  });

  messaging()
    .getInitialNotification()
    .then(async (remoteMessage) => {
      if (remoteMessage) {
        await ackIfSignedIn(remoteMessage);
        await emitNotificationData(onOpen, remoteMessage.data);
      }
    });

  const unsubNotifee = notifee.onForegroundEvent(async (event: Event) => {
    if (event.type === EventType.PRESS) {
      await emitNotificationData(
        onOpen,
        event.detail.notification?.data as Record<string, string | object> | undefined,
      );
    }
  });

  return () => {
    unsubOpened();
    unsubNotifee();
  };
}

/** Init notifications */
export async function initNotifications(opts: InitOpts = {}) {
  const unsubMsg = listenForegroundMessages(opts.onMessage);
  const unsubOpen = attachOpenHandlers(opts.onOpen);

  return () => {
    unsubMsg();
    unsubOpen();
  };
}
