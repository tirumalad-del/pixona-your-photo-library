import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbox } from "@/components/Lightbox";
import { Video, Check } from "lucide-react";
import { soundManager } from "@/lib/sounds";

interface Photo {
  id: string;
  url: string;
  date: string;
  location?: string;
  type?: 'photo' | 'video';
}

interface PhotoGridProps {
  photos: Photo[];
  selectionMode?: boolean;
  selectedIds?: string[];
  onPhotoClick?: (id: string) => void;
}

export function PhotoGrid({ photos, selectionMode = false, selectedIds = [], onPhotoClick }: PhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handlePhotoClick = (id: string, index: number) => {
    if (selectionMode && onPhotoClick) {
      soundManager.play('select');
      onPhotoClick(id);
    } else if (!selectionMode) {
      soundManager.play('open');
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleLightboxClose = () => {
    soundManager.play('close');
    setLightboxOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-1 p-4">
        {photos.map((photo, idx) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: idx * 0.01 }}
            className="photo-grid-item aspect-square bg-muted relative group"
            onClick={() => handlePhotoClick(photo.id, idx)}
          >
            <img
              src={photo.url}
              alt={`Photo from ${photo.date}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            
            {/* Video badge */}
            {photo.type === 'video' && (
              <div className="video-badge">
                <Video className="w-3 h-3" />
                <span>Video</span>
              </div>
            )}
            
            {/* Selection indicator */}
            {selectionMode && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`selection-checkbox ${selectedIds.includes(photo.id) ? 'selected' : ''}`}
              >
                {selectedIds.includes(photo.id) && (
                  <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                )}
              </motion.div>
            )}
            
            {/* Selected overlay */}
            {selectedIds.includes(photo.id) && (
              <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded-lg" />
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            media={photos}
            initialIndex={lightboxIndex}
            onClose={handleLightboxClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}
