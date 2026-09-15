import {
  getOnboardingEntryRoute,
  isPhoneOnboardingV2Eligible,
} from '../src/constants/onboarding';

describe('phone onboarding rollout navigation', () => {
  it('routes an eligible release to phone-first onboarding', () => {
    expect(isPhoneOnboardingV2Eligible('1.0.11', true)).toBe(true);
    expect(getOnboardingEntryRoute('1.0.11', true)).toBe('PhoneOnboarding');
  });

  it('keeps legacy signup when the flag is disabled', () => {
    expect(getOnboardingEntryRoute('9.0.0', false)).toBe('SignUp');
  });

  it('keeps legacy signup below the minimum app version', () => {
    expect(getOnboardingEntryRoute('1.0.10', true)).toBe('SignUp');
  });

  it('accepts later semantic versions', () => {
    expect(getOnboardingEntryRoute('1.1.0', true)).toBe('PhoneOnboarding');
    expect(getOnboardingEntryRoute('2.0.0', true)).toBe('PhoneOnboarding');
  });
});
