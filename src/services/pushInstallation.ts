import messaging from '@react-native-firebase/messaging';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {AppState, Platform} from 'react-native';

import {CURRENT_APP_VERSION} from '../constants/appMetadata';
import {getAccessToken} from '../storage/accessTokenStorage';
import {
  clearPushUnlinkPending,
  isPushUnlinkPending,
  markPushUnlinkPending,
} from '../storage/pushInstallationStorage';
import type {
  PushInstallationResponse,
  PushNotificationPermission,
  RegisterPushInstallationBody,
} from '../types/api';
import {getOrCreateInstallationId} from '../util/deviceId';
import {ApiError, api} from './api';

const FOREGROUND_RECONCILE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const INITIAL_RETRY_DELAY_MS = 30 * 1000;
const MAX_RETRY_DELAY_MS = 30 * 60 * 1000;

let started = false;
let stopped = false;
let lastSuccessfulReconcileAt = 0;
let lastKnownPermission: PushNotificationPermission | null = null;
let retryDelayMs = INITIAL_RETRY_DELAY_MS;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let operationQueue: Promise<unknown> = Promise.resolve();

function permissionName(status: AuthorizationStatus): PushNotificationPermission {
  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
      return 'granted';
    case AuthorizationStatus.DENIED:
      return 'denied';
    case AuthorizationStatus.PROVISIONAL:
      return 'provisional';
    case AuthorizationStatus.NOT_DETERMINED:
      return 'not_determined';
    default:
      return 'unknown';
  }
}

function getLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale?.split('-')[0];
  } catch {
    return undefined;
  }
}

function getTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function getDeviceMetadata(): Pick<
  RegisterPushInstallationBody,
  'device_model' | 'os_version'
> {
  if (Platform.OS === 'android') {
    return {
      device_model: Platform.constants.Model || undefined,
      os_version: Platform.constants.Release || String(Platform.Version),
    };
  }

  if (Platform.OS === 'ios') {
    return {os_version: Platform.constants.osVersion || String(Platform.Version)};
  }

  return {os_version: String(Platform.Version)};
}

function validateResponse(
  response: PushInstallationResponse,
  expectedInstallationId: string,
): PushInstallationResponse {
  if (
    response?.ok !== true ||
    response.installation_id !== expectedInstallationId ||
    !['guest', 'authenticated'].includes(response.audience)
  ) {
    throw new Error('Invalid push installation response');
  }
  return response;
}

function clearRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryDelayMs = INITIAL_RETRY_DELAY_MS;
}

function scheduleRetry(): void {
  if (stopped || retryTimer) return;

  const delay = retryDelayMs;
  retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    reconcilePushInstallation().catch(() => undefined);
  }, delay);
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = operationQueue.catch(() => undefined).then(operation);
  operationQueue = next;
  return next;
}

async function resolvePendingUnlink(
  installationId: string,
  accessToken: string | null,
): Promise<void> {
  if (!(await isPushUnlinkPending()) || !accessToken) return;

  const response = await api.unlinkPushInstallation(installationId, accessToken);
  validateResponse(response, installationId);
  await clearPushUnlinkPending();
}

async function performReconcile(
  explicitAccessToken?: string | null,
  refreshedFcmToken?: string,
): Promise<PushInstallationResponse> {
  const accessToken =
    explicitAccessToken === undefined
      ? await getAccessToken()
      : explicitAccessToken;
  const installationId = await getOrCreateInstallationId();

  // If an offline logout left work behind, resolve it before this installation
  // can be linked to an authenticated session again.
  await resolvePendingUnlink(installationId, accessToken);

  await messaging().registerDeviceForRemoteMessages();
  const fcmToken = refreshedFcmToken ?? (await messaging().getToken());
  if (!fcmToken) throw new Error('Firebase did not return an FCM token');

  const settings = await notifee.getNotificationSettings();
  const notificationPermission = permissionName(settings.authorizationStatus);
  const body: RegisterPushInstallationBody = {
    installation_id: installationId,
    fcm_token: fcmToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    app_version: CURRENT_APP_VERSION,
    notification_permission: notificationPermission,
    locale: getLocale(),
    timezone: getTimezone(),
    ...getDeviceMetadata(),
  };

  const response = validateResponse(
    await api.registerPushInstallation(body, accessToken),
    installationId,
  );
  lastSuccessfulReconcileAt = Date.now();
  lastKnownPermission = notificationPermission;
  clearRetry();
  console.log('[PushInstallation] reconciled', {
    audience: response.audience,
    linked: response.profile_id != null,
    permission: response.notification_permission,
  });
  return response;
}

/**
 * Reconcile one persistent app installation. Passing null explicitly performs
 * a guest registration; omitting the argument reads the current secure token.
 */
export function reconcilePushInstallation(
  accessToken?: string | null,
  refreshedFcmToken?: string,
): Promise<PushInstallationResponse> {
  return serialize(async () => {
    try {
      return await performReconcile(accessToken, refreshedFcmToken);
    } catch (error) {
      // An invalid authenticated request must never be retried as a guest.
      if (!(error instanceof ApiError && error.status === 401)) scheduleRetry();
      console.log('[PushInstallation] reconcile failed', {
        status: error instanceof ApiError ? error.status : undefined,
        message: error instanceof Error ? error.message : 'unknown_error',
      });
      throw error;
    }
  });
}

/** Mark first so an interrupted or offline logout can be retried later. */
export async function unlinkPushInstallation(accessToken: string): Promise<void> {
  await markPushUnlinkPending();
  await serialize(async () => {
    const installationId = await getOrCreateInstallationId();
    const response = validateResponse(
      await api.unlinkPushInstallation(installationId, accessToken),
      installationId,
    );
    if (response.profile_id !== null || response.audience !== 'guest') {
      throw new Error('Push installation was not unlinked');
    }
    await clearPushUnlinkPending();
  });
}

/**
 * Starts the sole FCM token-refresh and foreground reconciliation listeners.
 * The returned cleanup must be called when the application root unmounts.
 */
export async function startPushInstallationService(): Promise<() => void> {
  if (started) return () => undefined;
  started = true;
  stopped = false;

  try {
    await notifee.requestPermission();
  } catch (error) {
    console.log('[PushInstallation] permission request failed', {
      message: error instanceof Error ? error.message : 'unknown_error',
    });
  }

  const unsubscribeTokenRefresh = messaging().onTokenRefresh(newToken => {
    reconcilePushInstallation(undefined, newToken).catch(() => undefined);
  });
  const appStateSubscription = AppState.addEventListener('change', nextState => {
    if (nextState !== 'active') return;

    notifee
      .getNotificationSettings()
      .then(settings => {
        const permission = permissionName(settings.authorizationStatus);
        if (
          permission !== lastKnownPermission ||
          Date.now() - lastSuccessfulReconcileAt >=
            FOREGROUND_RECONCILE_INTERVAL_MS
        ) {
          return reconcilePushInstallation();
        }
        return undefined;
      })
      .catch(() => undefined);
  });

  reconcilePushInstallation().catch(() => undefined);

  return () => {
    stopped = true;
    started = false;
    unsubscribeTokenRefresh();
    appStateSubscription.remove();
    clearRetry();
  };
}
