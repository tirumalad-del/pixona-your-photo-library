import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Get database path in user data directory
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'pixona.db');

// Ensure directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

console.log(`Database path: ${dbPath}`);

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    created TEXT NOT NULL,
    modified TEXT NOT NULL,
    type TEXT NOT NULL,
    extension TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    camera TEXT,
    lens TEXT,
    focal_length TEXT,
    aperture TEXT,
    iso TEXT,
    shutter_speed TEXT,
    scanned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    indexed_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_photos_path ON photos(path);
  CREATE INDEX IF NOT EXISTS idx_photos_type ON photos(type);
  CREATE INDEX IF NOT EXISTS idx_photos_modified ON photos(modified DESC);
  CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(latitude, longitude);
`);

console.log('Database tables created/verified');

export interface PhotoRecord {
  id?: number;
  path: string;
  name: string;
  size: number;
  created: string | Date;
  modified: string | Date;
  type: string;
  extension: string;
  latitude?: number;
  longitude?: number;
  camera?: string;
  lens?: string;
  focal_length?: string;
  aperture?: string;
  iso?: string;
  shutter_speed?: string;
  scanned_at?: string;
  indexed_at?: string;
  location?: { lat: number; lng: number };
  metadata?: {
    camera?: string;
    lens?: string;
    focalLength?: string;
    aperture?: string;
    iso?: string;
    shutterSpeed?: string;
  };
}

// Helper to convert Date to ISO string
function toISOString(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
}

// Save a single photo to database
export function savePhoto(photo: any): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO photos 
    (path, name, size, created, modified, type, extension, latitude, longitude, 
     camera, lens, focal_length, aperture, iso, shutter_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    photo.path,
    photo.name,
    photo.size,
    toISOString(photo.created),
    toISOString(photo.modified),
    photo.type,
    photo.extension,
    photo.location?.lat,
    photo.location?.lng,
    photo.metadata?.camera,
    photo.metadata?.lens,
    photo.metadata?.focalLength,
    photo.metadata?.aperture,
    photo.metadata?.iso,
    photo.metadata?.shutterSpeed
  );
}

// Save multiple photos (batch operation)
export function savePhotos(photos: any[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO photos 
    (path, name, size, created, modified, type, extension, latitude, longitude, 
     camera, lens, focal_length, aperture, iso, shutter_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((photoList: any[]) => {
    for (const photo of photoList) {
      stmt.run(
        photo.path,
        photo.name,
        photo.size,
        toISOString(photo.created),
        toISOString(photo.modified),
        photo.type,
        photo.extension,
        photo.location?.lat,
        photo.location?.lng,
        photo.metadata?.camera,
        photo.metadata?.lens,
        photo.metadata?.focalLength,
        photo.metadata?.aperture,
        photo.metadata?.iso,
        photo.metadata?.shutterSpeed
      );
    }
  });
  
  transaction(photos);
}

// Get all photos
export function getAllPhotos(): PhotoRecord[] {
  const stmt = db.prepare('SELECT * FROM photos ORDER BY modified DESC');
  return stmt.all() as PhotoRecord[];
}

// Get photos by type
export function getPhotosByType(type: string): PhotoRecord[] {
  const stmt = db.prepare('SELECT * FROM photos WHERE type = ? ORDER BY modified DESC');
  return stmt.all(type) as PhotoRecord[];
}

// Get photos with GPS location
export function getPhotosWithLocation(): PhotoRecord[] {
  const stmt = db.prepare('SELECT * FROM photos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY modified DESC');
  return stmt.all() as PhotoRecord[];
}

// Search photos by name
export function searchPhotos(query: string): PhotoRecord[] {
  const stmt = db.prepare('SELECT * FROM photos WHERE name LIKE ? ORDER BY modified DESC');
  return stmt.all(`%${query}%`) as PhotoRecord[];
}

// Delete photo by path
export function deletePhoto(photoPath: string): void {
  const stmt = db.prepare('DELETE FROM photos WHERE path = ?');
  stmt.run(photoPath);
}

// Get total photo count
export function getPhotoCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM photos');
  const result = stmt.get() as { count: number };
  return result.count;
}

// Clear all photos
export function clearAllPhotos(): void {
  db.exec('DELETE FROM photos');
}

// Pagination support
export function getPhotosPaginated(page: number, pageSize: number = 100): PhotoRecord[] {
  const offset = (page - 1) * pageSize;
  const stmt = db.prepare('SELECT * FROM photos ORDER BY modified DESC LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset) as PhotoRecord[];
}

// Get total pages
export function getTotalPages(pageSize: number = 100): number {
  const count = getPhotoCount();
  return Math.ceil(count / pageSize);
}

// Filter by date range
export function getPhotosByDateRange(startDate: string, endDate: string): PhotoRecord[] {
  const stmt = db.prepare('SELECT * FROM photos WHERE modified BETWEEN ? AND ? ORDER BY modified DESC');
  return stmt.all(startDate, endDate) as PhotoRecord[];
}

// Filter by camera
export function getPhotosByCamera(camera: string): PhotoRecord[] {
  const stmt = db.prepare('SELECT * FROM photos WHERE camera = ? ORDER BY modified DESC');
  return stmt.all(camera) as PhotoRecord[];
}

// Find duplicates (same name and size)
export function findDuplicates(): PhotoRecord[] {
  const stmt = db.prepare(`
    SELECT p1.* 
    FROM photos p1
    INNER JOIN photos p2 ON p1.size = p2.size AND p1.name = p2.name AND p1.id < p2.id
    GROUP BY p1.id
    ORDER BY p1.name
  `);
  return stmt.all() as PhotoRecord[];
}

// Get photo statistics
export function getPhotoStats() {
  const totalPhotos = db.prepare('SELECT COUNT(*) as count FROM photos').get() as { count: number };
  const totalSize = db.prepare('SELECT SUM(size) as total FROM photos').get() as { total: number };
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM photos GROUP BY type').all();
  const byCamera = db.prepare('SELECT camera, COUNT(*) as count FROM photos WHERE camera IS NOT NULL GROUP BY camera ORDER BY count DESC LIMIT 10').all();
  const withLocation = db.prepare('SELECT COUNT(*) as count FROM photos WHERE latitude IS NOT NULL').get() as { count: number };
  
  return {
    totalPhotos: totalPhotos.count,
    totalSize: totalSize.total || 0,
    byType,
    byCamera,
    photosWithLocation: withLocation.count
  };
}

// Export the database instance
export { db };

// Cleanup on app exit
app.on('quit', () => {
  db.close();
  console.log('Database closed');
});
