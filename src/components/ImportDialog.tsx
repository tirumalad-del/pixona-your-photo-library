import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Folder, HardDrive, Cloud, Copy, Move, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { db, PhotoMetadata } from "@/lib/db";
import { soundManager } from "@/lib/sounds";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPath, setCurrentPath] = useState("");
  const [filesFound, setFilesFound] = useState(0);
  const [importMode, setImportMode] = useState<"copy" | "move">("copy");
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [duplicateOption, setDuplicateOption] = useState<"overwrite" | "rename" | "skip">("rename");

  const handleImportFromFolder = async () => {
    try {
      if (!window.electron) {
        toast.error("File picker not available in web mode");
        return;
      }
      const result = await window.electron.selectFolder();
      if (result.success && result.folders && result.folders.length > 0) {
        setSelectedFolders(result.folders);
        setShowModeDialog(true);
      }
    } catch (error) {
      console.error('Select folder error:', error);
      toast.error("Failed to select folder");
    }
  };

  const startImport = async () => {
    setShowModeDialog(false);
    setImporting(true);
    setProgress(0);
    setFilesFound(0);

    try {
      const electron = window.electron;
      
      // Get target library path from settings
      const libraryPath = await db.getSetting<string>('libraryPath') || "C:\\Users\\Photos";

      // Listen for progress updates from main process
      const unsubscribe = electron.onScanProgress((data: any) => {
        setCurrentPath(data.currentPath);
        setFilesFound(data.filesFound);
      });

      const allFiles: any[] = [];
      for (const folder of selectedFolders) {
        const scanResult = await electron.scanDirectory(folder);
        if (scanResult.success && scanResult.files) {
          allFiles.push(...scanResult.files);
        }
      }
      unsubscribe();

      const photos: PhotoMetadata[] = [];
      
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const destPath = `${libraryPath}\\${file.name}`;
        let finalPath = destPath;

        // Duplicate Handling Logic
        const checkResult = await electron.fileExists(destPath);
        if (checkResult.exists) {
          if (duplicateOption === 'skip') continue;
          if (duplicateOption === 'rename') {
            let suffix = 1;
            const ext = file.extension;
            const baseName = file.name.replace(ext, '');
            // Loop until a unique filename is found
            while ((await electron.fileExists(`${libraryPath}\\${baseName}_${suffix}${ext}`)).exists) {
              suffix++;
            }
            finalPath = `${libraryPath}\\${baseName}_${suffix}${ext}`;
          }
          // If option is 'overwrite', finalPath stays as destPath
        }

        // Execute file transfer (Copy or Move)
        if (importMode === 'move') {
          await electron.moveFile(file.path, finalPath);
        } else {
          await electron.copyFile(file.path, finalPath);
        }

        // Prepare database record
        photos.push({
          id: `photo-${Date.now()}-${i}`,
          path: finalPath,
          name: finalPath.split('\\').pop() || file.name,
          type: file.type,
          size: file.size,
          created: new Date(file.created),
          modified: new Date(file.modified),
          imported: new Date(),
          tags: [],
          albumIds: [],
          peopleIds: [],
        });

        setProgress(Math.round(((i + 1) / allFiles.length) * 100));
      }

      // Batch add records to the local IndexedDB
      const batchSize = 100;
      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        await db.addPhotos(batch);
      }

      soundManager.play('success');
      toast.success(`${importMode === 'move' ? 'Moved' : 'Copied'} ${photos.length} files successfully`);
      
      setTimeout(() => {
        setImporting(false);
        onOpenChange(false);
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Import error:', error);
      soundManager.play('error');
      toast.error("Failed to import files");
      setImporting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-app-surface border-app-border">
          <DialogHeader>
            <DialogTitle className="text-app-text">Import Photos & Videos</DialogTitle>
            <DialogDescription className="text-app-text-muted">
              Choose a source to import your media files
            </DialogDescription>
          </DialogHeader>

          {importing ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-app-text-muted">
                  <span>{importMode === 'move' ? 'Moving' : 'Copying'} files...</span>
                  <span>{filesFound} files found</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              {currentPath && (
                <p className="text-xs text-app-text-muted truncate">
                  Processing: {currentPath}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={handleImportFromFolder}
              >
                <Folder className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">From Folder</div>
                  <div className="text-xs text-app-text-muted">
                    Select folders containing photos and videos
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={async () => {
                  const result = await window.electron.getDrives();
                  if (result.success && result.drives) {
                    handleImportFromFolder();
                  }
                }}
              >
                <HardDrive className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">From Drive</div>
                  <div className="text-xs text-app-text-muted">
                    Scan entire drives (C:/, D:/, etc.)
                  </div>
                </div>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Options Sub-Dialog */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="bg-app-surface border-app-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-app-text flex items-center gap-2">
              Import Options
            </DialogTitle>
            <DialogDescription className="text-app-text-muted">
              Specify how PIXONA should process the files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-app-text font-medium">Transfer Method</Label>
              <RadioGroup value={importMode} onValueChange={(v: any) => setImportMode(v)} className="grid grid-cols-2 gap-4">
                <div className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer ${importMode === 'copy' ? 'border-app-accent bg-app-accent/10' : 'border-app-border'}`} onClick={() => setImportMode('copy')}>
                  <RadioGroupItem value="copy" id="copy" />
                  <Label htmlFor="copy" className="cursor-pointer flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copy Files
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer ${importMode === 'move' ? 'border-app-accent bg-app-accent/10' : 'border-app-border'}`} onClick={() => setImportMode('move')}>
                  <RadioGroupItem value="move" id="move" />
                  <Label htmlFor="move" className="cursor-pointer flex items-center gap-2">
                    <Move className="w-4 h-4" /> Move Files
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-app-text-muted">
                {importMode === 'move' ? 'Source files will be relocated to your library.' : 'Copies will be made; source files remain untouched.'}
              </p>
            </div>

            <div className="space-y-3">Implement Copy/Move and Duplicate handling in ImportDialog

- Added choice between Copy and Move transfer methods.
- Added duplicate handling: Rename (with _1, _2 suffix), Overwrite, and Skip.
- Integrated file system operations via Electron bridge.
- Added automatic filename conflict resolution for 'Rename' option.
              <Label className="text-app-text font-medium">If Duplicate Exists</Label>
              <RadioGroup value={duplicateOption} onValueChange={(v: any) => setDuplicateOption(v)} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rename" id="rename" />
                  <Label htmlFor="rename">Rename (Add _1, _2 suffix to filename)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite">Overwrite (Replace file in library)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip">Skip (Do not import this file)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModeDialog(false)}>Cancel</Button>
              <Button className="bg-app-accent hover:bg-app-accent-hover" onClick={startImport}>
                Start Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
