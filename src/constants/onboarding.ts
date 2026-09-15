/**
 * Local rollout gate for the phone-first onboarding release.
 *
 * The release version is passed into the eligibility helper by navigation so
 * this module stays independent from a native device-info dependency.
 */
export const PHONE_ONBOARDING_V2_ENABLED = true;
export const PHONE_ONBOARDING_V2_MIN_APP_VERSION = '1.0.11';
export const PHONE_ONBOARDING_APP_VERSION = '1.0.11';

/** Canonical notification payload value sent after history-link changes. */
export const HISTORY_LINK_STATUS_CHANGED_EVENT = 'history_link_status_changed';

const numericVersion = (version: string): number[] =>
  version
    .trim()
    .replace(/^v/i, '')
    .split(/[.+-]/, 3)
    .map(part => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) ? value : 0;
    });

export function isPhoneOnboardingV2Eligible(
  appVersion: string,
  enabled = PHONE_ONBOARDING_V2_ENABLED,
): boolean {
  if (!enabled || !appVersion.trim()) return false;

  const current = numericVersion(appVersion);
  const minimum = numericVersion(PHONE_ONBOARDING_V2_MIN_APP_VERSION);
  const length = Math.max(current.length, minimum.length);

  for (let index = 0; index < length; index += 1) {
    const currentPart = current[index] ?? 0;
    const minimumPart = minimum[index] ?? 0;
    if (currentPart !== minimumPart) return currentPart > minimumPart;
  }

  return true;
}

export function getOnboardingEntryRoute(
  appVersion = PHONE_ONBOARDING_APP_VERSION,
  enabled = PHONE_ONBOARDING_V2_ENABLED,
): 'PhoneOnboarding' | 'SignUp' {
  return isPhoneOnboardingV2Eligible(appVersion, enabled)
    ? 'PhoneOnboarding'
    : 'SignUp';
}
