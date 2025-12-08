import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { mockAlbums } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Albums() {
  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Albums"
        subtitle="Your photo collections"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <Button className="bg-app-accent hover:bg-app-accent-hover">
            <Plus className="w-4 h-4 mr-2" />
            New Album
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mockAlbums.map((album, idx) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group cursor-pointer"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-app-surface mb-3 hover:ring-2 hover:ring-app-accent transition-all">
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-app-text truncate">{album.name}</h3>
                <p className="text-sm text-app-text-muted">{album.photoCount} photos</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <StatusBar itemCount={mockAlbums.length} viewMode="Grid" />
    </div>
  );
}
