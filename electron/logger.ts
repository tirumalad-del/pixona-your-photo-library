import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

// Create logs directory
const logsDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logPath = path.join(logsDir, 'app.log');

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

/**
 * Log a message to file and console
 */
export function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = { timestamp, level, message, data };
  
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
  
  // Append to log file
  try {
    fs.appendFileSync(logPath, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
  
  // Also log to console
  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '');
}

/**
 * Convenience methods
 */
export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  error: (message: string, data?: any) => log('error', message, data),
  debug: (message: string, data?: any) => log('debug', message, data),
};

/**
 * Get all log entries from file
 */
export function getLogEntries(limit = 100): string[] {
  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(-limit);
  } catch (error) {
    return [];
  }
}

/**
 * Clear log file
 */
export function clearLogs(): void {
  try {
    fs.writeFileSync(logPath, '');
    log('info', 'Log file cleared');
  } catch (error) {
    console.error('Failed to clear log file:', error);
  }
}
