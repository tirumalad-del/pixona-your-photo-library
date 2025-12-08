export interface ElectronAPI {
  getDrives: () => Promise<{ success: boolean; drives?: string[]; error?: string }>;
  selectFolder: () => Promise<{ success: boolean; folders?: string[]; canceled?: boolean; error?: string }>;
  scanDirectory: (directoryPath: string) => Promise<{ 
    success: boolean; 
    files?: any[]; 
    totalFiles?: number; 
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
  onScanProgress: (callback: (progress: any) => void) => () => void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
