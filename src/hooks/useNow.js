import { useEffect, useState } from "react";
/**
 * Current time that refreshes every `intervalMs`. Drives live order tracking.
 * The interval is cleared when the component unmounts (no memory leak).
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

