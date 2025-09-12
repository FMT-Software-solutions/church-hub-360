import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for syncing state with localStorage
 * @param key - The localStorage key
 * @param initialValue - The initial value if no stored value exists
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage and reset to initial value
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for boolean localStorage values with additional toggle functionality
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false
): [boolean, (value: boolean | ((val: boolean) => boolean)) => void, () => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);
  
  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, [setValue]);

  return [value, setValue, removeValue, toggle];
}

/**
 * Hook for string localStorage values with validation
 */
export function useLocalStorageString(
  key: string,
  initialValue: string = '',
  validator?: (value: string) => boolean
): [string, (value: string | ((val: string) => string)) => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);
  
  const setValidatedValue = useCallback(
    (newValue: string | ((val: string) => string)) => {
      const valueToValidate = newValue instanceof Function ? newValue(value) : newValue;
      
      if (validator && !validator(valueToValidate)) {
        console.warn(`Invalid value for localStorage key "${key}":`, valueToValidate);
        return;
      }
      
      setValue(valueToValidate);
    },
    [key, value, setValue, validator]
  );

  return [value, setValidatedValue, removeValue];
}