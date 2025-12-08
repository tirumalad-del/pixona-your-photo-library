import { useState, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Folder, HardDrive, Database, Palette, Moon, Sun, Volume2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { soundManager } from "@/lib/sounds";

export default function SettingsPage() {
  const [libraryPath, setLibraryPath] = useState("C:\\Users\\Photos");
  const [autoScan, setAutoScan] = useState(false);
  const [watchChanges, setWatchChanges] = useState(false);
  const [faceDetection, setFaceDetection] = useState(true);
  const [autoNameFaces, setAutoNameFaces] = useState(false);
  const [cacheSize, setCacheSize] = useState("2048");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [autoStart, setAutoStart] = useState(false);
  const [aiEditingEnabled, setAiEditingEnabled] = useState(false);

  useEffect(() => {
    // Load settings from database and Electron
    const loadSettings = async () => {
      await soundManager.init();
      setSoundEnabled(soundManager.isEnabled());
      setSoundVolume(soundManager.getVolume());

      // Load auto-start from Electron if available, otherwise from db
      const electron = window.electron as any;
      if (electron?.getAutoStart) {
        try {
          const electronAutoStart = await electron.getAutoStart();
          setAutoStart(electronAutoStart);
        } catch (error) {
          console.error('Failed to get auto-start from Electron:', error);
          const savedAutoStart = await db.getSetting<boolean>('autoStart');
          if (savedAutoStart !== undefined) setAutoStart(savedAutoStart);
        }
      } else {
        const savedAutoStart = await db.getSetting<boolean>('autoStart');
        if (savedAutoStart !== undefined) setAutoStart(savedAutoStart);
      }
      
      // Load AI editing setting
      const savedAiEditing = await db.getSetting<boolean>('aiEditingEnabled');
      if (savedAiEditing !== undefined) setAiEditingEnabled(savedAiEditing);
    };
    loadSettings();
  }, []);

  const handleBrowseFolder = async () => {
    try {
      if (window.electron) {
        const result = await window.electron.selectFolder();
        if (result.success && result.folders && result.folders.length > 0) {
          setLibraryPath(result.folders[0]);
          toast.success("Library path updated");
        } else if (result.error) {
          toast.error(result.error);
        }
      } else {
        toast.error("File picker not available in web mode");
      }
    } catch (error) {
      toast.error("Failed to select folder");
      console.error(error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await db.setSetting('libraryPath', libraryPath);
      await db.setSetting('autoScan', autoScan);
      await db.setSetting('watchChanges', watchChanges);
      await db.setSetting('faceDetection', faceDetection);
      await db.setSetting('autoNameFaces', autoNameFaces);
      await db.setSetting('cacheSize', cacheSize);
      await db.setSetting('theme', theme);
      await db.setSetting('autoStart', autoStart);
      
      soundManager.play('success');
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error('Save settings error:', error);
      soundManager.play('error');
      toast.error("Failed to save settings");
    }
  };

  const handleClearCache = async () => {
    const confirmed = window.confirm("Are you sure you want to clear the thumbnail cache?");
    if (confirmed) {
      try {
        await db.clearAllData();
        soundManager.play('success');
        toast.success("Cache cleared successfully");
      } catch (error) {
        soundManager.play('error');
        toast.error("Failed to clear cache");
      }
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    await soundManager.setEnabled(enabled);
    if (enabled) soundManager.play('click');
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setSoundVolume(newVolume);
    await soundManager.setVolume(newVolume);
  };

  const handleAutoStartToggle = async (enabled: boolean) => {
    setAutoStart(enabled);
    await db.setSetting('autoStart', enabled);
    
    const electron = window.electron as any;
    if (electron?.setAutoStart) {
      try {
        const result = await electron.setAutoStart(enabled);
        if (result.success) {
          soundManager.play('success');
          toast.success(`Auto-start ${enabled ? 'enabled' : 'disabled'}`);
        } else {
          soundManager.play('error');
          toast.error(result.error || 'Failed to set auto-start');
        }
      } catch (error) {
        console.error('Auto-start error:', error);
        soundManager.play('error');
        toast.error('Failed to set auto-start');
      }
    } else {
      toast.info("Auto-start only available in desktop app");
    }
  };

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    toast.success(`Theme changed to ${newTheme} mode`);
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Settings"
        subtitle="Configure PIXONA"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-8">
          {/* Library Settings */}
          <section>
            <h3 className="text-lg font-semibold text-app-text mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Library Settings
            </h3>
            <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
              <div className="space-y-2">
                <Label htmlFor="library-path">Library Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="library-path"
                    value={libraryPath}
                    onChange={(e) => setLibraryPath(e.target.value)}
                    placeholder="C:\Users\Photos"
                    className="flex-1 bg-app-bg border-app-border text-app-text"
                  />
                  <Button variant="outline" onClick={handleBrowseFolder}>
                    Browse
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-scan on startup</Label>
                  <p className="text-sm text-app-text-muted">Automatically scan for new photos</p>
                </div>
                <Switch checked={autoScan} onCheckedChange={setAutoScan} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Watch for changes</Label>
                  <p className="text-sm text-app-text-muted">Monitor folders for new files</p>
                </div>
                <Switch checked={watchChanges} onCheckedChange={setWatchChanges} />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-lg font-semibold text-app-text mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </h3>
            <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(v) => handleThemeChange(v as "dark" | "light")}>
                  <SelectTrigger className="bg-app-bg border-app-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-app-surface border-app-border">
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Face Recognition */}
          <section>
            <h3 className="text-lg font-semibold text-app-text mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Face Recognition
            </h3>
            <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable face detection</Label>
                  <p className="text-sm text-app-text-muted">Detect and group faces in photos</p>
                </div>
                <Switch checked={faceDetection} onCheckedChange={setFaceDetection} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-name faces</Label>
                  <p className="text-sm text-app-text-muted">Suggest names based on metadata</p>
                </div>
                <Switch checked={autoNameFaces} onCheckedChange={setAutoNameFaces} />
              </div>
            </div>
          </section>

          {/* Storage */}
          <section>
            <h3 className="text-lg font-semibold text-app-text mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage & Performance
            </h3>
            <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
              <div className="space-y-2">
                <Label htmlFor="cache-size">Thumbnail Cache Size</Label>
                <Input
                  id="cache-size"
                  type="number"
                  value={cacheSize}
                  onChange={(e) => setCacheSize(e.target.value)}
                  placeholder="2048"
                  className="bg-app-bg border-app-border text-app-text"
                />
                <p className="text-sm text-app-text-muted">Cache size in MB</p>
              </div>

              <Button variant="outline" className="w-full" onClick={handleClearCache}>
                Clear Thumbnail Cache
              </Button>
            </div>
          </section>

          {/* Sound Effects */}
          <section>
            <h3 className="text-lg font-semibold text-app-text mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Sound Effects
            </h3>
            <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable UI sounds</Label>
                  <p className="text-sm text-app-text-muted">Click, open, close sounds</p>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
              </div>

              {soundEnabled && (
                <div className="space-y-2">
                  <Label>Volume</Label>
                  <Slider
                    value={[soundVolume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-app-text-muted">
                    Volume: {Math.round(soundVolume * 100)}%
                  </p>
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => soundManager.play('success')}
                disabled={!soundEnabled}
              >
                Test Sound
              </Button>
            </div>
          </section>

          {/* AI Editing Features */}
          <section>
            <h3 className="text-lg font-semibold text-app-text mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Photo Editing
            </h3>
            <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AI Editing</Label>
                  <p className="text-sm text-app-text-muted">
                    Magic eraser, color conversion, auto-enhance
                  </p>
                </div>
                <Switch 
                  checked={aiEditingEnabled} 
                  onCheckedChange={async (enabled) => {
                    setAiEditingEnabled(enabled);
                    await db.setSetting('aiEditingEnabled', enabled);
                    soundManager.play('click');
                    toast.success(`AI editing ${enabled ? 'enabled' : 'disabled'}`);
                  }} 
                />
              </div>
              
              {aiEditingEnabled && (
                <div className="pt-2 text-sm text-app-text-muted space-y-1">
                  <p>• Brightness, contrast, saturation adjustments</p>
                  <p>• Black & white ↔ Color conversion</p>
                  <p>• Metadata editing (date, location)</p>
                  <p>• Resize and crop (coming soon)</p>
                  <p>• Magic eraser (coming soon)</p>
                </div>
              )}
            </div>
          </section>

          {/* Windows Settings */}
          {window.electron && (
            <section>
              <h3 className="text-lg font-semibold text-app-text mb-4">
                Windows Settings
              </h3>
              <div className="space-y-4 bg-app-surface rounded-lg p-4 border border-app-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Start with Windows</Label>
                    <p className="text-sm text-app-text-muted">Launch PIXONA on system startup</p>
                  </div>
                  <Switch checked={autoStart} onCheckedChange={handleAutoStartToggle} />
                </div>
              </div>
            </section>
          )}

          <div className="pt-4">
            <Button 
              className="bg-app-accent hover:bg-app-accent-hover"
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
