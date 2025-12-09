import * as path from 'path';
import { ValidationError } from './errors';

/**
 * Validate file path for security
 * Prevents path traversal attacks and ensures absolute paths
 */
export function isValidPath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  const normalized = path.normalize(filePath);
  
  // Check for path traversal attempts
  if (normalized.includes('..')) {
    return false;
  }
  
  // Ensure path is absolute
  if (!path.isAbsolute(normalized)) {
    return false;
  }
  
  return true;
}

/**
 * Validate and sanitize file path
 * Throws ValidationError if path is invalid
 */
export function validatePath(filePath: string, fieldName = 'filePath'): string {
  if (!isValidPath(filePath)) {
    throw new ValidationError(`Invalid ${fieldName}: Path must be absolute and not contain traversal sequences`, fieldName);
  }
  
  return path.normalize(filePath);
}

/**
 * Check if path is within allowed directories
 */
export function isPathInDirectory(filePath: string, allowedDir: string): boolean {
  const normalizedPath = path.normalize(filePath);
  const normalizedDir = path.normalize(allowedDir);
  
  return normalizedPath.startsWith(normalizedDir);
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
