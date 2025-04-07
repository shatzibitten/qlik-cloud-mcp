/**
 * Utility functions for the application
 */

/**
 * Parse boolean value from string
 * @param value The string value
 * @param defaultValue The default value if parsing fails
 * @returns The parsed boolean value
 */
export function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
}

/**
 * Parse number value from string
 * @param value The string value
 * @param defaultValue The default value if parsing fails
 * @returns The parsed number value
 */
export function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse array value from comma-separated string
 * @param value The string value
 * @param defaultValue The default value if parsing fails
 * @returns The parsed array value
 */
export function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  
  return value.split(',').map(item => item.trim());
}

/**
 * Format date to ISO string
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Generate a random string
 * @param length The length of the string
 * @returns The random string
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Deep merge two objects
 * @param target The target object
 * @param source The source object
 * @returns The merged object
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key as keyof typeof source])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof typeof source] });
        } else {
          (output as any)[key] = deepMerge((target as any)[key], (source as any)[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof typeof source] });
      }
    });
  }
  
  return output;
}

/**
 * Check if a value is an object
 * @param item The value to check
 * @returns Boolean indicating if the value is an object
 */
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Omit properties from an object
 * @param obj The object
 * @param keys The keys to omit
 * @returns The object without the omitted properties
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * Pick properties from an object
 * @param obj The object
 * @param keys The keys to pick
 * @returns The object with only the picked properties
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}
