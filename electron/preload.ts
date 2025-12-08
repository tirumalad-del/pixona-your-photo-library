import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Get available drives
  getDrives: () => ipcRenderer.invoke('get-drives'),
  
  // Select folder dialog
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
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
  
  // Move file
  moveFile: (sourcePath: string, destPath: string) =>
    ipcRenderer.invoke('move-file', sourcePath, destPath),
  
  // Open file in default application
  openFile: (filePath: string) =>
    ipcRenderer.invoke('open-file', filePath),
  
  // Show file in folder
  showInFolder: (filePath: string) =>
    ipcRenderer.invoke('show-in-folder', filePath),
  
  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Auto-start settings
  setAutoStart: (enabled: boolean) =>
    ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  
  // Listen to scan progress
  onScanProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('scan-progress', subscription);
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('scan-progress', subscription);
    };
  },
});

// TypeScript type definitions for the exposed API
export interface ElectronAPI {
  getDrives: () => Promise<{ success: boolean; drives?: string[]; error?: string }>;
  selectFolder: () => Promise<{ success: boolean; folders?: string[]; canceled?: boolean; error?: string }>;
  scanDirectory: (directoryPath: string) => Promise<{ 
    success: boolean; 
    files?: any[]; 
    totalFiles?: number;
    directoriesScanned?: number;
    error?: string 
  }>;
  getFileMetadata: (filePath: string) => Promise<{ 
    success: boolean; 
    metadata?: any; 
    error?: string 
  }>;
  fileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean }>;
  readFile: (filePath: string) => Promise<{ success: boolean; buffer?: string; error?: string }>;
  moveToTrash: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  copyFile: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
  moveFile: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getAppVersion: () => Promise<string>;
  setAutoStart: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  getAutoStart: () => Promise<boolean>;
  onScanProgress: (callback: (progress: any) => void) => () => void;
    generateThumbnail: (filePath: string) => ipcRenderer.invoke('generate-thumbnail', filePath)
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
