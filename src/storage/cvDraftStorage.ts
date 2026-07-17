import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CVBilingualDraft, CVStoredDraftSnapshot } from '../services/cvTypes';

const CV_DRAFT_PREFIX = 'cv_bilingual_draft';

function buildDraftStorageKey(profileId?: number | null, userId?: number | null): string | null {
  if (profileId != null) {
    return `${CV_DRAFT_PREFIX}:profile:${profileId}`;
  }

  if (userId != null) {
    return `${CV_DRAFT_PREFIX}:user:${userId}`;
  }

  return null;
}

export async function loadStoredCVDraft(
  profileId?: number | null,
  userId?: number | null,
): Promise<CVStoredDraftSnapshot | null> {
  const key = buildDraftStorageKey(profileId, userId);
  if (!key) {
    return null;
  }

  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CVStoredDraftSnapshot;
  } catch (error) {
    console.error('Failed to parse stored CV draft snapshot:', error);
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function saveStoredCVDraft(
  draft: CVBilingualDraft,
  profileId?: number | null,
  userId?: number | null,
): Promise<void> {
  const key = buildDraftStorageKey(profileId, userId);
  if (!key) {
    return;
  }

  const snapshot: CVStoredDraftSnapshot = {
    profileId: profileId ?? null,
    userId: userId ?? null,
    savedAt: new Date().toISOString(),
    draft,
  };

  await AsyncStorage.setItem(key, JSON.stringify(snapshot));
}

export async function clearStoredCVDraft(
  profileId?: number | null,
  userId?: number | null,
): Promise<void> {
  const key = buildDraftStorageKey(profileId, userId);
  if (!key) {
    return;
  }

  await AsyncStorage.removeItem(key);
}
