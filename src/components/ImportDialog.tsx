import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Folder, HardDrive, Cloud } from "lucide-react";
import { toast } from "sonner";
import { db, PhotoMetadata } from "@/lib/db";
import { soundManager } from "@/lib/sounds";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPath, setCurrentPath] = useState("");
  const [filesFound, setFilesFound] = useState(0);

  const handleImportFromFolder = async () => {
    try {
      if (!window.electron) {
        toast.error("File picker not available in web mode");
        return;
      }

      const result = await window.electron.selectFolder();
      if (result.success && result.folders && result.folders.length > 0) {
        soundManager.play('select');
        setImporting(true);
        setProgress(0);
        setFilesFound(0);

        // Listen for progress updates
        const unsubscribe = window.electron.onScanProgress((data) => {
          setCurrentPath(data.currentPath);
          setFilesFound(data.filesFound);
        });

        // Scan the selected folders
        const allFiles: any[] = [];
        for (const folder of result.folders) {
          const scanResult = await window.electron.scanDirectory(folder);
          if (scanResult.success && scanResult.files) {
            allFiles.push(...scanResult.files);
          }
        }

        unsubscribe();

        // Import files to database
        const photos: PhotoMetadata[] = allFiles.map((file, index) => ({
          id: `photo-${Date.now()}-${index}`,
          path: file.path,
          name: file.name,
          type: file.type,
          size: file.size,
          created: new Date(file.created),
          modified: new Date(file.modified),
          imported: new Date(),
          tags: [],
          albumIds: [],
          peopleIds: [],
        }));

        // Batch add to database
        const batchSize = 100;
        for (let i = 0; i < photos.length; i += batchSize) {
          const batch = photos.slice(i, i + batchSize);
          await db.addPhotos(batch);
          setProgress(Math.round((i / photos.length) * 100));
        }

        setProgress(100);
        soundManager.play('success');
        toast.success(`Imported ${photos.length} files successfully`);
        
        setTimeout(() => {
          setImporting(false);
          onOpenChange(false);
          window.location.reload(); // Refresh to show imported photos
        }, 1000);
      }
    } catch (error) {
      console.error('Import error:', error);
      soundManager.play('error');
      toast.error("Failed to import files");
      setImporting(false);
    }
  };

  const handleImportFromDrive = async () => {
    try {
      if (!window.electron) {
        toast.error("Drive access not available in web mode");
        return;
      }

      const drivesResult = await window.electron.getDrives();
      if (drivesResult.success && drivesResult.drives) {
        toast.info(`Available drives: ${drivesResult.drives.join(', ')}`);
        // For now, just trigger folder picker
        handleImportFromFolder();
      }
    } catch (error) {
      console.error('Drive access error:', error);
      toast.error("Failed to access drives");
    }
  };

  const handleImportFromCloud = () => {
    toast.info("OneDrive/Cloud import coming soon!");
  };

  return (
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
                <span>Importing files...</span>
                <span>{filesFound} files found</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {currentPath && (
              <p className="text-xs text-app-text-muted truncate">
                Scanning: {currentPath}
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
              onClick={handleImportFromDrive}
            >
              <HardDrive className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">From Drive</div>
                <div className="text-xs text-app-text-muted">
                  Scan entire drives (C:/, D:/, etc.)
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
              onClick={handleImportFromCloud}
            >
              <Cloud className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">From OneDrive</div>
                <div className="text-xs text-app-text-muted">
                  Import from cloud storage (coming soon)
                </div>
              </div>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
