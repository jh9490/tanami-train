export type ActivityType = 'course' | 'initiative';
export type PricingLocale = 'ar' | 'en';

export type ActivityPricing = {
  activityType: ActivityType;
  activityFee: number | null;
  certificateFee: number | null;
};

export const normalizeActivityType = (value: unknown): ActivityType =>
  typeof value === 'string' && value.toLowerCase() === 'initiative'
    ? 'initiative'
    : 'course';

export const normalizeFee = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const fee = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(fee) ? fee : null;
};

export const formatFee = (value: number | null, locale: PricingLocale = 'ar'): string =>
  value === null ? '—' : new Intl.NumberFormat(locale === 'ar' ? 'en-US' : 'en').format(value);

export const getPricingLabels = (locale: PricingLocale = 'ar') =>
  locale === 'ar'
    ? {
        course: 'دورة',
        initiative: 'مبادرة',
        activityType: 'نوع النشاط',
        activityFee: 'رسوم التسجيل',
        certificateFee: 'رسوم الشهادة',
        separatePayment: 'يمكنك حضور المبادرة مجاناً، ويتم دفع رسوم الشهادة لاحقاً عند طلبها.',
        paidAttendance:
          'رسوم الشهادة منفصلة واختيارية، وليست ضمن مبلغ التسجيل أو شرطاً لحضور المبادرة.',
      }
    : {
        course: 'Course',
        initiative: 'Initiative',
        activityType: 'Activity type',
        activityFee: 'Registration fee',
        certificateFee: 'Certificate fee',
        separatePayment: 'You can attend the initiative for free. The certificate is paid for later if requested.',
        paidAttendance:
          'The certificate fee is separate and optional. It is not included in registration or required to attend.',
      };

export const buildRegistrationPricingMessage = (
  pricing: ActivityPricing,
  locale: PricingLocale = 'ar',
): string => {
  const labels = getPricingLabels(locale);
  const lines = [`${labels.activityFee}: ${formatFee(pricing.activityFee, locale)}`];

  if (pricing.activityType === 'initiative') {
    lines.push(`${labels.certificateFee}: ${formatFee(pricing.certificateFee, locale)}`);
    lines.push(pricing.activityFee === 0 ? labels.separatePayment : labels.paidAttendance);
  }

  return lines.join('\n');
};
