import { useState, useMemo, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";
import { getPhotosFromBackend } from "../lib/db";

export default function Albums() {
  const [photos, setPhotos] = useState<any[]>([]);

  // Load photos from backend
  useEffect(() => {
    const loadPhotos = async () => {
      const backendPhotos = await getPhotosFromBackend();
      setPhotos(backendPhotos);
    };
    loadPhotos();

    // Listen for live updates from scanner
    const handlePhotoUpdate = () => {
      loadPhotos();
    };

    window.electron?.on('photos-updated', handlePhotoUpdate);

    return () => {
      window.electron?.off('photos-updated', handlePhotoUpdate);
    };
  }, []);

  // Group photos by folder to create automatic albums
  const albumsMap = useMemo(() => {
    return photos.reduce((acc, photo) => {
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
  }, [photos]);

  const albums = Object.values(albumsMap);

  return (
    <div className="flex flex-col h-screen">
      <ViewHeader title="Albums">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Album
        </Button>
      </ViewHeader>

      <div className="flex-1 overflow-auto p-6">
        {albums.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20">
            No albums yet. Photos will be automatically grouped by folder.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {albums.map(album => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square mb-2 bg-muted rounded-lg overflow-hidden">
                  {album.cover ? (
                    <img
                      src={album.cover}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <h3 className="font-medium truncate">{album.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {album.count} {album.count === 1 ? 'photo' : 'photos'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <StatusBar totalPhotos={photos.length} />
    </div>
  );
}
