import type { SafeApiErrorMetadata } from '../types/api';

export type OnboardingLocale = 'ar' | 'en';

type BilingualCopy = Record<OnboardingLocale, string>;

export const ONBOARDING_COPY = {
  neutralCodeSent: {
    ar: 'إذا كان الرقم قادرًا على استقبال الرسائل، فقد تم إرسال رمز التحقق.',
    en: 'If the phone can receive messages, a verification code has been sent.',
  },
  manualRetry: {
    ar: 'تعذر إكمال الطلب. تحقق من الاتصال ثم حاول مجددًا.',
    en: 'The request could not be completed. Check your connection and try again.',
  },
} satisfies Record<string, BilingualCopy>;

const ERROR_MESSAGES: Record<string, BilingualCopy> = {
  invalid_phone: {
    ar: 'تحقق من مفتاح الدولة ورقم الجوال ثم حاول مجددًا.',
    en: 'Check the country code and mobile number, then try again.',
  },
  rate_limited: {
    ar: 'تم الوصول إلى حد المحاولات. انتظر حتى انتهاء العدّ التنازلي.',
    en: 'Too many requests. Wait until the countdown finishes.',
  },
  temporarily_unavailable: {
    ar: ONBOARDING_COPY.manualRetry.ar,
    en: ONBOARDING_COPY.manualRetry.en,
  },
  network_error: {
    ar: ONBOARDING_COPY.manualRetry.ar,
    en: ONBOARDING_COPY.manualRetry.en,
  },
  invalid_session: {
    ar: 'انتهت جلسة التحقق. ابدأ مجددًا برقم الجوال.',
    en: 'The verification session is no longer valid. Start again with your phone number.',
  },
  invalid_code: {
    ar: 'رمز التحقق غير صحيح.',
    en: 'The verification code is incorrect.',
  },
  expired_code: {
    ar: 'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا أو ابدأ مجددًا.',
    en: 'The verification code expired. Request another code or start again.',
  },
  too_many_attempts: {
    ar: 'تم الوصول إلى الحد الأقصى لمحاولات التحقق.',
    en: 'The maximum number of verification attempts has been reached.',
  },
  verification_required: {
    ar: 'يجب التحقق من رقم الجوال مجددًا قبل إكمال الحساب.',
    en: 'Verify the phone number again before completing the account.',
  },
  weak_password: {
    ar: 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
    en: 'The password must be at least 8 characters.',
  },
  completion_failed: {
    ar: ONBOARDING_COPY.manualRetry.ar,
    en: ONBOARDING_COPY.manualRetry.en,
  },
  unauthorized: {
    ar: 'انتهت صلاحية الجلسة. ابدأ مجددًا برقم الجوال.',
    en: 'Your session expired. Start again with your phone number.',
  },
};

const FALLBACK_MESSAGE: BilingualCopy = {
  ar: 'حدث خطأ. حاول مجددًا.',
  en: 'Something went wrong. Please try again.',
};

export function getOnboardingErrorMessage(
  errorOrCode?: string | Pick<SafeApiErrorMetadata, 'code'> | null,
  locale: OnboardingLocale = 'ar',
): string {
  const code = typeof errorOrCode === 'string' ? errorOrCode : errorOrCode?.code;
  return (code && ERROR_MESSAGES[code]?.[locale]) || FALLBACK_MESSAGE[locale];
}

export function getAttemptsRemainingMessage(
  attemptsRemaining: number,
  locale: OnboardingLocale = 'ar',
): string {
  const attempts = Math.max(0, Math.floor(attemptsRemaining));
  return locale === 'ar'
    ? `المحاولات المتبقية: ${attempts}`
    : `Attempts remaining: ${attempts}`;
}

export function getRetryCountdownMessage(
  secondsRemaining: number,
  locale: OnboardingLocale = 'ar',
): string {
  const seconds = Math.max(0, Math.ceil(secondsRemaining));
  return locale === 'ar'
    ? `يمكنك المحاولة بعد ${seconds} ثانية.`
    : `You can try again in ${seconds} seconds.`;
}
