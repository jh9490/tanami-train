import {buildSeparatedPhone} from '../src/util/phone';

describe('buildSeparatedPhone', () => {
  it('keeps the country code separate from a local mobile number', () => {
    expect(buildSeparatedPhone('+971', '0501234567')).toEqual({
      country_code: '971',
      mobile_number: '501234567',
    });
  });

  it('defensively removes an accidentally included country code', () => {
    expect(buildSeparatedPhone('971', '+971501234567')).toEqual({
      country_code: '971',
      mobile_number: '501234567',
    });
  });
});
