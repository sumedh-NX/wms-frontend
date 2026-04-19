// src/hooks/useIdleTimer.tsx
import { useEffect, useRef } from 'react';

/**
 * Calls `onIdle` after `timeoutMs` milliseconds of **no** user activity.
 *
 * Usage (inside a component):
 *   useIdleTimer(() => {
 *     // place your logout logic here
 *   }, 10 * 60 * 1000);   // 10 minutes
 *
 * @param onIdle   Function executed when the user has been idle.
 * @param timeoutMs   Milliseconds of inactivity before `onIdle` fires.
 */
export const useIdleTimer = (onIdle: () => void, timeoutMs: number) => {
  // In the browser, setTimeout returns a number.
  // ReturnType<typeof setTimeout> resolves to that number (or NodeJS.Timeout
  // when compiled for a Node environment). This works for both cases.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the timer – clears any existing timeout then starts a new one.
  const resetTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onIdle, timeoutMs);
  };

  useEffect(() => {
    // Activity events that should reset the idle timer
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

    // Attach resetTimer to each event
    events.forEach(ev => window.addEventListener(ev, resetTimer));

    // Start the first timer when the component mounts
    resetTimer();

    // Cleanup: remove listeners and clear the timer when component unmounts
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []); // Empty dependency array → run once on mount
};
