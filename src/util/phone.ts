export const digitsOnly = (s: string) => (s || '').replace(/\D+/g, '');

/** Remove exactly one leading 0 (common in GCC mobiles like 05…/07…/01…) */
export const stripLeadingZero = (s: string) => s.replace(/^0(?=\d)/, '');

/** Build +<country><national-no-leading-0> */
export const buildE164 = (dial: string, national: string) => {
  const d = digitsOnly(dial);
  const n = stripLeadingZero(digitsOnly(national));
  return `+${d}${n}`;
};