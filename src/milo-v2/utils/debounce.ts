/**
 * Debounces a function execution.
 */
export function debounce<A extends any[], R>(
  fn: (...args: A) => R,
  delayMs: number
): (...args: A) => void {
  let timer: any = null;

  return (...args: A) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delayMs);
  };
}
