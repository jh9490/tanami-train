import {
  dateOnlyToPickerDate,
  pickerDateToDateOnly,
} from '../src/util/dateOnly';

describe('date-only picker conversion', () => {
  it('preserves the selected birth date without a timezone day shift', () => {
    const selected = new Date('1990-01-03T00:00:00.000Z');

    expect(pickerDateToDateOnly(selected)).toBe('1990-01-03');
  });

  it('round-trips an API date through the native picker value', () => {
    expect(pickerDateToDateOnly(dateOnlyToPickerDate('1990-01-03'))).toBe(
      '1990-01-03',
    );
  });
});
