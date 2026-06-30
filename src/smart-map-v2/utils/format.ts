/**
 * Formats a distance in kilometers into a clean, readable string.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Formats a duration in minutes into a clean, readable string (e.g., "1h 15m" or "45 min").
 */
export function formatDuration(mins: number): string {
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Calculates a leave-by time based on a travel duration in minutes.
 */
export function calculateLeaveTime(durationMin: number): string {
  const now = new Date();
  const leaveTime = new Date(now.getTime() - durationMin * 60 * 1000);
  return leaveTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
