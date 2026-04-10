export type OtpDeliveryMethod = 'telegram' | 'sms';

export type OtpFlowContext = 'signup' | 'signin' | 'reset';

export const OTP_PROXY_TOPIC = 'otp_proxy';

export const OTP_DELIVERY_OPTIONS: Array<{
  key: OtpDeliveryMethod;
  title: string;
  description: string;
}> = [
  {
    key: 'telegram',
    title: 'تيليجرام',
    description: 'استلام رمز التحقق عبر تيليجرام.',
  },
  {
    key: 'sms',
    title: 'رسالة نصية',
    description: 'استلام رمز التحقق عبر رسالة نصية.',
  },
];

export function getOtpDeliveryTitle(method: OtpDeliveryMethod) {
  return method === 'sms' ? 'رسالة نصية' : 'تيليجرام';
}

export function getOtpDeliveryActionLabel(method: OtpDeliveryMethod, context: OtpFlowContext) {
  if (context === 'reset') {
    return method === 'sms' ? 'إرسال الرمز عبر رسالة نصية' : 'إرسال الرمز عبر تيليجرام';
  }

  return method === 'sms' ? 'إرسال رمز التحقق عبر رسالة نصية' : 'إرسال رمز التحقق عبر تيليجرام';
}

export function getOtpDeliverySuccessMessage(
  method: OtpDeliveryMethod,
  context: OtpFlowContext,
) {
  if (context === 'reset') {
    return method === 'sms'
      ? 'تم إرسال رمز استعادة كلمة المرور عبر رسالة نصية.'
      : 'تم إرسال رمز استعادة كلمة المرور عبر تيليجرام.';
  }

  return method === 'sms'
    ? 'تم إرسال رمز التحقق عبر رسالة نصية.'
    : 'تم إرسال رمز التحقق عبر تيليجرام.';
}

export function getOtpDeliveryHint(method: OtpDeliveryMethod, maskedMobile: string) {
  return method === 'sms'
    ? `سيصل رمز التحقق إلى الرقم ${maskedMobile} عبر رسالة نصية.`
    : `سيصل رمز التحقق إلى حساب تيليجرام المرتبط بالرقم ${maskedMobile}.`;
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
    case 'rate_limited':
      return 'يرجى الانتظار قليلًا قبل إعادة الإرسال.';
    case 'fullname_required':
      return 'الاسم الكامل مطلوب.';
    case 'telegram_not_linked':
      return 'هذا الرقم غير مرتبط بتيليجرام.';
    case 'otp_delivery_method_invalid':
      return 'طريقة استلام الرمز غير مدعومة.';
    case 'sms_delivery_unavailable':
      return 'خدمة الرسائل النصية غير متاحة حالياً.';
    case 'proxy_notification_failed':
    case 'sms_proxy_send_failed':
      return 'تعذر تجهيز إرسال الرمز عبر تطبيق البروكسي.';
    default:
      return code && code.trim() ? code : 'حدث خطأ. حاول مجددًا.';
  }
}

export function isNotVerifiedError(code?: string) {
  return code === 'not_verified';
}
