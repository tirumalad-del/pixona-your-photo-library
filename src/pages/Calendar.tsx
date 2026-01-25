import { useState, useMemo } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { Lightbox } from "@/components/Lightbox";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import { Button } from "@/components/ui/button";

export default function Calendar() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const photos = useLiveQuery(() => db.photos.toArray()) || [];

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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: typeof photos } = {};
    
    photos.forEach((photo) => {
      try {
        const date = parseISO(photo.date);
        const year = format(date, "yyyy");
        const month = format(date, "MMMM");
        
        if (year === selectedYear) {
          if (!groups[month]) groups[month] = [];
          groups[month].push(photo);
        }
      } catch (e) {
        // Handle invalid dates
      }
    });
    
    return groups;
  }, [photos, selectedYear]);

  const activePhotos = useMemo(() => {
    if (selectedMonth) {
      return groupedPhotos[selectedMonth] || [];
    }
    return Object.values(groupedPhotos).flat();
  }, [groupedPhotos, selectedMonth]);

  const handlePhotoClick = (photo: any) => {
    const index = activePhotos.findIndex(p => p.path === photo.path);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Calendar"
        subtitle={`${photos.length} photos organized by date`}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 mb-8 overflow-hidden items-center">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
            <Button
              variant={selectedMonth === null ? "default" : "ghost"}
              onClick={() => setSelectedMonth(null)}
              className="whitespace-nowrap"
            >
              All Months
            </Button>
            {months.map(month => (
              <Button
                key={month}
                variant={selectedMonth === month ? "default" : "ghost"}
                onClick={() => setSelectedMonth(month)}
                disabled={!groupedPhotos[month]}
                className="whitespace-nowrap"
              >
                {month}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {months.filter(m => !selectedMonth || m === selectedMonth).map((month) => {
            const monthPhotos = groupedPhotos[month];
            if (!monthPhotos) return null;

            return (
              <div key={month}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  {month}
                  <span className="text-sm font-normal text-gray-500">
                    ({monthPhotos.length} items)
                  </span>
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {monthPhotos.map((photo, idx) => (
                    <motion.div
                      key={photo.path}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="aspect-square rounded-lg overflow-hidden bg-app-card cursor-pointer group relative shadow-md"
                      onClick={() => handlePhotoClick(photo)}
                    >
                      <img
                        src={`file://${photo.path}`}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      {photo.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                          <Video className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {activePhotos.length === 0 && photos.length > 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No photos found for the selected period.</p>
          </div>
        )}

        {photos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No photos found in database. Start a scan to see your calendar.</p>
          </div>
        )}
      </div>

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={activePhotos.map(p => ({
          url: `file://${p.path}`,
          type: p.type,
          name: p.name
        }))}
        initialIndex={lightboxIndex}
      />
      <StatusBar />
    </div>
  );
}
