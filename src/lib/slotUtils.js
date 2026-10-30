/**
 * IST (Asia/Kolkata) Time & Slot Utility Functions for LunchLine
 * 
 * College lunch break: 12:30 PM to 1:10 PM (40-minute break).
 * Pickup slots run every 5 minutes until last_pickup_time (1:00 PM).
 * Last pickup slot: 12:55 PM - 1:00 PM.
 * Pre-orders close 15 minutes before the break (at 12:15 PM).
 */

// Format time in 12-hour AM/PM format (e.g. "12:35 PM", "1:00 PM")
export function formatTime12(hours, minutes) {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

// Convert "HH:MM" (24h) to total minutes from midnight
export function timeStrToMinutes(timeStr) {
  if (!timeStr) return 12 * 60 + 30; // Default 12:30 PM (750 mins)
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Get the current date & time in Indian Standard Time (Asia/Kolkata)
export function getISTDate() {
  const now = new Date();
  const istDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istDateString);
}

// Get today's date formatted as YYYY-MM-DD in IST
export function getISTDateString() {
  const ist = getISTDate();
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate 5-minute pickup slots between breakStart (12:30) and lastPickupTime (13:00)
 * Produces:
 * 12:30 PM - 12:35 PM, 12:35 PM - 12:40 PM, ..., 12:55 PM - 1:00 PM
 */
export function generatePickupSlots(breakStart = '12:30', lastPickupTime = '13:00') {
  const startMinutes = timeStrToMinutes(breakStart);
  const endMinutes = timeStrToMinutes(lastPickupTime);
  const slots = [];

  for (let current = startMinutes; current < endMinutes; current += 5) {
    const next = current + 5;
    const startH = Math.floor(current / 60);
    const startM = current % 60;
    const endH = Math.floor(next / 60);
    const endM = next % 60;

    const label = `${formatTime12(startH, startM)} - ${formatTime12(endH, endM)}`;
    slots.push({
      id: label,
      label,
      startMinutes: current,
      endMinutes: next,
    });
  }

  return slots;
}

/**
 * Check if the pre-order window is closed for today.
 * Ordering closes `cutoffMinutes` before `breakStart` in IST.
 * e.g., for 12:30 PM break, cutoff is 15 mins -> closes at 12:15 PM IST.
 * Classes resume at `breakEndTime` (13:10).
 */
export function checkCutoffStatus(
  breakStart = '12:30', 
  cutoffMinutes = 15, 
  breakEnd = '13:10',
  bypassCutoff = false
) {
  if (bypassCutoff) {
    return { isClosed: false, message: 'Dev Mode: Cutoff bypassed', minutesLeft: 99 };
  }

  const ist = getISTDate();
  const currentTotalMinutes = ist.getHours() * 60 + ist.getMinutes();
  const breakStartMinutes = timeStrToMinutes(breakStart);
  const cutoffTimeMinutes = breakStartMinutes - cutoffMinutes;
  const breakEndMinutes = timeStrToMinutes(breakEnd);

  // If before cutoff time: Open
  if (currentTotalMinutes < cutoffTimeMinutes) {
    const minutesLeft = cutoffTimeMinutes - currentTotalMinutes;
    return {
      isClosed: false,
      message: `Orders open! Closes in ${minutesLeft} mins (${cutoffMinutes} mins before break)`,
      minutesLeft,
    };
  }

  // If between cutoff and classes resuming (12:15 to 13:10): Closed for today's break
  if (currentTotalMinutes >= cutoffTimeMinutes && currentTotalMinutes <= breakEndMinutes) {
    return {
      isClosed: true,
      message: `Orders closed. Pre-ordering stops ${cutoffMinutes} mins before the ${formatTime12(Math.floor(breakStartMinutes / 60), breakStartMinutes % 60)} break.`,
      minutesLeft: 0,
    };
  }

  // After classes resume for the day
  return {
    isClosed: true,
    message: `Today's lunch pre-ordering has ended. Ready for tomorrow!`,
    minutesLeft: 0,
  };
}
