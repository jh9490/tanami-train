export const digitsOnly = (s: string) => (s || '').replace(/\D+/g, '');

/** Remove exactly one leading 0 (common in GCC mobiles like 05…/07…/01…) */
export const stripLeadingZero = (s: string) => s.replace(/^0(?=\d)/, '');

/** Build +<country><national-no-leading-0> */
export const buildE164 = (dial: string, national: string) => {
  const d = digitsOnly(dial);
  const n = stripLeadingZero(digitsOnly(national));
  return `+${d}${n}`;
};

/**
 * Keep the API's country code and national mobile number as separate values.
 * The defensive prefix removal prevents a country code from being duplicated
 * if a caller accidentally supplies an E.164/full number.
 */
export const buildSeparatedPhone = (dial: string, mobile: string) => {
  const countryCode = digitsOnly(dial);
  let mobileNumber = digitsOnly(mobile);

  if (countryCode && mobileNumber.startsWith(countryCode)) {
    mobileNumber = mobileNumber.slice(countryCode.length);
  }

  return {
    country_code: countryCode,
    mobile_number: stripLeadingZero(mobileNumber),
  };
};
