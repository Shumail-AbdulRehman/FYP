export const KARACHI_TIMEZONE = "Asia/Karachi";

const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;

export const addUtcDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const getStartOfKarachiDay = (date: Date) => {
  const shifted = new Date(date.getTime() + KARACHI_OFFSET_MS);

  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      0,
      0,
      0,
      0,
    ) - KARACHI_OFFSET_MS,
  );
};

export const getKarachiDayRange = (date: Date = new Date()) => {
  const start = getStartOfKarachiDay(date);
  return {
    start,
    end: addUtcDays(start, 1),
  };
};

export const getUtcClockMinutes = (date: Date) =>
  date.getUTCHours() * 60 + date.getUTCMinutes();

export const withUtcClockOnBaseDate = (baseDate: Date, timeSource: Date) => {
  const result = new Date(baseDate);
  result.setUTCHours(
    timeSource.getUTCHours(),
    timeSource.getUTCMinutes(),
    timeSource.getUTCSeconds(),
    0,
  );
  return result;
};

export const resolveAttendanceWindow = ({
  baseDate,
  shiftStart,
  shiftEnd,
}: {
  baseDate: Date;
  shiftStart: Date;
  shiftEnd: Date;
}) => {
  const expectedStart = withUtcClockOnBaseDate(baseDate, shiftStart);
  const expectedEnd = withUtcClockOnBaseDate(baseDate, shiftEnd);

  if (expectedEnd <= expectedStart) {
    expectedEnd.setUTCDate(expectedEnd.getUTCDate() + 1);
  }

  return {
    date: new Date(baseDate),
    expectedStart,
    expectedEnd,
  };
};

export const getStartOfStoredUtcDateAsKarachiDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0) -
      KARACHI_OFFSET_MS,
  );
