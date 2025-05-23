/**
 * Utility functions for handling localStorage operations
 * This centralizes common storage patterns used across components
 */

/**
 * Save a string value to localStorage
 * @param key The localStorage key
 * @param value The string value to save
 */
export function saveToStorage(key: string, value: string): void {
  localStorage.setItem(key, value);
}

/**
 * Load a string value from localStorage with a default fallback
 * @param key The localStorage key
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns The stored value or the default value
 */
export function loadFromStorage(key: string, defaultValue: string = ''): string {
  return localStorage.getItem(key) || defaultValue;
}

/**
 * Save an object to localStorage as JSON
 * @param key The localStorage key
 * @param value The object to save
 */
export function saveObjectToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Load an object from localStorage
 * @param key The localStorage key
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns The parsed object or the default value
 */
export function loadObjectFromStorage<T>(key: string, defaultValue: T): T {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

/**
 * Remove an item from localStorage
 * @param key The localStorage key to remove
 */
export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Save a file to localStorage by converting it to a base64 string
 * @param key The localStorage key
 * @param file The file to save
 */
export function saveFileToStorage(key: string, file: File | null): void {
  if (!file) {
    removeFromStorage(key);
    return;
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    saveObjectToStorage(key, {
      name: file.name,
      type: file.type,
      data: reader.result,
    });
  };
  reader.readAsDataURL(file);
}

/**
 * Load a file from localStorage
 * @param key The localStorage key
 * @returns The file object or null if not found
 */
export function loadFileFromStorage(key: string): File | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    const { name, type, data } = JSON.parse(stored);
    if (!data) return null;
    
    const arr = data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || type;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    
    return new File([u8arr], name, { type: mime });
  } catch {
    return null;
  }
}
