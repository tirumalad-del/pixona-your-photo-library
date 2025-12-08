import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { soundManager } from "@/lib/sounds";
import { Scan, Trash2, Copy } from "lucide-react";
import { db, PhotoMetadata } from "@/lib/db";
import { perceptualHash } from "@/lib/perceptualHash";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface DuplicatePhoto {
  id: string;
  url: string;
  date: string;
  size: number;
}

interface DuplicateGroup {
  original: DuplicatePhoto;
  duplicates: DuplicatePhoto[];
}

export default function Duplicates() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());

  useEffect(() => {
    scanForDuplicates();
  }, []);

  const scanForDuplicates = async () => {
    setScanning(true);
    setProgress(0);
    soundManager.play('select');

    try {
      const photos = await db.getAllPhotos();
      const imagePhotos = photos.filter(p => p.type === 'image');
      
      setProgress(30);

      // Find similar images using perceptual hashing
      const similarGroups = await perceptualHash.findSimilarImages(
        imagePhotos.map(p => ({ id: p.id, path: p.path, hash: p.hash }))
      );

      setProgress(70);

      // Convert to duplicate groups
      const groups: DuplicateGroup[] = [];
      for (const [originalId, similarIds] of similarGroups.entries()) {
        const original = photos.find(p => p.id === originalId);
        const duplicates = similarIds
          .filter(id => id !== originalId)
          .map(id => photos.find(p => p.id === id))
          .filter(Boolean) as PhotoMetadata[];

        if (original && duplicates.length > 0) {
          groups.push({
            original: {
              id: original.id,
              url: original.path,
              date: original.created.toString(),
              size: original.size,
            },
            duplicates: duplicates.map(d => ({
              id: d.id,
              url: d.path,
              date: d.created.toString(),
              size: d.size,
            })),
          });
        }
      }

      setDuplicateGroups(groups);
      setProgress(100);
      
      if (groups.length > 0) {
        toast.success(`Found ${groups.reduce((acc, g) => acc + g.duplicates.length, 0)} duplicate photos`);
        soundManager.play('success');
      } else {
        toast.info("No duplicates found!");
      }
    } catch (error) {
      console.error('Duplicate scan failed:', error);
      toast.error("Failed to scan for duplicates");
      soundManager.play('error');
    } finally {
      setScanning(false);
    }
  };

  const toggleSelection = (photoId: string) => {
    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) {
      toast.error("No photos selected for deletion");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to move ${selectedForDeletion.size} photo${selectedForDeletion.size > 1 ? 's' : ''} to trash?`
    );

    if (confirmed) {
      try {
        // Move to trash using Electron IPC
        for (const photoId of selectedForDeletion) {
          const photo = await db.getPhoto(photoId);
          if (photo && window.electron) {
            await window.electron.moveToTrash(photo.path);
          }
        }

        // Remove from database
        await db.deletePhotos(Array.from(selectedForDeletion));
        
        // Update UI
        setDuplicateGroups(prev => 
          prev
            .map(group => ({
              ...group,
              duplicates: group.duplicates.filter(d => !selectedForDeletion.has(d.id)),
            }))
            .filter(group => group.duplicates.length > 0)
        );
        
        setSelectedForDeletion(new Set());
        toast.success(`${selectedForDeletion.size} photo${selectedForDeletion.size > 1 ? 's' : ''} moved to trash`);
        soundManager.play('delete');
      } catch (error) {
        console.error('Failed to delete photos:', error);
        toast.error("Failed to delete photos");
        soundManager.play('error');
      }
    }
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0);

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Duplicates"
        subtitle="Find and manage duplicate photos"
      />
      
      <div className="flex-1 overflow-auto">
        {scanning ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Scan className="w-16 h-16 text-app-accent mb-4 animate-pulse" />
            <p className="text-app-text-muted mb-4">Scanning for duplicates...</p>
            <Progress value={progress} className="w-64" />
          </div>
        ) : duplicateGroups.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="w-24 h-24 rounded-full bg-app-surface flex items-center justify-center mx-auto mb-4">
                <Copy className="w-12 h-12 text-app-accent" />
              </div>
              <h3 className="text-xl font-semibold text-app-text mb-2">
                Duplicate Detection
              </h3>
              <p className="text-app-text-muted mb-6">
                Advanced duplicate detection using file hashes and perceptual hashing 
                to find exact and similar photos. Free up storage space safely.
              </p>
              <Button 
                className="bg-app-accent hover:bg-app-accent-hover"
                onClick={scanForDuplicates}
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan for Duplicates
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-app-text">
                  Found {duplicateGroups.length} Duplicate Group{duplicateGroups.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-app-text-muted">
                  {totalDuplicates} potential duplicate{totalDuplicates > 1 ? 's' : ''} • {selectedForDeletion.size} selected
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={scanForDuplicates}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
                <Button 
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleDeleteSelected}
                  disabled={selectedForDeletion.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>

            {duplicateGroups.map((group, groupIdx) => (
              <motion.div
                key={group.original.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.1 }}
                className="bg-app-surface rounded-lg p-4 border border-app-border"
              >
                <h4 className="text-sm font-medium text-app-text mb-3">
                  Duplicate Group {groupIdx + 1}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Original */}
                  <div className="space-y-2">
                    <div className="aspect-square bg-app-bg rounded overflow-hidden border-2 border-app-accent">
                      <img
                        src={group.original.url}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-app-text text-center font-medium">
                      Original
                    </p>
                  </div>

                  {/* Duplicates */}
                  {group.duplicates.map((duplicate) => (
                    <div key={duplicate.id} className="space-y-2 relative">
                      <div 
                        className={`aspect-square bg-app-bg rounded overflow-hidden cursor-pointer border-2 transition-colors ${
                          selectedForDeletion.has(duplicate.id) 
                            ? 'border-destructive' 
                            : 'border-transparent hover:border-app-border'
                        }`}
                        onClick={() => toggleSelection(duplicate.id)}
                      >
                        <img
                          src={duplicate.url}
                          alt="Duplicate"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {selectedForDeletion.has(duplicate.id) && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center pointer-events-none">
                          <Trash2 className="w-8 h-8 text-destructive" />
                        </div>
                      )}
                      <p className="text-xs text-app-text-muted text-center">
                        Duplicate
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <StatusBar itemCount={totalDuplicates} viewMode="List" />
    </div>
  );
}
