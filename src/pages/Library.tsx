import { useState, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { PhotoGrid } from "@/components/PhotoGrid";
import { StatusBar } from "@/components/StatusBar";
import { Button } from "@/components/ui/button";
import { BatchEditDialog } from "@/components/BatchEditDialog";
import { AISearchBar } from "@/components/AISearchBar";
import { initializeAIModels, searchPhotosByAI, isAIReady } from "@/lib/aiDetection";
import { Edit, Image, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPhotosFromBackend } from "../lib/db";

export default function Library() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiReady, setAiReady] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Supported image extensions
  const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  // Supported video extensions
  const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];

  // Load photos from backend
  useEffect(() => {
    const loadPhotos = async () => {
      setLoading(true);
      const backendPhotos = await getPhotosFromBackend();
      setPhotos(backendPhotos);
      setFilteredPhotos(backendPhotos);
      setLoading(false);
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

  // Initialize AI on mount
  useEffect(() => {
    const init = async () => {
      await initializeAIModels();
      setAiReady(isAIReady());
    };
    init();
  }, []);

  // Filter photos by type
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredPhotos(photos);
    } else if (activeTab === "photos") {
      setFilteredPhotos(photos.filter(p => {
        const ext = p.path.toLowerCase().slice(p.path.lastIndexOf('.'));
        return IMAGE_EXTENSIONS.includes(ext);
      }));
    } else if (activeTab === "videos") {
      setFilteredPhotos(photos.filter(p => {
        const ext = p.path.toLowerCase().slice(p.path.lastIndexOf('.'));
        return VIDEO_EXTENSIONS.includes(ext);
      }));
    }
  }, [activeTab, photos]);

  const handleAISearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredPhotos(photos);
      return;
    }
    const results = await searchPhotosByAI(photos, query);
    setFilteredPhotos(results);
  };

  return (
    <div className="flex flex-col h-screen">
      <ViewHeader title="Library">
        <div className="flex gap-2">
          {aiReady && (
            <AISearchBar onSearch={handleAISearch} />
          )}
          {selectedIds.length > 0 && (
            <Button onClick={() => setBatchEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit {selectedIds.length} photos
            </Button>
          )}
        </div>
      </ViewHeader>

      <div className="border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="ml-6">
            <TabsTrigger value="all">All Media</TabsTrigger>
            <TabsTrigger value="photos">
              <Image className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        <TabsContent value={activeTab} className="m-0 h-full">
          <PhotoGrid
            photos={filteredPhotos}
            viewMode={viewMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            selectionMode={selectionMode}
            loading={loading}
          />
        </TabsContent>
      </div>

      <BatchEditDialog
        open={batchEditOpen}
        onOpenChange={setBatchEditOpen}
        photoIds={selectedIds}
        onComplete={() => {
          setSelectedIds([]);
          setSelectionMode(false);
        }}
      />

      <StatusBar totalPhotos={photos.length} selectedCount={selectedIds.length} />
    </div>
  );
}
