import { useEffect, useState } from "react";
/**
 * useState that is saved to localStorage, so the value survives a page refresh.
 * Usage: const [cart, setCart] = useLocalStorage("bn-cart", []);
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked (private mode): the app keeps working in memory
    }
  }, [key, value]);
  return [value, setValue];
}