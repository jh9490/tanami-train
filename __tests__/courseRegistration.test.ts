import {
  canRequestCourseRegistration,
  isLiveActivity,
} from '../src/util/courseRegistration';

describe('course registration eligibility', () => {
  it.each([true, 1, '1'])('recognizes %p as a live activity', live => {
    expect(isLiveActivity(live)).toBe(true);
  });

  it.each([false, 0, '0', null, undefined])(
    'does not recognize %p as a live activity',
    live => {
      expect(isLiveActivity(live)).toBe(false);
    },
  );

  it('allows only authenticated users to register for live activities', () => {
    expect(canRequestCourseRegistration(true, 1)).toBe(true);
    expect(canRequestCourseRegistration(true, 0)).toBe(false);
    expect(canRequestCourseRegistration(false, 1)).toBe(false);
  });
});
