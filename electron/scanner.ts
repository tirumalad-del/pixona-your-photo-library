import fs from 'fs';
import path from 'path';
import { db } from './database';

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

  function walkDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            walkDirectory(fullPath);
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
              allFiles.push(fullPath);
            }
          }
        } catch (err) {
          console.warn(`Skipping inaccessible path: ${fullPath}`, err);
        }
      }
    } catch (err) {
      console.error(`Cannot read directory: ${dir}`, err);
    }
  }

  walkDirectory(rootDir);

  const total = allFiles.length;
  let scanned = 0;
  const batchSize = 200;
  let batch: Array<{
    filePath: string;
    fileName: string;
    folderPath: string;
    sizeBytes: number;
    createdAt: string;
    modifiedAt: string;
  }> = [];

  // Step 2: Index files in batches
  for (const filePath of allFiles) {
    try {
      const stats = fs.statSync(filePath);
      batch.push({
        filePath,
        fileName: path.basename(filePath),
        folderPath: path.dirname(filePath),
        sizeBytes: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString()
      });

      scanned++;

      if (batch.length >= batchSize) {
        await db.insertPhotos(batch);
        batch = [];
        onProgress({
          percent: Math.round((scanned / total) * 100),
          filesScanned: scanned,
          totalFiles: total,
          currentPath: filePath,
          phase: 'indexing'
        });
      }
    } catch (err) {
      console.warn(`Cannot stat file: ${filePath}`, err);
      scanned++;
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await db.insertPhotos(batch);
  }

  onProgress({
    percent: 100,
    filesScanned: total,
    totalFiles: total,
    currentPath: '',
    phase: 'idle'
  });
}
