import { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, protocol } from 'electron';import * as path from 'path';
import * as fs from 'fs/promises';
import ExifReader from 'exifreader';
import { savePhoto, getAllPhotos, savePhotos } from './database'; // ⬅️ ADDED: Database Imports
import { logger } from './logger';
import { validatePath } from './utils';
import { FileAccessError, DatabaseError } from './errors';
import { getPhotosPaginated, getTotalPages, getPhotosByDateRange, getPhotosByCamera, findDuplicates, getPhotoStats } from './database';

// ES Module equivalents for __dirname and __filename
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CRITICAL ERROR HANDLERS (Global) ---
// CRITICAL: Show error dialog for ANY error during startup
process.on('uncaughtException', (error) => {
  dialog.showErrorBox(
    'PIXONA Startup Error',
    `The application failed to start:\n\n${error.message}\n\nStack:\n${error.stack}`
  );
  app.quit();
});

process.on('unhandledRejection', (reason: any) => {
  dialog.showErrorBox(
    'PIXONA Startup Error',
    `Unhandled promise rejection:\n\n${reason}`
  );
  app.quit();
});

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Helper function to get the correct icon path
// Helper function to get the correct icon path - returns undefined if not found
function getIconPath(): string | undefined {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, '../public/icon.ico'),
    path.join(process.resourcesPath, 'public/icon.ico'),
    path.join(process.resourcesPath, 'app.asar.unpacked/public/icon.ico'),
  ];
  
  // Return the first path that exists, or undefined
  for (const iconPath of possiblePaths) {
    try {
      // NOTE: Checking existence synchronously is necessary here
      if (require('fs').existsSync(iconPath)) {
        return iconPath;
      }
    } catch (error) {
      // Continue to next path
    }
  }
  
  return undefined; // No icon found, app will use default
}
// Helper function to get the correct HTML path
function getIndexPath(): string {
  if (isDev) {
    return 'http://localhost:8080';
  }
  // In production, index.html is packaged in app.asar
  return path.join(__dirname, '../dist/index.html');
}

function createWindow() {
  
  // ⬅️ REMOVED: Duplicate process.on('uncaughtException', ...) listener inside createWindow

  mainWindow = new BrowserWindow({
    title: 'PIXONA - Professional Photo Library',
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0a0a0a',
    frame: true,
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    icon: getIconPath(),
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(getIndexPath());
  } else {
    mainWindow.loadFile(getIndexPath());
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Set dark mode
    nativeTheme.themeSource = 'dark';
    
    createWindow();
        // Register custom protocol for local file access
        protocol.registerFileProtocol('pixona-file', (request, callback) => {
                const url = request.url.replace('pixona-file://', '');
                callback({ path: url });
              });
    

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  // Windows-only app - always quit
  app.quit();
});

// IPC Handlers for File System Access

// Get available drives (Windows specific)
ipcMain.handle('get-drives', async () => {
  try {
    if (process.platform === 'win32') {
      const drives: string[] = [];
      for (let i = 65; i <= 90; i++) {
        const drive = String.fromCharCode(i) + ':/';
        try {
          await fs.access(drive);
          drives.push(drive);
        } catch {
          // Drive doesn't exist or not accessible
        }
      }
      return { success: true, drives };
    }
    return { success: true, drives: [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'multiSelections'],
      title: 'Select Photo Folders',
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    return { success: true, folders: result.filePaths };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Scan directory for photos and videos with progress
ipcMain.handle('scan-directory', async (_event, directoryPath: string) => {
  try {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.raw', '.cr2', '.nef', '.arw'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv', '.flv', '.3gp'];
    const allExtensions = [...imageExtensions, ...videoExtensions];

    const files: any[] = [];
    let scannedDirs = 0;

    async function scanDir(dirPath: string, depth = 0) {
      // Limit depth to prevent infinite recursion
      if (depth > 15) return;

      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          // Skip system and hidden folders
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' || 
              entry.name === '$RECYCLE.BIN' ||
              entry.name === 'System Volume Information' ||
              entry.name === 'Windows' ||
              entry.name === 'Program Files' ||
              entry.name === 'Program Files (x86)' ||
              entry.name === 'ProgramData') {
            continue;
          }

          if (entry.isDirectory()) {
            scannedDirs++;
            // Send progress update every 10 directories
            if (scannedDirs % 10 === 0) {
              mainWindow?.webContents.send('scan-progress', {
                currentPath: fullPath,
                filesFound: files.length,
                directoriesScanned: scannedDirs,
              });
            }
            
            await scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (allExtensions.includes(ext)) {
              try {
                const stats = await fs.stat(fullPath);
                const buffer = await fs.readFile(fullPath);
                    
                // Extract EXIF data for images
                let location: any = undefined;
                let metadata: any = undefined;
                    
                try {
                  const tags = ExifReader.load(buffer);
                      
                  // Extract GPS coordinates
                  if (tags.GPSLatitude && tags.GPSLongitude) {
                    const lat = tags.GPSLatitude.description;
                    const lng = tags.GPSLongitude.description;
                    location = { lat: parseFloat(lat), lng: parseFloat(lng) };
                  }
                      
                  // Extract camera metadata
                  metadata = {
                    camera: tags.Make?.description,
                    lens: tags.LensModel?.description,
                    focalLength: tags.FocalLength?.description,
                    aperture: tags.FNumber?.description,
                    iso: tags.ISOSpeedRatings?.description,
                    shutterSpeed: tags.ExposureTime?.description
                  };
                } catch (exifError) {
                  // No EXIF data or error reading it
                }
                    
                const fileRecord = {
                  path: fullPath,
                  name: entry.name,
                  size: stats.size,
                  created: stats.birthtime,
                  modified: stats.mtime,
                  type: imageExtensions.includes(ext) ? 'image' : 'video',
                  extension: ext,
                  location: location,
                  metadata: metadata
                };
                
                files.push(fileRecord);
                
                // ⬅️ ADDED: Save to database
                await savePhoto(fileRecord);
                
              } catch (error) {
                // Skip files we can't access
              }
            }
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }

    await scanDir(directoryPath);
        
    // ⬅️ ADDED: Batch save all photos at once for better performance
    if (files.length > 0) {
      logger.info(`Saving ${files.length} photos to database in batch`);
      savePhotos(files);
    }
    return { success: true, files, totalFiles: files.length, directoriesScanned: scannedDirs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ⬅️ ADDED: Get all photos from database
ipcMain.handle('get-all-photos', async () => {
  try {
    const photos = await getAllPhotos();
    return { success: true, photos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ⬅️ NEW: Get all photos with pagination
ipcMain.handle('get-all-photos-paginated', async (_event, page: number, pageSize: number = 100) => {
  try {
    const photos = getPhotosPaginated(page, pageSize);
    const totalPages = getTotalPages(pageSize);
    logger.info(`Retrieved page ${page} of photos`, { count: photos.length, totalPages });
    return { success: true, photos, totalPages, currentPage: page };
  } catch (error: any) {
    logger.error('Failed to get paginated photos', error);
    return { success: false, error: error.message };
  }
});

// ⬅️ NEW: Get photos by date range
ipcMain.handle('get-photos-by-date', async (_event, startDate: string, endDate: string) => {
  try {
    const photos = getPhotosByDateRange(startDate, endDate);
    logger.info(`Retrieved photos by date range`, { startDate, endDate, count: photos.length });
    return { success: true, photos };
  } catch (error: any) {
    logger.error('Failed to get photos by date', error);
    return { success: false, error: error.message };
  }
});

// ⬅️ NEW: Get photos by camera
ipcMain.handle('get-photos-by-camera', async (_event, camera: string) => {
  try {
    const photos = getPhotosByCamera(camera);
    logger.info(`Retrieved photos by camera`, { camera, count: photos.length });
    return { success: true, photos };
  } catch (error: any) {
    logger.error('Failed to get photos by camera', error);
    return { success: false, error: error.message };
  }
});

// ⬅️ NEW: Find duplicate photos
ipcMain.handle('find-duplicates', async () => {
  try {
    const duplicates = findDuplicates();
    logger.info(`Found duplicate photos`, { count: duplicates.length });
    return { success: true, duplicates };
  } catch (error: any) {
    logger.error('Failed to find duplicates', error);
    return { success: false, error: error.message };
  }
});

// ⬅️ NEW: Get photo statistics
ipcMain.handle('get-photo-stats', async () => {
  try {
    const stats = getPhotoStats();
    logger.info('Retrieved photo statistics', stats);
    return { success: true, stats };
  } catch (error: any) {
    logger.error('Failed to get photo statistics', error);
    return { success: false, error: error.message };
  }
});

// Get file metadata
ipcMain.handle('get-file-metadata', async (_event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      success: true,
      metadata: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Check if file exists
ipcMain.handle('file-exists', async (_event, filePath: string) => {
  try {
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

// Read file as buffer (for generating thumbnails)
ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath);
    return { success: true, buffer: buffer.toString('base64') };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Move file to trash
ipcMain.handle('move-to-trash', async (_event, filePath: string) => {
  try {
    await shell.trashItem(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Copy file
ipcMain.handle('copy-file', async (_event, sourcePath: string, destPath: string) => {
  try {
    await fs.copyFile(sourcePath, destPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Move file
ipcMain.handle('move-file', async (_event, sourcePath: string, destPath: string) => {
  try {
    await fs.rename(sourcePath, destPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Open file in default application
ipcMain.handle('open-file', async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Show file in folder
ipcMain.handle('show-in-folder', async (_event, filePath: string) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Set auto-start
ipcMain.handle('set-auto-start', async (_event, enabled: boolean) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get auto-start status
ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings().openAtLogin;
});

// Generate thumbnail for photo
ipcMain.handle('generate-thumbnail', async (_event, filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath);
    // Return base64 encoded buffer for thumbnail generation in renderer
    return { success: true, data: buffer.toString('base64') };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
