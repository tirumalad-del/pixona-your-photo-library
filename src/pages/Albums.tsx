import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";

export default function Albums() {
  const photos = useLiveQuery(() => db.photos.toArray()) || [];

  // Group photos by folder to create automatic albums
  const albumMap = photos.reduce((acc, photo) => {
    const parts = photo.path.split(/[\\\/]/);
    const folder = parts.length > 1 ? parts[parts.length - 2] : 'Unsorted';
    
    if (!acc[folder]) {
      acc[folder] = {
        id: folder,
        title: folder,
        count: 0,
        cover: photo.path
      };
    }
    acc[folder].count++;
    return acc;
  }, {} as Record<string, any>);

  const albums = Object.values(albumMap);

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Albums"
        subtitle={`${albums.length} collections found`}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <Button className="bg-app-accent hover:bg-app-accent-hover">
            <Plus className="w-4 h-4 mr-2" />
            New Album
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.map((album, idx) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group cursor-pointer"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-app-card relative mb-3 shadow-lg group-hover:shadow-xl transition-all">
                {album.cover ? (
                  <img
                    src={`file://${album.cover}`}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Folder className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-sm font-semibold truncate">{album.title}</p>
                  <p className="text-xs opacity-80">{album.count} items</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {albums.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Folder className="w-16 h-16 mb-4 opacity-20" />
            <p>No albums found. Start scanning to see your collections.</p>
          </div>
        )}
      </div>
      <StatusBar />
    </div>
  );
}
