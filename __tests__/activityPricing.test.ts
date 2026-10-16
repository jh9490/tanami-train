import {
  buildRegistrationPricingMessage,
  getPricingLabels,
  normalizeActivityType,
  normalizeFee,
} from '../src/util/activityPricing';

describe('activity pricing', () => {
  it('uses the stable initiative string and treats missing legacy fields as a course', () => {
    expect(normalizeActivityType('initiative')).toBe('initiative');
    expect(normalizeActivityType('INITIATIVE')).toBe('initiative');
    expect(normalizeActivityType(undefined)).toBe('course');
    expect(normalizeActivityType(2)).toBe('course');
    expect(normalizeActivityType(undefined, 2)).toBe('initiative');
    expect(normalizeActivityType('course', 1)).toBe('course');
  });

  it('handles missing and numeric API fees safely', () => {
    expect(normalizeFee(null)).toBeNull();
    expect(normalizeFee(undefined)).toBeNull();
    expect(normalizeFee('2000')).toBe(2000);
    expect(normalizeFee('invalid')).toBeNull();
  });

  it('separates initiative attendance and certificate fees', () => {
    const message = buildRegistrationPricingMessage({
      activityType: 'initiative',
      activityFee: 0,
      certificateFee: 2000,
    });

    expect(message).toContain('رسوم التسجيل: 0');
    expect(message).toContain('رسوم الشهادة: 2,000');
    expect(message).toContain('يتم دفع رسوم الشهادة لاحقاً');
  });

  it('does not mention a certificate fee for a normal course', () => {
    const message = buildRegistrationPricingMessage({
      activityType: 'course',
      activityFee: 3000,
      certificateFee: null,
    });

    expect(message).toContain('رسوم التسجيل');
    expect(message).not.toContain('رسوم الشهادة');
  });

  it('hides certificate pricing guidance when an initiative certificate is not selected', () => {
    const message = buildRegistrationPricingMessage({
      activityType: 'initiative',
      activityFee: 0,
      certificateFee: 2000,
      certificateRequested: false,
    });

    expect(message).toBe('رسوم التسجيل: 0');
    expect(message).not.toContain('رسوم الشهادة');
    expect(message).not.toContain(getPricingLabels('ar').separatePayment);
  });

  it('provides English pricing labels and guidance', () => {
    expect(getPricingLabels('en')).toMatchObject({
      activityFee: 'Registration fee',
      certificateFee: 'Certificate fee',
    });
    expect(
      buildRegistrationPricingMessage(
        { activityType: 'initiative', activityFee: 0, certificateFee: null },
        'en',
      ),
    ).toContain('The certificate is paid for later');
  });
});
