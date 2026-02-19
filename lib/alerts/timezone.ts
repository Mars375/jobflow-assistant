const DEFAULT_TIMEZONE = 'Europe/Paris';

export function detectTimezone(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TIMEZONE;
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function getDigestTargetTime(timezone: string): Date {
  const now = new Date();

  let nowInTz: Date;
  try {
    nowInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  } catch {
    nowInTz = new Date(now.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
  }

  const targetInTz = new Date(nowInTz);
  targetInTz.setHours(8, 0, 0, 0);

  const diffMs = targetInTz.getTime() - nowInTz.getTime();
  return new Date(now.getTime() + diffMs);
}

export function isDigestTooLate(scheduledTime: Date): boolean {
  const now = new Date();
  const hoursLate = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
  return hoursLate > 12;
}
