export const isLiveActivity = (value: unknown): boolean =>
  value === true || value === 1 || value === '1';

export const canRequestCourseRegistration = (
  isAuthenticated: boolean,
  live: unknown,
): boolean => isAuthenticated && isLiveActivity(live);
