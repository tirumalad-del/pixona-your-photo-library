import { db, findDuplicatesByHash, deletePhotos, markDuplicateGroup } from './database';
import fs from 'fs';

export type DuplicateGroup = {
  hash: string;
  files: DuplicateFile[];
  totalSize: number;
  potentialSavings: number;
};

export type DuplicateFile = {
  id: number;
  path: string;
  name: string;
  size: number;
  created: string;
  modified: string;
  isMarkedForDeletion: boolean;
};

export type DuplicateStats = {
  totalDuplicateGroups: number;
  totalDuplicateFiles: number;
  totalWastedSpace: number;
  duplicatePercentage: number;
};

/**
 * Scan for duplicates in the database
 * @returns Array of duplicate groups
 */
export async function scanForDuplicates(): Promise<DuplicateGroup[]> {
  const duplicateGroups: DuplicateGroup[] = [];
  
  // Find all file hashes that have duplicates
  const hashesWithDuplicates = db.prepare(`
    SELECT file_hash, COUNT(*) as count
    FROM photos
    WHERE file_hash IS NOT NULL
    GROUP BY file_hash
    HAVING count > 1
  `).all() as { file_hash: string; count: number }[];
  
  // For each hash, get all files with that hash
  for (const { file_hash } of hashesWithDuplicates) {
    const files = findDuplicatesByHash(file_hash);
    
    if (files.length > 1) {
      const duplicateFiles: DuplicateFile[] = files.map(file => ({
        id: file.id,
        path: file.path,
        name: file.name,
        size: file.size,
        created: file.created,
        modified: file.modified,
        isMarkedForDeletion: false
      }));
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const potentialSavings = totalSize - files[0].size; // Keep one, delete others
      
      duplicateGroups.push({
        hash: file_hash,
        files: duplicateFiles,
        totalSize,
        potentialSavings
      });
    }
  }
  
  return duplicateGroups;
}

/**
 * Mark duplicate groups in the database
 */
export async function updateDuplicateStatus(): Promise<void> {
  const duplicateGroups = await scanForDuplicates();
  
  // Reset all duplicate statuses first
  db.prepare('UPDATE photos SET duplicate_status = "unique", duplicate_group = NULL').run();
  
  // Mark duplicates
  for (let i = 0; i < duplicateGroups.length; i++) {
    const group = duplicateGroups[i];
    const groupId = `dup_group_${i + 1}`;
    
    for (const file of group.files) {
      markDuplicateGroup(file.id, 'duplicate', groupId);
    }
  }
}

/**
 * Delete selected duplicate files
 * @param fileIds Array of file IDs to delete
 * @returns Number of files successfully deleted
 */
export async function deleteDuplicateFiles(fileIds: number[]): Promise<{
  deleted: number;
  failed: number;
  errors: string[];
}> {
  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const fileId of fileIds) {
    try {
      // Get file path from database
      const photo = db.prepare('SELECT path FROM photos WHERE id = ?').get(fileId) as { path: string };
      
      if (photo) {
        // Delete physical file
        if (fs.existsSync(photo.path)) {
          fs.unlinkSync(photo.path);
        }
        
        // Delete from database
        await deletePhotos([fileId]);
        deleted++;
      }
    } catch (error) {
      failed++;
      errors.push(`Failed to delete file ID ${fileId}: ${error.message}`);
      console.error(`Error deleting file ${fileId}:`, error);
    }
  }
  
  return { deleted, failed, errors };
}

/**
 * Get duplicate statistics
 */
export function getDuplicateStats(): DuplicateStats {
  const totalFiles = db.prepare('SELECT COUNT(*) as count FROM photos').get() as { count: number };
  const duplicateFiles = db.prepare(`
    SELECT COUNT(*) as count 
    FROM photos 
    WHERE duplicate_status = 'duplicate'
  `).get() as { count: number };
  
  const wastedSpace = db.prepare(`
    SELECT SUM(size) as total
    FROM photos
    WHERE duplicate_status = 'duplicate'
  `).get() as { total: number };
  
  const duplicateGroups = db.prepare(`
    SELECT COUNT(DISTINCT duplicate_group) as count
    FROM photos
    WHERE duplicate_group IS NOT NULL
  `).get() as { count: number };
  
  return {
    totalDuplicateGroups: duplicateGroups.count || 0,
    totalDuplicateFiles: duplicateFiles.count || 0,
    totalWastedSpace: wastedSpace.total || 0,
    duplicatePercentage: totalFiles.count > 0 ? (duplicateFiles.count / totalFiles.count) * 100 : 0
  };
}

/**
 * Auto-select duplicates for deletion (keep newest or largest)
 * @param groups Duplicate groups
 * @param keepStrategy 'newest' | 'oldest' | 'largest' | 'smallest'
 */
export function autoSelectDuplicates(
  groups: DuplicateGroup[],
  keepStrategy: 'newest' | 'oldest' | 'largest' | 'smallest' = 'newest'
): number[] {
  const toDelete: number[] = [];
  
  for (const group of groups) {
    let fileToKeep: DuplicateFile;
    
    switch (keepStrategy) {
      case 'newest':
        fileToKeep = group.files.reduce((newest, file) => 
          new Date(file.created) > new Date(newest.created) ? file : newest
        );
        break;
      case 'oldest':
        fileToKeep = group.files.reduce((oldest, file) => 
          new Date(file.created) < new Date(oldest.created) ? file : oldest
        );
        break;
      case 'largest':
        fileToKeep = group.files.reduce((largest, file) => 
          file.size > largest.size ? file : largest
        );
        break;
      case 'smallest':
        fileToKeep = group.files.reduce((smallest, file) => 
          file.size < smallest.size ? file : smallest
        );
        break;
    }
    
    // Mark all except the one to keep for deletion
    for (const file of group.files) {
      if (file.id !== fileToKeep.id) {
        toDelete.push(file.id);
      }
    }
  }
  
  return toDelete;
}
