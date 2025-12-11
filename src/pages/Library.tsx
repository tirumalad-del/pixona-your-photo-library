import { useState, useEffect } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { PhotoGrid } from "@/components/PhotoGrid";
import { StatusBar } from "@/components/StatusBar";
import { Button } from "@/components/ui/button";
import { BatchEditDialog } from "@/components/BatchEditDialog";
import { AISearchBar } from "@/components/AISearchBar";
import { initializeAIModels, searchPhotosByAI, isAIReady } from "@/lib/aiDetection";
import { Edit } from "lucide-react";

export default function Library() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiReady, setAiReady] = useState(false);

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

  const displayPhotos = filteredPhotos.length > 0 ? filteredPhotos : photos;

  return (
    <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
      <ViewHeader
        title="Library"
        subtitle="All Photos"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* AI Search Bar */}
      <AISearchBar onSearch={handleAISearch} isAIReady={aiReady} />
      
      {selectionMode && (
        <div className="px-6 py-3 bg-app-surface border-b border-app-border flex items-center gap-3">
          <span className="text-app-text">
            {selectedIds.length} photo{selectedIds.length !== 1 ? 's' : ''} selected
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
            <div className="text-app-muted">Loading photos...</div>
          </div>
        ) : (
          <PhotoGrid 
            photos={displayPhotos}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onPhotoClick={handlePhotoClick}
          />
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
            {selectionMode ? 'Exit Selection' : 'Select Photos'}
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
