import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electron", {
  // Get available drives
  getDrives: () => ipcRenderer.invoke("get-drives"),
  // Select folder dialog
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  // Scan directory for photos/videos
  scanDirectory: (directoryPath) => ipcRenderer.invoke("scan-directory", directoryPath),
  // Get file metadata
  getFileMetadata: (filePath) => ipcRenderer.invoke("get-file-metadata", filePath),
  // Check if file exists
  fileExists: (filePath) => ipcRenderer.invoke("file-exists", filePath),
  // Read file as buffer
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  // Move file to trash
  moveToTrash: (filePath) => ipcRenderer.invoke("move-to-trash", filePath),
  // Copy file
  copyFile: (sourcePath, destPath) => ipcRenderer.invoke("copy-file", sourcePath, destPath),
  // Move file
  moveFile: (sourcePath, destPath) => ipcRenderer.invoke("move-file", sourcePath, destPath),
  // Open file in default application
  openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
  // Show file in folder
  showInFolder: (filePath) => ipcRenderer.invoke("show-in-folder", filePath),
  // Get app version
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  // Auto-start settings
  setAutoStart: (enabled) => ipcRenderer.invoke("set-auto-start", enabled),
  getAutoStart: () => ipcRenderer.invoke("get-auto-start"),
  // ⬅️ NEW: Paginated photo retrieval
  getAllPhotosPaginated: (page, pageSize) => ipcRenderer.invoke("get-all-photos-paginated", page, pageSize),
  // ⬅️ NEW: Filter by date range
  getPhotosByDate: (startDate, endDate) => ipcRenderer.invoke("get-photos-by-date", startDate, endDate),
  // ⬅️ NEW: Filter by camera
  getPhotosByCamera: (camera) => ipcRenderer.invoke("get-photos-by-camera", camera),
  // ⬅️ NEW: Find duplicates
  findDuplicates: () => ipcRenderer.invoke("find-duplicates"),
  // ⬅️ NEW: Get statistics
  getPhotoStats: () => ipcRenderer.invoke("get-photo-stats"),
  // ⬅️ NEW: Get all photos from database
  getAllPhotos: () => ipcRenderer.invoke("get-all-photos"),
  // Listen to scan progress
  onScanProgress: (callback) => {
    const subscription = (_event, progress) => callback(progress);
    ipcRenderer.on("scan-progress", subscription);
    return () => {
      ipcRenderer.removeListener("scan-progress", subscription);
    };
  },
  // Generate thumbnail
  generateThumbnail: (filePath) => ipcRenderer.invoke("generate-thumbnail", filePath)
});
