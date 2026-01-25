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

  // Load photos from database on mount
  useEffect(() => {
    const loadPhotos = async () => {
      if (window.electron && window.electron.getAllPhotos) {
        setLoading(true);
        const result = await window.electron.getAllPhotos();
        if (result.success && result.photos) {
          setPhotos(result.photos);
          setFilteredPhotos(result.photos);
        }
        setLoading(false);
      }
    };
    loadPhotos();
  }, []);

  // Initialize AI models on mount
  useEffect(() => {
    initializeAIModels().then(success => {
      setAiReady(success);
    });
  }, []);

  const handlePhotoClick = (id: string) => {
    if (selectionMode) {
      setSelectedIds(prev => 
        prev.includes(id) 
          ? prev.filter(i => i !== id)
          : [...prev, id]
      );
    }
  };

  const handleBatchEdit = () => {
    if (selectedIds.length > 0) {
      setBatchEditOpen(true);
    }
  };

  const handleBatchEditComplete = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };

  // AI Search handler
  const handleAISearch = async (query: string, filter?: string) => {
    if (!query.trim()) {
      setFilteredPhotos(photos);
      return;
    }

    console.log(`🔍 Searching for: "${query}" with filter: ${filter}`);
    const results = await searchPhotosByAI(photos, query, filter as any);
    setFilteredPhotos(results);
    console.log(`✅ Found ${results.length} results`);
  };

  // Filter photos by type
  const getFilteredMedia = () => {
    const basePhotos = filteredPhotos.length > 0 ? filteredPhotos : photos;
    
    if (activeTab === "photos") {
      return basePhotos.filter(photo => 
        IMAGE_EXTENSIONS.includes(photo.extension?.toLowerCase() || '')
      );
    } else if (activeTab === "videos") {
      return basePhotos.filter(photo => 
        VIDEO_EXTENSIONS.includes(photo.extension?.toLowerCase() || '')
      );
    }
    return basePhotos; // "all" tab
  };

  const displayPhotos = getFilteredMedia();
  const photoCount = photos.filter(p => IMAGE_EXTENSIONS.includes(p.extension?.toLowerCase() || '')).length;
  const videoCount = photos.filter(p => VIDEO_EXTENSIONS.includes(p.extension?.toLowerCase() || '')).length;

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Library"
        subtitle="All Photos & Videos"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* AI Search Bar */}
      <AISearchBar onSearch={handleAISearch} isAIReady={aiReady} />
      
      {/* Media Type Tabs */}
      <div className="px-6 py-3 bg-app-bg border-b border-app-border">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              All ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Photos ({photoCount})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos ({videoCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {selectionMode && (
        <div className="px-6 py-3 bg-app-surface border-b border-app-border flex items-center gap-3">
          <span className="text-app-text">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            onClick={handleBatchEdit}
            disabled={selectedIds.length === 0}
            className="bg-app-accent hover:bg-app-accent-hover"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Metadata
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-app-muted">Loading media...</div>
          </div>
        ) : displayPhotos.length > 0 ? (
          <PhotoGrid 
            photos={displayPhotos}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onPhotoClick={handlePhotoClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <h3 className="text-xl font-semibold text-app-text mb-2">
                No {activeTab === "all" ? "Media" : activeTab === "photos" ? "Photos" : "Videos"} Found
              </h3>
              <p className="text-app-text-muted">
                {activeTab === "all" 
                  ? "Scan your drives to import photos and videos."
                  : `No ${activeTab} found in your library. Try scanning your drives.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      <StatusBar 
        itemCount={displayPhotos.length} 
        viewMode="Grid"
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectionMode(!selectionMode)}
          >
            {selectionMode ? 'Exit Selection' : 'Select Items'}
          </Button>
        }
      />

      <BatchEditDialog
        open={batchEditOpen}
        onOpenChange={setBatchEditOpen}
        selectedPhotoIds={selectedIds}
        onComplete={handleBatchEditComplete}
      />
    </div>
  );
}
