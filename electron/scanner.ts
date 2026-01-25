import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, insertPhotos } from './database';
import ExifReader from 'exifreader';

export type ScanProgress = {
  percent: number;
  filesScanned: number;
  totalFiles: number;
  currentPath: string;
  phase: 'enumerating' | 'indexing' | 'idle';
};

const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif',
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'
];

// Calculate file hash for duplicate detection
export async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Generate organized path in YYYY/DD-MM-YYYY format from metadata
export function generateOrganizedPath(filePath: string, metadata: any): string {
  try {
    let date: Date | null = null;
    
    // Try to get date from EXIF
    if (metadata?.DateTimeOriginal || metadata?.DateTime || metadata?.CreateDate) {
      const dateStr = metadata.DateTimeOriginal || metadata.DateTime || metadata.CreateDate;
      date = new Date(dateStr);
    }
    
    // Fallback to file creation date
    if (!date || isNaN(date.getTime())) {
      const stats = fs.statSync(filePath);
      date = stats.birthtime || stats.mtime;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Format: YYYY/DD-MM-YYYY
    const organizedPath = `${year}/${day}-${month}-${year}`;
    return organizedPath;
  } catch (error) {
    console.error('Error generating organized path:', error);
    return 'unsorted';
  }
}

// Extract metadata from file
export async function extractMetadata(filePath: string): Promise<any> {
  try {
    const buffer = fs.readFileSync(filePath);
    const tags = ExifReader.load(buffer);
    
    return {
      DateTimeOriginal: tags.DateTimeOriginal?.description,
      DateTime: tags.DateTime?.description,
      CreateDate: tags.CreateDate?.description,
      Make: tags.Make?.description,
      Model: tags.Model?.description,
      Latitude: tags.GPSLatitude?.description,
      Longitude: tags.GPSLongitude?.description,
      Width: tags.ImageWidth?.value,
      Height: tags.ImageHeight?.value,
    };
  } catch (error) {
    return {};
  }
}

export async function scanDirectory(
  rootDir: string,
  onProgress: (progress: ScanProgress) => void
): Promise<void> {
  const allFiles: string[] = [];

  // Step 1: Enumerate all files recursively
  onProgress({
    percent: 0,
    filesScanned: 0,
    totalFiles: 0,
    currentPath: rootDir,
    phase: 'enumerating'
  });

  async function enumerateFiles(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await enumerateFiles(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          allFiles.push(fullPath);
        }
      }
    }
  }

  await enumerateFiles(rootDir);

  // Step 2: Index files with progress tracking
  onProgress({
    percent: 0,
    filesScanned: 0,
    totalFiles: allFiles.length,
    currentPath: '',
    phase: 'indexing'
  });

  const batchSize = 50; // Process in batches for better performance
  
  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    const photoData: any[] = [];
    
    for (const filePath of batch) {
      try {
        const stats = await fs.promises.stat(filePath);
        const metadata = await extractMetadata(filePath);
        const fileHash = await calculateFileHash(filePath);
        const organizedPath = generateOrganizedPath(filePath, metadata);
        
        photoData.push({
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          type: path.extname(filePath).substring(1),
          extension: path.extname(filePath),
          latitude: metadata.Latitude || null,
          longitude: metadata.Longitude || null,
          file_hash: fileHash,
          organized_path: organizedPath,
          original_path: filePath,
          duplicate_status: 'unchecked',
          duplicate_group: null
        });
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
    
    // Insert batch into database
    if (photoData.length > 0) {
      await insertPhotos(photoData);
    }
    
    // Update progress
    const filesScanned = Math.min(i + batchSize, allFiles.length);
    const percent = Math.round((filesScanned / allFiles.length) * 100);
    
    onProgress({
      percent,
      filesScanned,
      totalFiles: allFiles.length,
      currentPath: batch[batch.length - 1] || '',
      phase: 'indexing'
    });
  }

  // Complete
  onProgress({
    percent: 100,
    filesScanned: allFiles.length,
    totalFiles: allFiles.length,
    currentPath: '',
    phase: 'idle'
  });
}

export async function rescanLibrary(
  newLibraryPath: string,
  onProgress: (progress: ScanProgress) => void
): Promise<void> {
  // Clear existing database
  db.exec('DELETE FROM photos');
  
  // Scan new library
  await scanDirectory(newLibraryPath, onProgress);
}
