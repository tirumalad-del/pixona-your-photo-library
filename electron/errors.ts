/**
 * Custom error types for PIXONA application
 * Provides better error handling and debugging
 */

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class FileAccessError extends Error {
  constructor(message: string, public filePath?: string) {
    super(message);
    this.name = 'FileAccessError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class PhotoScanError extends Error {
  constructor(message: string, public directoryPath?: string) {
    super(message);
    this.name = 'PhotoScanError';
  }
}

export class ExifExtractionError extends Error {
  constructor(message: string, public filePath?: string) {
    super(message);
    this.name = 'ExifExtractionError';
  }
}
