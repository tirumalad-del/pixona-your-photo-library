import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const settingsPath = path.join(app.getPath('userData'), 'pixona-settings.json');

export type AppSettings = {
  libraryRoot: string | null;
  lastScanTime: string | null;
};

export function getSettings(): AppSettings {
  if (!fs.existsSync(settingsPath)) {
    return { libraryRoot: null, lastScanTime: null };
  }
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch (err) {
    console.error('Failed to read settings:', err);
    return { libraryRoot: null, lastScanTime: null };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
