const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isDateOnly = (value: string) => DATE_ONLY_PATTERN.test(value);

/**
 * Date-only profile values do not represent an instant in time. Keeping the
 * picker value in UTC prevents the selected calendar day from moving when the
 * device or native picker applies a timezone offset.
 */
export const dateOnlyToPickerDate = (value?: string | null) => {
  if (!value || !isDateOnly(value)) return new Date(Date.UTC(2000, 0, 1));

  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const pickerDateToDateOnly = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayAsUtcCalendarDate = () => {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
};
