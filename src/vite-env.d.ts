/// <reference types="vite/client" />

interface ElectronAPI {
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
}

interface Window {
  electron?: ElectronAPI;
}
