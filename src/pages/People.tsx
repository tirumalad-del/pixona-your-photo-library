import { useState, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaceScanDialog } from "@/components/FaceScanDialog";
import { Scan, User } from "lucide-react";
import { getPeopleFromBackend } from "../lib/db";

export default function People() {
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [people, setPeople] = useState<any[]>([]);

  // Load people from backend
  useEffect(() => {
    const loadPeople = async () => {
      const backendPeople = await getPeopleFromBackend();
      setPeople(backendPeople);
    };
    loadPeople();

    // Listen for live updates from scanner
    const handlePhotoUpdate = () => {
      loadPeople();
    };

    window.electron?.on('photos-updated', handlePhotoUpdate);

    return () => {
      window.electron?.off('photos-updated', handlePhotoUpdate);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="People"
        subtitle="Organized by face recognition"
      />

      <div className="p-4 border-b border-app-border">
        <Button
          variant="outline"
          onClick={() => setScanDialogOpen(true)}
          className="bg-app-accent/10 border-app-accent/20 hover:bg-app-accent/20"
        >
          <Scan className="w-4 h-4 mr-2" />
          Scan for Faces
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {people.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No people detected yet.</p>
            <p className="text-sm mt-2">Click "Scan for Faces" to start face recognition.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {people.map(person => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square mb-2 bg-muted rounded-full overflow-hidden">
                  {person.thumbnail ? (
                    <img
                      src={person.thumbnail}
                      alt={person.name || 'Unknown'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full" />
                </div>
                <h3 className="font-medium text-center truncate">
                  {person.name || 'Unknown'}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {person.photoCount || 0} {person.photoCount === 1 ? 'photo' : 'photos'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <FaceScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
      />

      <StatusBar totalPhotos={0} />
    </div>
  );
}
