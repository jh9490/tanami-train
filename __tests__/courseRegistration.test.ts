import {
  canRequestOnlineRegistration,
  canRequestCourseRegistration,
  isLiveActivity,
  registrationErrorMessage,
} from '../src/util/courseRegistration';

describe('course registration eligibility', () => {
  it.each([true, 1, '1'])('recognizes %p as a live activity', live => {
    expect(isLiveActivity(live)).toBe(true);
  });

  it.each([false, 0, '0', null, undefined])(
    'does not recognize %p as a live activity',
    live => {
      expect(isLiveActivity(live)).toBe(false);
    },
  );

  it('allows authenticated users to request onsite registration for any open activity', () => {
    expect(canRequestCourseRegistration(true, 1)).toBe(true);
    expect(canRequestCourseRegistration(true, 0)).toBe(true);
    expect(canRequestCourseRegistration(false, 1)).toBe(false);
  });

  it('allows online registration only for live activities', () => {
    expect(canRequestOnlineRegistration(true)).toBe(true);
    expect(canRequestOnlineRegistration(1)).toBe(true);
    expect(canRequestOnlineRegistration(false)).toBe(false);
    expect(canRequestOnlineRegistration(0)).toBe(false);
  });

  it.each([
    ['activity_not_found', 'لم يعد هذا النشاط متاحًا.'],
    ['activity_not_open_for_registration', 'هذا النشاط غير مفتوح للتسجيل حاليًا.'],
    ['online_registration_unavailable', 'التسجيل أونلاين غير متاح لهذا النشاط. اختر الحضور المباشر.'],
    ['activity_id_required', 'تعذر إرسال الطلب بسبب خطأ في بيانات النشاط.'],
    ['unauthorized', 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجددًا.'],
  ])('maps %s to an Arabic validation message', (code, expected) => {
    expect(registrationErrorMessage(new Error(code))).toBe(expected);
  });
});
