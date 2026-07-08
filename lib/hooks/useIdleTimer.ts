"use strict";

import { useEffect, useRef, useState } from "react";

/**
 * Hook to detect user idleness.
 * @param timeout - Timeout in milliseconds (default: 3 minutes)
 */
export function useIdleTimer(timeout = 3 * 60 * 1000) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    setIsIdle(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setIsIdle(true), timeout);
  };

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    const handleEvent = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleEvent);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [timeout]);

  return { isIdle, resetTimer };
}
