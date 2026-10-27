import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

export const MANILA_TZ = 'Asia/Manila';

/**
 * Calculates the next 9:00 AM window in the client's local IANA timezone.
 * If the current client local time is already past 9:00 AM, schedules for tomorrow at 9:00 AM.
 * Returns ISO string in UTC.
 */
export function calculateNextClient9AM(targetIanaTz: string, baseDate = new Date()): string {
  try {
    const zonedNow = toZonedTime(baseDate, targetIanaTz);
    const targetDate = new Date(zonedNow);

    // If already past 9:00 AM in client's local time, schedule for next day
    if (zonedNow.getHours() >= 9) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetDate.setHours(9, 0, 0, 0);

    // Convert back from zoned local time to UTC date
    const utcDate = fromZonedTime(targetDate, targetIanaTz);
    return utcDate.toISOString();
  } catch (err) {
    console.error('Error calculating next 9AM for timezone', targetIanaTz, err);
    // fallback: 12 hours from now
    return new Date(baseDate.getTime() + 12 * 60 * 60 * 1000).toISOString();
  }
}

/**
 * Formats a given date/ISO string in a specific timezone
 */
export function formatInTz(dateInput: Date | string, tz: string, formatPattern = 'MMM dd, yyyy · hh:mm a'): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const zoned = toZonedTime(date, tz);
    return format(zoned, formatPattern, { timeZone: tz });
  } catch {
    return String(dateInput);
  }
}

/**
 * Gets live current time for both Manila and a client timezone with overlap status
 */
export function getLiveTimeComparison(clientTz: string) {
  const now = new Date();
  const phtZoned = toZonedTime(now, MANILA_TZ);
  const clientZoned = toZonedTime(now, clientTz);

  const phtHour = phtZoned.getHours();
  const clientHour = clientZoned.getHours();

  // Typical business hours 9am - 6pm (09 to 18)
  const isPhtBiz = phtHour >= 9 && phtHour < 18;
  const isClientBiz = clientHour >= 9 && clientHour < 18;
  const isOverlapping = isPhtBiz && isClientBiz;

  return {
    phtFormatted: format(phtZoned, 'hh:mm:ss a', { timeZone: MANILA_TZ }),
    phtDateFormatted: format(phtZoned, 'EEE, MMM d', { timeZone: MANILA_TZ }),
    clientFormatted: format(clientZoned, 'hh:mm:ss a', { timeZone: clientTz }),
    clientDateFormatted: format(clientZoned, 'EEE, MMM d', { timeZone: clientTz }),
    isPhtBiz,
    isClientBiz,
    isOverlapping,
    phtHour,
    clientHour,
  };
}
