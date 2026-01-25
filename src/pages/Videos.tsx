import { useState, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { PhotoGrid } from "@/components/PhotoGrid";
import { StatusBar } from "@/components/StatusBar";
import { Lightbox } from "@/components/Lightbox";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { getPhotosFromBackend } from "../lib/db";

export default function Videos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv', '.flv', '.3gp'];

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      const allPhotos = await getPhotosFromBackend();
      const videoFiles = allPhotos.filter(p => {
        const ext = p.path.toLowerCase().slice(p.path.lastIndexOf('.'));
        return VIDEO_EXTENSIONS.includes(ext) || p.type === 'video';
      });
      setVideos(videoFiles);
      setLoading(false);
    };

    loadVideos();

    // Listen for live updates from scanner
    const handlePhotoUpdate = () => {
      loadVideos();
    };

    window.electron?.on('photos-updated', handlePhotoUpdate);

    return () => {
      window.electron?.off('photos-updated', handlePhotoUpdate);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <ViewHeader title="Videos" subtitle="All your video files" />

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-muted-foreground mt-20">
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No videos found in your library</p>
            <p className="text-sm mt-2">Import folders with video files to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video group cursor-pointer"
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <video
                  src={video.path}
                  className="w-full h-full object-cover rounded-lg"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                <div className="absolute top-2 right-2 bg-black/50 rounded p-1">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div className="absolute bottom-2 left-2 bg-black/75 rounded px-2 py-1 text-xs text-white">
                  {video.name}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && videos.length > 0 && (
        <Lightbox
          photos={videos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

      <StatusBar totalPhotos={videos.length} />
    </div>
  );
}
