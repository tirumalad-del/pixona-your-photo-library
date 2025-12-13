import { app, dialog, nativeTheme, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "path";
import { dirname } from "path";
import * as fs$1 from "fs/promises";
import ExifReader from "exifreader";
import Database from "better-sqlite3";
import * as fs from "fs";
import { fileURLToPath } from "url";
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "pixona.db");
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
console.log(`Database path: ${dbPath}`);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
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
console.log("Database tables created/verified");
function toISOString(date) {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
}
function savePhoto(photo) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
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
    (_a = photo.location) == null ? void 0 : _a.lat,
    (_b = photo.location) == null ? void 0 : _b.lng,
    (_c = photo.metadata) == null ? void 0 : _c.camera,
    (_d = photo.metadata) == null ? void 0 : _d.lens,
    (_e = photo.metadata) == null ? void 0 : _e.focalLength,
    (_f = photo.metadata) == null ? void 0 : _f.aperture,
    (_g = photo.metadata) == null ? void 0 : _g.iso,
    (_h = photo.metadata) == null ? void 0 : _h.shutterSpeed
  );
}
function savePhotos(photos) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO photos 
    (path, name, size, created, modified, type, extension, latitude, longitude, 
     camera, lens, focal_length, aperture, iso, shutter_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction((photoList) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    for (const photo of photoList) {
      stmt.run(
        photo.path,
        photo.name,
        photo.size,
        toISOString(photo.created),
        toISOString(photo.modified),
        photo.type,
        photo.extension,
        (_a = photo.location) == null ? void 0 : _a.lat,
        (_b = photo.location) == null ? void 0 : _b.lng,
        (_c = photo.metadata) == null ? void 0 : _c.camera,
        (_d = photo.metadata) == null ? void 0 : _d.lens,
        (_e = photo.metadata) == null ? void 0 : _e.focalLength,
        (_f = photo.metadata) == null ? void 0 : _f.aperture,
        (_g = photo.metadata) == null ? void 0 : _g.iso,
        (_h = photo.metadata) == null ? void 0 : _h.shutterSpeed
      );
    }
  });
  transaction(photos);
}
function getAllPhotos() {
  const stmt = db.prepare("SELECT * FROM photos ORDER BY modified DESC");
  return stmt.all();
}
function getPhotoCount() {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM photos");
  const result = stmt.get();
  return result.count;
}
function getPhotosPaginated(page, pageSize = 100) {
  const offset = (page - 1) * pageSize;
  const stmt = db.prepare("SELECT * FROM photos ORDER BY modified DESC LIMIT ? OFFSET ?");
  return stmt.all(pageSize, offset);
}
function getTotalPages(pageSize = 100) {
  const count = getPhotoCount();
  return Math.ceil(count / pageSize);
}
function getPhotosByDateRange(startDate, endDate) {
  const stmt = db.prepare("SELECT * FROM photos WHERE modified BETWEEN ? AND ? ORDER BY modified DESC");
  return stmt.all(startDate, endDate);
}
function getPhotosByCamera(camera) {
  const stmt = db.prepare("SELECT * FROM photos WHERE camera = ? ORDER BY modified DESC");
  return stmt.all(camera);
}
function findDuplicates() {
  const stmt = db.prepare(`
    SELECT p1.* 
    FROM photos p1
    INNER JOIN photos p2 ON p1.size = p2.size AND p1.name = p2.name AND p1.id < p2.id
    GROUP BY p1.id
    ORDER BY p1.name
  `);
  return stmt.all();
}
function getPhotoStats() {
  const totalPhotos = db.prepare("SELECT COUNT(*) as count FROM photos").get();
  const totalSize = db.prepare("SELECT SUM(size) as total FROM photos").get();
  const byType = db.prepare("SELECT type, COUNT(*) as count FROM photos GROUP BY type").all();
  const byCamera = db.prepare("SELECT camera, COUNT(*) as count FROM photos WHERE camera IS NOT NULL GROUP BY camera ORDER BY count DESC LIMIT 10").all();
  const withLocation = db.prepare("SELECT COUNT(*) as count FROM photos WHERE latitude IS NOT NULL").get();
  return {
    totalPhotos: totalPhotos.count,
    totalSize: totalSize.total || 0,
    byType,
    byCamera,
    photosWithLocation: withLocation.count
  };
}
app.on("quit", () => {
  db.close();
  console.log("Database closed");
});
const logsDir = path.join(app.getPath("userData"), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logPath = path.join(logsDir, "app.log");
function log(level, message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? " " + JSON.stringify(data) : ""}
`;
  try {
    fs.appendFileSync(logPath, logLine);
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
  const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleMethod(`[${level.toUpperCase()}] ${message}`, data || "");
}
const logger = {
  info: (message, data) => log("info", message, data),
  warn: (message, data) => log("warn", message, data),
  error: (message, data) => log("error", message, data),
  debug: (message, data) => log("debug", message, data)
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.on("uncaughtException", (error) => {
  dialog.showErrorBox(
    "PIXONA Startup Error",
    `The application failed to start:

${error.message}

Stack:
${error.stack}`
  );
  app.quit();
});
process.on("unhandledRejection", (reason) => {
  dialog.showErrorBox(
    "PIXONA Startup Error",
    `Unhandled promise rejection:

${reason}`
  );
  app.quit();
});
let mainWindow = null;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
function getIconPath() {
  const possiblePaths = [
    path.join(__dirname, "../public/icon.ico"),
    path.join(process.resourcesPath, "public/icon.ico"),
    path.join(process.resourcesPath, "app.asar.unpacked/public/icon.ico")
  ];
  for (const iconPath of possiblePaths) {
    try {
      if (require("fs").existsSync(iconPath)) {
        return iconPath;
      }
    } catch (error) {
    }
  }
  return void 0;
}
function getIndexPath() {
  if (isDev) {
    return "http://localhost:8080";
  }
  return path.join(__dirname, "../dist/index.html");
}
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "PIXONA - Professional Photo Library",
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: "#0a0a0a",
    frame: true,
    titleBarStyle: "default",
    show: false,
    // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    },
    icon: getIconPath()
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
    if (isDev) {
      mainWindow == null ? void 0 : mainWindow.webContents.openDevTools();
    }
  });
  if (isDev) {
    mainWindow.loadURL(getIndexPath());
  } else {
    mainWindow.loadFile(getIndexPath());
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    nativeTheme.themeSource = "dark";
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}
app.on("window-all-closed", () => {
  app.quit();
});
ipcMain.handle("get-drives", async () => {
  try {
    if (process.platform === "win32") {
      const drives = [];
      for (let i = 65; i <= 90; i++) {
        const drive = String.fromCharCode(i) + ":/";
        try {
          await fs$1.access(drive);
          drives.push(drive);
        } catch {
        }
      }
      return { success: true, drives };
    }
    return { success: true, drives: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("select-folder", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "multiSelections"],
      title: "Select Photo Folders"
    });
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    return { success: true, folders: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("scan-directory", async (_event, directoryPath) => {
  try {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".heic", ".heif", ".tiff", ".raw", ".cr2", ".nef", ".arw"];
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv", ".flv", ".3gp"];
    const allExtensions = [...imageExtensions, ...videoExtensions];
    const files = [];
    let scannedDirs = 0;
    async function scanDir(dirPath, depth = 0) {
      var _a, _b, _c, _d, _e, _f;
      if (depth > 15) return;
      try {
        const entries = await fs$1.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "$RECYCLE.BIN" || entry.name === "System Volume Information" || entry.name === "Windows" || entry.name === "Program Files" || entry.name === "Program Files (x86)" || entry.name === "ProgramData") {
            continue;
          }
          if (entry.isDirectory()) {
            scannedDirs++;
            if (scannedDirs % 10 === 0) {
              mainWindow == null ? void 0 : mainWindow.webContents.send("scan-progress", {
                currentPath: fullPath,
                filesFound: files.length,
                directoriesScanned: scannedDirs
              });
            }
            await scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (allExtensions.includes(ext)) {
              try {
                const stats = await fs$1.stat(fullPath);
                const buffer = await fs$1.readFile(fullPath);
                let location = void 0;
                let metadata = void 0;
                try {
                  const tags = ExifReader.load(buffer);
                  if (tags.GPSLatitude && tags.GPSLongitude) {
                    const lat = tags.GPSLatitude.description;
                    const lng = tags.GPSLongitude.description;
                    location = { lat: parseFloat(lat), lng: parseFloat(lng) };
                  }
                  metadata = {
                    camera: (_a = tags.Make) == null ? void 0 : _a.description,
                    lens: (_b = tags.LensModel) == null ? void 0 : _b.description,
                    focalLength: (_c = tags.FocalLength) == null ? void 0 : _c.description,
                    aperture: (_d = tags.FNumber) == null ? void 0 : _d.description,
                    iso: (_e = tags.ISOSpeedRatings) == null ? void 0 : _e.description,
                    shutterSpeed: (_f = tags.ExposureTime) == null ? void 0 : _f.description
                  };
                } catch (exifError) {
                }
                const fileRecord = {
                  path: fullPath,
                  name: entry.name,
                  size: stats.size,
                  created: stats.birthtime,
                  modified: stats.mtime,
                  type: imageExtensions.includes(ext) ? "image" : "video",
                  extension: ext,
                  location,
                  metadata
                };
                files.push(fileRecord);
                await savePhoto(fileRecord);
              } catch (error) {
              }
            }
          }
        }
      } catch (error) {
      }
    }
    await scanDir(directoryPath);
    if (files.length > 0) {
      logger.info(`Saving ${files.length} photos to database in batch`);
      savePhotos(files);
    }
    return { success: true, files, totalFiles: files.length, directoriesScanned: scannedDirs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-all-photos", async () => {
  try {
    const photos = await getAllPhotos();
    return { success: true, photos };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-all-photos-paginated", async (_event, page, pageSize = 100) => {
  try {
    const photos = getPhotosPaginated(page, pageSize);
    const totalPages = getTotalPages(pageSize);
    logger.info(`Retrieved page ${page} of photos`, { count: photos.length, totalPages });
    return { success: true, photos, totalPages, currentPage: page };
  } catch (error) {
    logger.error("Failed to get paginated photos", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-photos-by-date", async (_event, startDate, endDate) => {
  try {
    const photos = getPhotosByDateRange(startDate, endDate);
    logger.info(`Retrieved photos by date range`, { startDate, endDate, count: photos.length });
    return { success: true, photos };
  } catch (error) {
    logger.error("Failed to get photos by date", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-photos-by-camera", async (_event, camera) => {
  try {
    const photos = getPhotosByCamera(camera);
    logger.info(`Retrieved photos by camera`, { camera, count: photos.length });
    return { success: true, photos };
  } catch (error) {
    logger.error("Failed to get photos by camera", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("find-duplicates", async () => {
  try {
    const duplicates = findDuplicates();
    logger.info(`Found duplicate photos`, { count: duplicates.length });
    return { success: true, duplicates };
  } catch (error) {
    logger.error("Failed to find duplicates", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-photo-stats", async () => {
  try {
    const stats = getPhotoStats();
    logger.info("Retrieved photo statistics", stats);
    return { success: true, stats };
  } catch (error) {
    logger.error("Failed to get photo statistics", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-file-metadata", async (_event, filePath) => {
  try {
    const stats = await fs$1.stat(filePath);
    return {
      success: true,
      metadata: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("file-exists", async (_event, filePath) => {
  try {
    await fs$1.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});
ipcMain.handle("read-file", async (_event, filePath) => {
  try {
    const buffer = await fs$1.readFile(filePath);
    return { success: true, buffer: buffer.toString("base64") };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("move-to-trash", async (_event, filePath) => {
  try {
    await shell.trashItem(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("copy-file", async (_event, sourcePath, destPath) => {
  try {
    await fs$1.copyFile(sourcePath, destPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("move-file", async (_event, sourcePath, destPath) => {
  try {
    await fs$1.rename(sourcePath, destPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("open-file", async (_event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("show-in-folder", async (_event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
ipcMain.handle("set-auto-start", async (_event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath("exe")
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-auto-start", () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.handle("generate-thumbnail", async (_event, filePath) => {
  try {
    const buffer = await fs$1.readFile(filePath);
    return { success: true, data: buffer.toString("base64") };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
