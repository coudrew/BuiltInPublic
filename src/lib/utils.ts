import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSafeNextPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  if (path.includes('..')) return false;
  return true;
}

/**
 * Truncates text to a maximum length and adds an ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 140)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength = 140): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}
