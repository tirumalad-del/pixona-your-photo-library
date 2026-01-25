import fs from 'fs';
import path from 'path';
import { db } from './database';
import { generateOrganizedPath, extractMetadata } from './scanner';

export type OrganizeProgress = {
  percent: number;
  filesProcessed: number;
  totalFiles: number;
  currentFile: string;
  errors: string[];
};

export type OrganizeOptions = {
  targetDir: string;
  copyMode: 'copy' | 'move';
  preserveOriginal: boolean;
};

/**
 * Organize files into YYYY/DD-MM-YYYY folder structure
 * @param options Organization options
 * @param onProgress Progress callback
 */
export async function organizeFiles(
  options: OrganizeOptions,
  onProgress: (progress: OrganizeProgress) => void
): Promise<void> {
  // Get all photos from database
  const photos = db.prepare('SELECT * FROM photos').all();
  
  const errors: string[] = [];
  let filesProcessed = 0;
  
  for (const photo of photos) {
    try {
      const sourcePath = photo.path;
      const organizedSubPath = photo.organized_path || 'unsorted';
      const targetPath = path.join(options.targetDir, organizedSubPath, path.basename(sourcePath));
      
      // Create target directory
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy or move file
      if (options.copyMode === 'copy') {
        fs.copyFileSync(sourcePath, targetPath);
      } else {
        fs.renameSync(sourcePath, targetPath);
        
        // Update database with new path
        db.prepare('UPDATE photos SET path = ? WHERE id = ?').run(targetPath, photo.id);
      }
      
      filesProcessed++;
      
      // Report progress
      onProgress({
        percent: Math.round((filesProcessed / photos.length) * 100),
        filesProcessed,
        totalFiles: photos.length,
        currentFile: sourcePath,
        errors: [...errors]
      });
    } catch (error) {
      const errorMsg = `Failed to organize ${photo.path}: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }
  
  // Final progress
  onProgress({
    percent: 100,
    filesProcessed,
    totalFiles: photos.length,
    currentFile: '',
    errors: [...errors]
  });
}

/**
 * Organize files during import
 * @param sourceFiles Array of source file paths
 * @param targetDir Target library directory
 * @param onProgress Progress callback
 */
export async function organizeOnImport(
  sourceFiles: string[],
  targetDir: string,
  onProgress: (progress: OrganizeProgress) => void
): Promise<void> {
  const errors: string[] = [];
  let filesProcessed = 0;
  
  for (const sourcePath of sourceFiles) {
    try {
      // Extract metadata to determine organized path
      const metadata = await extractMetadata(sourcePath);
      const organizedSubPath = generateOrganizedPath(sourcePath, metadata);
      const targetPath = path.join(targetDir, organizedSubPath, path.basename(sourcePath));
      
      // Create target directory
      const targetDirPath = path.dirname(targetPath);
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }
      
      // Copy file to organized location
      fs.copyFileSync(sourcePath, targetPath);
      
      filesProcessed++;
      
      // Report progress
      onProgress({
        percent: Math.round((filesProcessed / sourceFiles.length) * 100),
        filesProcessed,
        totalFiles: sourceFiles.length,
        currentFile: sourcePath,
        errors: [...errors]
      });
    } catch (error) {
      const errorMsg = `Failed to import ${sourcePath}: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }
  
  // Final progress
  onProgress({
    percent: 100,
    filesProcessed,
    totalFiles: sourceFiles.length,
    currentFile: '',
    errors: [...errors]
  });
}

/**
 * Check if file organization is needed
 */
export function needsOrganization(libraryPath: string): boolean {
  // Check if photos in database have organized paths
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM photos 
    WHERE organized_path IS NULL OR organized_path = 'unsorted'
  `).get() as { count: number };
  
  return result.count > 0;
}

/**
 * Get organization statistics
 */
export function getOrganizationStats(): {
  total: number;
  organized: number;
  unorganized: number;
  organizationRate: number;
} {
  const total = db.prepare('SELECT COUNT(*) as count FROM photos').get() as { count: number };
  const organized = db.prepare(`
    SELECT COUNT(*) as count 
    FROM photos 
    WHERE organized_path IS NOT NULL AND organized_path != 'unsorted'
  `).get() as { count: number };
  
  const unorganized = total.count - organized.count;
  const organizationRate = total.count > 0 ? (organized.count / total.count) * 100 : 0;
  
  return {
    total: total.count,
    organized: organized.count,
    unorganized,
    organizationRate
  };
}
