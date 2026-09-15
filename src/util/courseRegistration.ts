export const isLiveActivity = (value: unknown): boolean =>
  value === true || value === 1 || value === '1';

export const canRequestCourseRegistration = (
  isAuthenticated: boolean,
  _live?: unknown,
): boolean => isAuthenticated;

export const canRequestOnlineRegistration = (live: unknown): boolean =>
  isLiveActivity(live);

const REGISTRATION_ERROR_MESSAGES: Record<string, string> = {
  activity_not_found: 'لم يعد هذا النشاط متاحًا.',
  activity_not_open_for_registration: 'هذا النشاط غير مفتوح للتسجيل حاليًا.',
  online_registration_unavailable: 'التسجيل أونلاين غير متاح لهذا النشاط. اختر الحضور المباشر.',
  activity_id_required: 'تعذر إرسال الطلب بسبب خطأ في بيانات النشاط.',
  unauthorized: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجددًا.',
};

export const registrationErrorMessage = (error: unknown): string => {
  const code =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
        : '';
  return REGISTRATION_ERROR_MESSAGES[code] || 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.';
};
