import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounces a value. After the value stops changing for `delayMs`, the debounced value updates.
 * Use for search inputs to avoid heavy re-renders or API calls on every keystroke.
 * @param {*} value - The value to debounce (e.g. searchTerm)
 * @param {number} delayMs - Delay in milliseconds (e.g. 300)
 * @returns {*} - The debounced value
 */
export function useDebounce(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Returns a debounced version of a callback. The callback runs after the returned
 * function stops being called for `delayMs`. Useful for search-on-type without debouncing state.
 * @param {Function} callback - Function to debounce (e.g. setSearchTerm or fetch with query)
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function useDebouncedCallback(callback, delayMs) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}
