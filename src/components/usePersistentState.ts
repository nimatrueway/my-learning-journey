import {useCallback, useEffect, useState, type Dispatch, type SetStateAction} from 'react';

/** Client-side state backed by localStorage, with an SSR-safe default value. */
export default function usePersistentState<T>(
  key: string,
  defaultValue: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return;
      const parsed: unknown = JSON.parse(stored);
      if (isValid(parsed)) setValue(parsed);
    } catch {
      // Keep the default when storage is unavailable or malformed.
    }
  }, [isValid, key]);

  const setPersistentValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setValue((current) => {
      const resolved = typeof next === 'function'
        ? (next as (previous: T) => T)(current)
        : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // State still works for this session when storage is unavailable.
      }
      return resolved;
    });
  }, [key]);

  return [value, setPersistentValue];
}
