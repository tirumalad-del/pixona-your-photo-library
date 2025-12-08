import { useEffect, useRef, useState } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { mockPhotos } from "@/lib/mockData";
import { Lightbox } from "@/components/Lightbox";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { MapPin } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Places() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Filter photos with location data
  const photosWithLocation = mockPhotos.filter(photo => photo.location);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([40, -10], 3);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Group photos by location
    const locationGroups = photosWithLocation.reduce((acc, photo) => {
      const key = photo.location || '';
      if (!acc[key]) acc[key] = [];
      acc[key].push(photo);
      return acc;
    }, {} as Record<string, typeof mockPhotos>);

    // Add marker cluster support
    const markers = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Add markers for each location
    Object.entries(locationGroups).forEach(([location, photos]) => {
      // Generate random coordinates for demo (in production, parse from EXIF)
      const lat = 20 + Math.random() * 40;
      const lng = -20 + Math.random() * 80;

      const marker = L.marker([lat, lng]);
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'space-y-2';
      popupContent.innerHTML = `
        <h3 class="font-semibold text-app-text">${location}</h3>
        <p class="text-sm text-app-text-muted">${photos.length} photo${photos.length > 1 ? 's' : ''}</p>
        <div class="grid grid-cols-3 gap-1 mt-2">
          ${photos.slice(0, 6).map(photo => `
            <img 
              src="${photo.url}" 
              alt="${location}"
              class="w-16 h-16 object-cover rounded cursor-pointer hover:ring-2 hover:ring-app-accent"
              data-photo-id="${photo.id}"
            />
          `).join('')}
        </div>
      `;

      // Add click handlers to thumbnails
      popupContent.querySelectorAll('img').forEach((img) => {
        img.addEventListener('click', () => {
          const photoId = img.getAttribute('data-photo-id');
          const index = mockPhotos.findIndex(p => p.id === photoId);
          if (index !== -1) {
            setLightboxIndex(index);
            setLightboxOpen(true);
          }
        });
      });

      marker.bindPopup(popupContent);
      markers.addLayer(marker);
    });

    map.addLayer(markers);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Places"
        subtitle="Photos organized by location"
      />
      
      {photosWithLocation.length > 0 ? (
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="absolute inset-0 z-0"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-24 h-24 rounded-full bg-app-surface flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-12 h-12 text-app-accent" />
            </div>
            <h3 className="text-xl font-semibold text-app-text mb-2">
              No Location Data
            </h3>
            <p className="text-app-text-muted">
              Photos with GPS/EXIF location data will appear on this interactive map.
            </p>
          </div>
        </div>
      )}

      <StatusBar itemCount={photosWithLocation.length} viewMode="Map" />

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
