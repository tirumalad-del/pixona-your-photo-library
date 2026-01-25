import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { useState } from "react";
import { motion } from "framer-motion";
import { db } from "../db/database";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { FaceScanDialog } from "@/components/FaceScanDialog";
import { Scan, User } from "lucide-react";

export default function People() {
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  
  // Use live query to update UI automatically during face recognition/scanning
  const people = useLiveQuery(() => db.people.toArray()) || [];

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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {people.map((person, idx) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="w-full aspect-square rounded-full overflow-hidden bg-app-card border-4 border-transparent group-hover:border-app-accent transition-all relative">
                {person.thumbnail ? (
                  <img
                    src={`file://${person.thumbnail}`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <User className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm font-medium group-hover:text-app-accent transition-colors">
                {person.name || "Unknown Person"}
              </p>
              <p className="text-xs text-gray-500">{person.photoCount || 0} photos</p>
            </motion.div>
          ))}
        </div>

        {people.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <User className="w-16 h-16 mb-4 opacity-20" />
            <p>No people identified yet. Start a scan to find faces in your library.</p>
          </div>
        )}
      </div>

      <FaceScanDialog 
        open={scanDialogOpen} 
        onOpenChange={setScanDialogOpen} 
      />
      <StatusBar />
    </div>
  );
}
