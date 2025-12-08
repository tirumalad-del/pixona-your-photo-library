import { useState, useMemo } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { Lightbox } from "@/components/Lightbox";
import { mockPhotos } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Calendar() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const years = ["2024", "2023", "2022"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group photos by month/year
  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: { [key: string]: { [key: string]: typeof mockPhotos } } } = {};
    
    mockPhotos.forEach((photo) => {
      const date = parseISO(photo.date);
      const year = format(date, "yyyy");
      const month = format(date, "MMMM");
      const day = format(date, "MMMM d, yyyy");
      
      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = {};
      if (!groups[year][month][day]) groups[year][month][day] = [];
      groups[year][month][day].push(photo);
    });
    
    return groups;
  }, []);

  const openLightbox = (index: number, monthPhotos: typeof mockPhotos) => {
    const globalIndex = mockPhotos.findIndex(p => p.id === monthPhotos[index].id);
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  };

  const filteredData = selectedMonth 
    ? groupedPhotos[selectedYear]?.[selectedMonth] || {}
    : groupedPhotos[selectedYear] || {};

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Calendar"
        subtitle="Photos organized by date"
      />

      {/* Year/Month Picker */}
      <div className="p-4 border-b border-sidebar-border flex gap-3">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32 bg-app-surface border-sidebar-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-app-surface border-sidebar-border">
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth || "all"} onValueChange={(v) => setSelectedMonth(v === "all" ? null : v)}>
          <SelectTrigger className="w-40 bg-app-surface border-sidebar-border">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent className="bg-app-surface border-sidebar-border">
            <SelectItem value="all">All Months</SelectItem>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {selectedMonth ? (
          // Date view - grouped by date
          <div className="space-y-8">
            {Object.entries(filteredData).map(([date, photos]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-app-text mb-3">{date}</h3>
                <div className="grid grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-1">
                  {photos.map((photo, idx) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="aspect-square bg-app-surface rounded-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-app-accent transition-all relative"
                      onClick={() => openLightbox(idx, photos)}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo from ${photo.date}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {photo.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                          <Video className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Month view - grouped by month
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(filteredData).map(([month, dates]) => {
              const dateGroups = dates as { [key: string]: typeof mockPhotos };
              const allPhotos = Object.values(dateGroups).flat();
              const coverPhoto = allPhotos[0];
              
              return (
                <motion.div
                  key={month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="cursor-pointer group"
                  onClick={() => setSelectedMonth(month)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-app-surface mb-3 hover:ring-2 hover:ring-app-accent transition-all relative">
                    <img
                      src={coverPhoto.url}
                      alt={month}
                      className="w-full h-full object-cover"
                    />
                    {coverPhoto.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-app-text">{month}</h3>
                    <p className="text-sm text-app-text-muted">{allPhotos.length} items</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <StatusBar itemCount={Object.values(filteredData).flat().length} viewMode="Calendar" />

      {lightboxOpen && (
        <Lightbox
          media={mockPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
