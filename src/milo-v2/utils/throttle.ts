/**
 * Throttles a function execution.
 */
export function throttle<A extends any[], R>(
  fn: (...args: A) => R,
  limitMs: number
): (...args: A) => void {
  let inThrottle = false;

  return (...args: A) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}
