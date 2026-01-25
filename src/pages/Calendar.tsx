import { useState, useMemo, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { Lightbox } from "@/components/Lightbox";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { getPhotosFromBackend } from "../lib/db";

export default function Calendar() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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

  const years = useMemo(() => {
    if (photos.length === 0) return [new Date().getFullYear().toString()];
    const y = photos.map(p => {
      try {
        return format(parseISO(p.date), 'yyyy');
      } catch (e) {
        return new Date().getFullYear().toString();
      }
    });
    return Array.from(new Set(y)).sort().reverse();
  }, [photos]);

  const groupedByMonth = useMemo(() => {
    return photos
      .filter(p => {
        try {
          const year = format(parseISO(p.date), 'yyyy');
          return year === selectedYear;
        } catch (e) {
          return false;
        }
      })
      .reduce((acc, photo) => {
        try {
          const month = format(parseISO(photo.date), 'MMMM yyyy');
          if (!acc[month]) acc[month] = [];
          acc[month].push(photo);
        } catch (e) {
          // Skip photos with invalid dates
        }
        return acc;
      }, {} as Record<string, typeof photos>);
  }, [photos, selectedYear]);

  const filteredPhotos = useMemo(() => {
    if (!selectedMonth) return [];
    return groupedByMonth[selectedMonth] || [];
  }, [groupedByMonth, selectedMonth]);

  return (
    <div className="flex flex-col h-screen">
      <ViewHeader title="Calendar">
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth || ""} onValueChange={v => setSelectedMonth(v || null)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(groupedByMonth).map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ViewHeader>

      <div className="flex-1 overflow-auto p-6">
        {!selectedMonth ? (
          <div className="text-center text-muted-foreground mt-20">
            Select a month to view photos
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20">
            No photos found for {selectedMonth}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square group cursor-pointer"
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={photo.thumbnail || photo.path}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                {photo.type === 'video' && (
                  <div className="absolute top-2 right-2 bg-black/50 rounded p-1">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && filteredPhotos.length > 0 && (
        <Lightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

      <StatusBar totalPhotos={photos.length} />
    </div>
  );
}
