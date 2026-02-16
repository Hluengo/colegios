import { useEffect, useState } from 'react';

function readStoredValue<T>(key: string, initialValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return initialValue;
    return JSON.parse(raw);
  } catch {
    return initialValue;
  }
}

export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue));

  useEffect(() => {
    setValue(readStoredValue(key, initialValue));
  }, [key, initialValue]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  }, [key, value]);

  return [value, setValue];
}

export default usePersistedState;
