// =============================================================
// useLocalStorage.js – Custom hook to sync state with localStorage
// =============================================================
import { useState, useEffect } from 'react';

/**
 * A custom hook that works like useState but persists
 * the value to localStorage under the given key.
 *
 * @param {string} key        - The localStorage key
 * @param {*}      initialValue - The initial/default value
 * @returns {[any, Function]} - [storedValue, setValue]
 */
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: error reading key "${key}"`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`useLocalStorage: error writing key "${key}"`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
