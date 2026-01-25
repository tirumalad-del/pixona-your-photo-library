import { useEffect, useRef, useState } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { StatusBar } from "@/components/StatusBar";
import { Lightbox } from "@/components/Lightbox";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { MapPin } from "lucide-react";
import { getPhotosFromBackend } from "@/lib/db";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function Places() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosWithLocation, setPhotosWithLocation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load photos with GPS coordinates from backend database
  useEffect(() => {
    async function loadPhotos() {
      try {
        setLoading(true);
        const allPhotos = await getPhotosFromBackend();
        
        // Filter photos that have GPS location data
        const withLocation = allPhotos.filter(
          (p) => p.location && p.location.lat && p.location.lng
        );
        
        setPhotos(allPhotos);
        setPhotosWithLocation(withLocation);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPhotos();
    
    // Listen for scan completion to reload data
    if (window.electron) {
      const unsubscribe = window.electron.onScanProgress((data: any) => {
        if (data.phase === 'idle' && data.percent === 100) {
          // Scan complete - reload data
          loadPhotos();
        }
      });
      
      return () => unsubscribe();
    }
  }, []);

  // Initialize map when photos are loaded
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || photosWithLocation.length === 0) return;

    // Initialize map centered on first photo location
    const firstPhoto = photosWithLocation[0];
    const map = L.map(mapRef.current).setView(
      [firstPhoto.location.lat, firstPhoto.location.lng],
      10
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker cluster group
    const markers = L.markerClusterGroup();

    // Add markers for each photo with location
    photosWithLocation.forEach((photo, idx) => {
      if (photo.location && photo.location.lat && photo.location.lng) {
        const marker = L.marker([photo.location.lat, photo.location.lng]);
        
        marker.bindPopup(`
          <div style="text-align: center;">
            <strong>${photo.name}</strong><br/>
            <small>${new Date(photo.created).toLocaleDateString()}</small>
          </div>
        `);
        
        marker.on('click', () => {
          const photoIndex = photos.findIndex(p => p.id === photo.id);
          if (photoIndex !== -1) {
            setLightboxIndex(photoIndex);
            setLightboxOpen(true);
          }
        });
        
        markers.addLayer(marker);
      }
    });

    map.addLayer(markers);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [photosWithLocation]);

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Places"
        subtitle={`${photosWithLocation.length} photos with location data`}
      />
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-app-text-muted">Loading map data...</div>
        </div>
      ) : photosWithLocation.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-app-text-muted">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No photos with GPS location data found</p>
            <p className="text-sm mt-2">Import photos with EXIF GPS data to see them on the map</p>
          </div>
        </div>
      ) : (
        <div
          ref={mapRef}
          className="flex-1 w-full"
          style={{ minHeight: '400px' }}
        />
      )}

      <StatusBar itemCount={photosWithLocation.length} viewMode="Map" />
      
      {lightboxOpen && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
