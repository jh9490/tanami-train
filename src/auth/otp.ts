export type OtpDeliveryMethod = 'telegram' | 'sms' | 'whatsapp';

export type OtpFlowContext = 'signup' | 'signin' | 'reset';

export const OTP_DELIVERY_OPTIONS: Array<{
  key: OtpDeliveryMethod;
  title: string;
  description: string;
}> = [
  {
    key: 'whatsapp',
    title: 'واتساب',
    description: 'استلام رمز التحقق عبر واتساب.',
  },
];

export function getOtpDeliveryTitle(_method: OtpDeliveryMethod) {
  return 'واتساب';
}

export function getOtpDeliveryActionLabel(_method: OtpDeliveryMethod, context: OtpFlowContext) {
  if (context === 'reset') {
    return 'إرسال الرمز عبر واتساب';
  }

  return 'إرسال رمز التحقق عبر واتساب';
}

export function getOtpDeliverySuccessMessage(
  _method: OtpDeliveryMethod,
  context: OtpFlowContext,
) {
  if (context === 'reset') {
    return 'تم إرسال رمز استعادة كلمة المرور عبر واتساب.';
  }

  return 'تم إرسال رمز التحقق عبر واتساب.';
}

export function getOtpDeliveryHint(_method: OtpDeliveryMethod, maskedMobile: string) {
  return `سيصل رمز التحقق إلى الرقم ${maskedMobile} عبر واتساب.`;
}

export function mapAuthError(code?: string) {
  switch (code) {
    case 'mobile_and_password_required':
      return 'الرجاء إدخال الجوال وكلمة المرور.';
    case 'mobile_already_registered':
      return 'رقم الجوال مسجّل مسبقًا.';
    case 'email_already_registered':
      return 'البريد الإلكتروني مسجّل مسبقًا.';
    case 'invalid_credentials':
      return 'بيانات الدخول غير صحيحة.';
    case 'not_verified':
      return 'الحساب غير مفعّل. يمكنك طلب رمز التحقق وإكمال التفعيل.';
    case 'otp_incorrect':
      return 'رمز التحقق غير صحيح.';
    case 'otp_expired':
      return 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.';
    case 'fullname_required':
      return 'الاسم الكامل مطلوب.';
    case 'invalid_phone_format':
      return 'صيغة رقم الجوال غير صحيحة. استخدم رقمًا بصيغة دولية مثل +971501234567.';
    case 'user_not_found':
      return 'لم يتم العثور على مستخدم بهذا الرقم.';
    case 'profile_not_found':
      return 'لم يتم العثور على ملف مرتبط بهذا الرقم.';
    case 'too_many_requests':
    case 'rate_limited':
      return 'يرجى الانتظار قليلًا قبل إعادة الإرسال.';
    case 'lightotp_api_key_missing':
      return 'خدمة إرسال رمز واتساب غير مهيأة حالياً.';
    case 'lightotp_send_failed':
      return 'تعذر إرسال رمز التحقق عبر واتساب. حاول مجددًا.';
    case 'telegram_not_linked':
      return 'لم تعد طريقة تيليجرام مستخدمة. اطلب الرمز عبر واتساب.';
    case 'otp_delivery_method_invalid':
      return 'طريقة استلام الرمز غير مدعومة.';
    case 'sms_delivery_unavailable':
      return 'لم تعد خدمة الرسائل النصية مستخدمة. اطلب الرمز عبر واتساب.';
    case 'proxy_notification_failed':
    case 'sms_proxy_send_failed':
      return 'لم تعد طريقة إرسال الرمز السابقة مستخدمة. اطلب الرمز عبر واتساب.';
    default:
      return code && code.trim() ? code : 'حدث خطأ. حاول مجددًا.';
  }
}

export function isNotVerifiedError(code?: string) {
  return code === 'not_verified';
}
