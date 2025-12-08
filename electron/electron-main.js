const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
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
    icon: isDev 
      ? path.join(__dirname, '../public/icon.png')
      : path.join(process.resourcesPath, 'public/icon.png'),
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load the app - using port 8080
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for File System Access
// Get available drives (Windows specific)
ipcMain.handle('get-drives', async () => {
  try {
    if (process.platform === 'win32') {
      const drives = [];
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
    } else {
      // For macOS/Linux, return common locations
      return { success: true, drives: ['/home', '/Users'] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'multiSelections'],
      title: 'Select Photo Folders',
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    return { success: true, folders: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Scan directory for photos and videos with progress
ipcMain.handle('scan-directory', async (_event, directoryPath) => {
  try {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.raw', '.cr2', '.nef', '.arw'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv', '.flv', '.3gp'];
    const allExtensions = [...imageExtensions, ...videoExtensions];

    const files = [];
    let scannedDirs = 0;

    async function scanDir(dirPath, depth = 0) {
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
                files.push({
                  path: fullPath,
                  name: entry.name,
                  size: stats.size,
                  modified: stats.mtime,
                  created: stats.birthtime,
                  type: imageExtensions.includes(ext) ? 'image' : 'video',
                  extension: ext,
                });
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

    return { success: true, files, totalFiles: files.length, directoriesScanned: scannedDirs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get file metadata
ipcMain.handle('get-file-metadata', async (_event, filePath) => {
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
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check if file exists
ipcMain.handle('file-exists', async (_event, filePath) => {
  try {
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

// Read file as buffer (for generating thumbnails)
ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return { success: true, buffer: buffer.toString('base64') };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Move file to trash
ipcMain.handle('move-to-trash', async (_event, filePath) => {
  try {
    await shell.trashItem(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Copy file
ipcMain.handle('copy-file', async (_event, sourcePath, destPath) => {
  try {
    await fs.copyFile(sourcePath, destPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Move file
ipcMain.handle('move-file', async (_event, sourcePath, destPath) => {
  try {
    await fs.rename(sourcePath, destPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open file in default application
ipcMain.handle('open-file', async (_event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Show file in folder
ipcMain.handle('show-in-folder', async (_event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Set auto-start
ipcMain.handle('set-auto-start', async (_event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get auto-start status
ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings().openAtLogin;
});
