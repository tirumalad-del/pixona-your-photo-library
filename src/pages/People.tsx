import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, Person } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { FaceScanDialog } from "@/components/FaceScanDialog";
import { Scan } from "lucide-react";

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    const allPeople = await db.getAllPeople();
    setPeople(allPeople);
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="People"
        subtitle="Organized by face recognition"
      />
      
      <div className="p-4 border-b border-app-border">
        <Button onClick={() => setScanDialogOpen(true)} className="gap-2">
          <Scan className="w-4 h-4" />
          Scan for Faces
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Scan className="w-24 h-24 text-app-accent mb-4" />
            <h3 className="text-xl font-semibold text-app-text mb-2">
              No People Found
            </h3>
            <p className="text-app-text-muted max-w-md mb-4">
              Scan your photo library to automatically detect and group photos by the people in them.
            </p>
            <Button onClick={() => setScanDialogOpen(true)} className="gap-2">
              <Scan className="w-4 h-4" />
              Start Face Recognition Scan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {people.map((person, idx) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="aspect-square rounded-full overflow-hidden bg-app-surface mb-3 ring-2 ring-transparent hover:ring-app-accent transition-all">
                  {person.avatarPhotoId && (
                    <img
                      src={person.avatarPhotoId}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-app-text">{person.name}</h3>
                  <p className="text-sm text-app-text-muted">{person.photoIds.length} photos</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <StatusBar itemCount={people.length} viewMode="Grid" />
      
      <FaceScanDialog 
        open={scanDialogOpen} 
        onOpenChange={setScanDialogOpen}
        onComplete={loadPeople}
      />
    </div>
  );
}
