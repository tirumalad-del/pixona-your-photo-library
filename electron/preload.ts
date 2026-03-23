import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Generic invoke - allows db.ts to call any IPC channel
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),

  // Get available drives
  getDrives: () => ipcRenderer.invoke('get-drives'),

  // Select folder dialog
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Select multiple folders
  selectFolders: () => ipcRenderer.invoke('select-folders'),

  // Scan directory for photos/videos
  scanDirectory: (directoryPath: string) =>
    ipcRenderer.invoke('scan-directory', directoryPath),

  // Get file metadata
  getFileMetadata: (filePath: string) =>
    ipcRenderer.invoke('get-file-metadata', filePath),

  // Check if file exists
  fileExists: (filePath: string) =>
    ipcRenderer.invoke('file-exists', filePath),

  // Read file as buffer
  readFile: (filePath: string) =>
    ipcRenderer.invoke('read-file', filePath),

  // Move file to trash
  moveToTrash: (filePath: string) =>
    ipcRenderer.invoke('move-to-trash', filePath),

  // Copy file
  copyFile: (sourcePath: string, destPath: string) =>
    ipcRenderer.invoke('copy-file', sourcePath, destPath),

  // Open file with system app
  openFile: (filePath: string) =>
    ipcRenderer.invoke('open-file', filePath),

  // Show file in folder
  showInFolder: (filePath: string) =>
    ipcRenderer.invoke('show-in-folder', filePath),

  // Get app data path
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),

  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Open external URL
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Listen to scan progress events
  onScanProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('scan-progress', subscription);
    return () => ipcRenderer.removeListener('scan-progress', subscription);
  },

  // Listen to scan complete events
  onScanComplete: (callback: (result: any) => void) => {
    const subscription = (_event: any, result: any) => callback(result);
    ipcRenderer.on('scan-complete', subscription);
    return () => ipcRenderer.removeListener('scan-complete', subscription);
  },

  // Listen to scan error events
  onScanError: (callback: (error: any) => void) => {
    const subscription = (_event: any, error: any) => callback(error);
    ipcRenderer.on('scan-error', subscription);
    return () => ipcRenderer.removeListener('scan-error', subscription);
  },

  // Listen to face scan progress
  onFaceScanProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('face-scan-progress', subscription);
    return () => ipcRenderer.removeListener('face-scan-progress', subscription);
  },

  // Database operations - Photos
  getAllPhotos: () => ipcRenderer.invoke('get-all-photos'),
  getPhotosPaginated: (page: number, pageSize: number) =>
    ipcRenderer.invoke('get-photos-paginated', page, pageSize),
  getPhotosByDate: (startDate: string, endDate: string) =>
    ipcRenderer.invoke('get-photos-by-date', startDate, endDate),
  getPhotosByCamera: (camera: string) =>
    ipcRenderer.invoke('get-photos-by-camera', camera),
  getPhotoStats: () => ipcRenderer.invoke('get-photo-stats'),
  getTotalPages: (pageSize: number) =>
    ipcRenderer.invoke('get-total-pages', pageSize),
  savePhoto: (photo: any) => ipcRenderer.invoke('save-photo', photo),
  savePhotos: (photos: any[]) => ipcRenderer.invoke('save-photos', photos),
  deletePhoto: (id: string) => ipcRenderer.invoke('delete-photo', id),
  deletePhotos: (ids: string[]) => ipcRenderer.invoke('delete-photos', ids),
  updatePhotoTags: (id: string, tags: string[]) =>
    ipcRenderer.invoke('update-photo-tags', id, tags),
  updatePhotoAlbum: (id: string, albumId: string) =>
    ipcRenderer.invoke('update-photo-album', id, albumId),

  // Database operations - Albums
  getAllAlbums: () => ipcRenderer.invoke('get-all-albums'),
  createAlbum: (album: any) => ipcRenderer.invoke('create-album', album),
  updateAlbum: (id: string, updates: any) =>
    ipcRenderer.invoke('update-album', id, updates),
  deleteAlbum: (id: string) => ipcRenderer.invoke('delete-album', id),
  addPhotosToAlbum: (albumId: string, photoIds: string[]) =>
    ipcRenderer.invoke('add-photos-to-album', albumId, photoIds),
  removePhotosFromAlbum: (albumId: string, photoIds: string[]) =>
    ipcRenderer.invoke('remove-photos-from-album', albumId, photoIds),

  // Database operations - People
  getAllPeople: () => ipcRenderer.invoke('get-all-people'),
  createPerson: (person: any) => ipcRenderer.invoke('create-person', person),
  updatePerson: (id: string, updates: any) =>
    ipcRenderer.invoke('update-person', id, updates),
  deletePerson: (id: string) => ipcRenderer.invoke('delete-person', id),
  assignFaceToPerson: (photoId: string, personId: string) =>
    ipcRenderer.invoke('assign-face-to-person', photoId, personId),

  // Duplicate detection
  findDuplicates: () => ipcRenderer.invoke('find-duplicates'),
  getDuplicateGroups: () => ipcRenderer.invoke('get-duplicate-groups'),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) =>
    ipcRenderer.invoke('set-setting', key, value),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),

  // Thumbnail
  getThumbnail: (photoId: string) =>
    ipcRenderer.invoke('get-thumbnail', photoId),
  generateThumbnail: (filePath: string) =>
    ipcRenderer.invoke('generate-thumbnail', filePath),

  // Photo file URL for display
  getPhotoUrl: (filePath: string) =>
    ipcRenderer.invoke('get-photo-url', filePath),

  // Remove event listeners
  removeAllListeners: (channel: string) =>
    ipcRenderer.removeAllListeners(channel),
});
