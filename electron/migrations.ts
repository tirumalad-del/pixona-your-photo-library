// Database Migration Script for PIXONA
// Automatically migrates old database schemas to new version

import Database from 'better-sqlite3';
import { logger } from './logger';

/**
 * Run all database migrations
 * @param db - Database instance
 */
export function runMigrations(db: Database.Database): void {
  try {
    logger.info('Starting database migrations...');
    
    // Check if migrations table exists
    const migrationsTableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
    ).get();
    
    if (!migrationsTableExists) {
      // Create migrations tracking table
      db.exec(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          migration_name TEXT UNIQUE NOT NULL,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Created migrations tracking table');
    }
    
    // Migration 1: Add file_hash column if missing
    addFileHashColumn(db);
    
    // Migration 2: Add organized_path column if missing
    addOrganizedPathColumn(db);
    
    // Migration 3: Add original_path column if missing
    addOriginalPathColumn(db);
    
    logger.info('All migrations completed successfully');
  } catch (error: any) {
    logger.error('Migration failed', error);
    throw error;
  }
}

/**
 * Migration 1: Add file_hash column to photos table
 */
function addFileHashColumn(db: Database.Database): void {
  const migrationName = 'add_file_hash_column';
  
  // Check if already applied
  const applied = db.prepare(
    'SELECT * FROM migrations WHERE migration_name = ?'
  ).get(migrationName);
  
  if (applied) {
    logger.info(`Migration '${migrationName}' already applied`);
    return;
  }
  
  try {
    // Check if column exists
    const tableInfo = db.prepare('PRAGMA table_info(photos)').all() as any[];
    const hasFileHash = tableInfo.some(col => col.name === 'file_hash');
    
    if (!hasFileHash) {
      logger.info('Adding file_hash column to photos table');
      db.exec('ALTER TABLE photos ADD COLUMN file_hash TEXT');
      logger.info('file_hash column added successfully');
    }
    
    // Record migration
    db.prepare(
      'INSERT INTO migrations (migration_name) VALUES (?)'
    ).run(migrationName);
    
    logger.info(`Migration '${migrationName}' completed`);
  } catch (error: any) {
    logger.error(`Migration '${migrationName}' failed`, error);
    throw error;
  }
}

/**
 * Migration 2: Add organized_path column to photos table
 */
function addOrganizedPathColumn(db: Database.Database): void {
  const migrationName = 'add_organized_path_column';
  
  const applied = db.prepare(
    'SELECT * FROM migrations WHERE migration_name = ?'
  ).get(migrationName);
  
  if (applied) {
    logger.info(`Migration '${migrationName}' already applied`);
    return;
  }
  
  try {
    const tableInfo = db.prepare('PRAGMA table_info(photos)').all() as any[];
    const hasOrganizedPath = tableInfo.some(col => col.name === 'organized_path');
    
    if (!hasOrganizedPath) {
      logger.info('Adding organized_path column to photos table');
      db.exec('ALTER TABLE photos ADD COLUMN organized_path TEXT');
      logger.info('organized_path column added successfully');
    }
    
    db.prepare(
      'INSERT INTO migrations (migration_name) VALUES (?)'
    ).run(migrationName);
    
    logger.info(`Migration '${migrationName}' completed`);
  } catch (error: any) {
    logger.error(`Migration '${migrationName}' failed`, error);
    throw error;
  }
}

/**
 * Migration 3: Add original_path column to photos table
 */
function addOriginalPathColumn(db: Database.Database): void {
  const migrationName = 'add_original_path_column';
  
  const applied = db.prepare(
    'SELECT * FROM migrations WHERE migration_name = ?'
  ).get(migrationName);
  
  if (applied) {
    logger.info(`Migration '${migrationName}' already applied`);
    return;
  }
  
  try {
    const tableInfo = db.prepare('PRAGMA table_info(photos)').all() as any[];
    const hasOriginalPath = tableInfo.some(col => col.name === 'original_path');
    
    if (!hasOriginalPath) {
      logger.info('Adding original_path column to photos table');
      db.exec('ALTER TABLE photos ADD COLUMN original_path TEXT');
      logger.info('original_path column added successfully');
    }
    
    db.prepare(
      'INSERT INTO migrations (migration_name) VALUES (?)'
    ).run(migrationName);
    
    logger.info(`Migration '${migrationName}' completed`);
  } catch (error: any) {
    logger.error(`Migration '${migrationName}' failed`, error);
    throw error;
  }
}
