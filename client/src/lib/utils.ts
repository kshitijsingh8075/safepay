import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind classes with conditional logic support
 * @param inputs Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds into MM:SS format
 * @param seconds Number of seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format an amount as Indian currency (₹)
 * 
 * @param value The amount to format
 * @returns Formatted amount with currency symbol
 */
export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '₹0.00';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

/**
 * Generates a transaction ID with a given prefix
 * 
 * @param prefix Prefix for the transaction ID
 * @returns A transaction ID
 */
export function generateTransactionId(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString().substring(7);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${timestamp}${random}`;
}

/**
 * Format a date as a readable string
 * 
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Safely parses URL search parameters
 * 
 * @param url The URL string to parse
 * @returns URLSearchParams object
 */
export function parseUrlParams(url: string): URLSearchParams {
  try {
    const queryString = url.split('?')[1] || '';
    return new URLSearchParams(queryString);
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return new URLSearchParams();
  }
}

/**
 * Safely get a local storage item and parse as JSON
 * 
 * @param key Local storage key
 * @param defaultValue Default value if key doesn't exist or parse fails
 * @returns Parsed value or default value
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safely set a local storage item
 * 
 * @param key Local storage key
 * @param value Value to store
 */
export function setLocalStorageItem(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}