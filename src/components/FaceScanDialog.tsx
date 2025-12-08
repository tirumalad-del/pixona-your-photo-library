import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { faceRecognition } from "@/lib/faceRecognition";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { Scan } from "lucide-react";

interface FaceScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function FaceScanDialog({ open, onOpenChange, onComplete }: FaceScanDialogProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState("");

  const handleScan = async () => {
    setScanning(true);
    setProgress(0);

    try {
      // Get all photos
      const photos = await db.getAllPhotos();
      const imagePhotos = photos.filter(p => p.type === 'image');

      // Load face recognition models
      await faceRecognition.loadModels();
      toast.info("Face recognition models loaded");

      // Cluster faces
      let processed = 0;
      const clusters = await faceRecognition.clusterFaces(imagePhotos);

      // Generate people from clusters
      const people = await faceRecognition.generatePeopleFromClusters(clusters);

      // Save to database
      for (const person of people) {
        await db.addPerson(person);
      }

      toast.success(`Found ${people.length} people in your photos!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Face scan failed:", error);
      toast.error("Failed to scan faces. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan for Faces</DialogTitle>
          <DialogDescription>
            Detect and group faces in your photo library
          </DialogDescription>
        </DialogHeader>

        {scanning ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Scan className="w-12 h-12 text-app-accent animate-pulse" />
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-app-text-muted">{currentPhoto}</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-app-text-muted">
              This will scan all photos in your library and automatically group them by the people detected.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleScan} className="flex-1">
                Start Scan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
