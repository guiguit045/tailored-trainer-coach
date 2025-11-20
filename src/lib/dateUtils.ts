import { format, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Returns the "effective date" for the app.
 * The day changes at 4 AM Brasilia time (UTC-3).
 * If current time is before 4 AM, returns previous day.
 * Otherwise returns current day.
 */
export function getEffectiveDate(): string {
  const timeZone = 'America/Sao_Paulo';
  const now = new Date();
  const brasiliaTime = toZonedTime(now, timeZone);
  
  const hours = brasiliaTime.getHours();
  
  // If it's before 4 AM, use previous day
  if (hours < 4) {
    const previousDay = subDays(brasiliaTime, 1);
    return format(previousDay, 'yyyy-MM-dd');
  }
  
  return format(brasiliaTime, 'yyyy-MM-dd');
}
