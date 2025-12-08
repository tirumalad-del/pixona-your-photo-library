import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { soundManager } from "@/lib/sounds";
import {
  X,
  Eraser,
  Crop,
  Palette,
  Calendar,
  MapPin,
  FileJson,
  Save,
  RotateCcw,
  Download,
  Maximize,
  Image,
  Sparkles,
  Info,
} from "lucide-react";

interface AIPhotoEditorProps {
  photo: {
    id: string;
    src: string;
    name: string;
    date?: Date;
    location?: string;
    metadata?: Record<string, any>;
  };
  onClose: () => void;
  onSave?: (editedPhoto: Blob, metadata: Record<string, any>) => void;
}

export function AIPhotoEditor({ photo, onClose, onSave }: AIPhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editHistory, setEditHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Edit states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isGrayscale, setIsGrayscale] = useState(false);
  
  // Metadata states
  const [editedDate, setEditedDate] = useState(photo.date?.toISOString().split('T')[0] || '');
  const [editedLocation, setEditedLocation] = useState(photo.location || '');
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>({});

  // Load image onto canvas
  const loadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Save initial state
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setEditHistory([imageData]);
      setHistoryIndex(0);
    };
    img.src = photo.src;
  }, [photo.src]);

  // Apply filters to canvas
  const applyFilters = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || editHistory.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Restore original image data
    ctx.putImageData(editHistory[0], 0, 0);
    
    // Apply CSS-like filters using canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Brightness
      const brightnessMultiplier = brightness / 100;
      r *= brightnessMultiplier;
      g *= brightnessMultiplier;
      b *= brightnessMultiplier;
      
      // Contrast
      const contrastFactor = (contrast / 100 - 0.5) * 2;
      r = ((r / 255 - 0.5) * (1 + contrastFactor) + 0.5) * 255;
      g = ((g / 255 - 0.5) * (1 + contrastFactor) + 0.5) * 255;
      b = ((b / 255 - 0.5) * (1 + contrastFactor) + 0.5) * 255;
      
      // Saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      const satMultiplier = saturation / 100;
      r = gray + (r - gray) * satMultiplier;
      g = gray + (g - gray) * satMultiplier;
      b = gray + (b - gray) * satMultiplier;
      
      // Grayscale
      if (isGrayscale) {
        const grayValue = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = g = b = grayValue;
      }
      
      // Clamp values
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [brightness, contrast, saturation, isGrayscale, editHistory]);

  // Convert to grayscale
  const convertToGrayscale = () => {
    setIsGrayscale(true);
    setSaturation(0);
    soundManager.play('click');
    toast.success("Converted to black & white");
  };

  // Convert to color (restore)
  const convertToColor = () => {
    setIsGrayscale(false);
    setSaturation(100);
    soundManager.play('click');
    toast.success("Restored to color");
  };

  // Reset all edits
  const resetEdits = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setIsGrayscale(false);
    soundManager.play('click');
    toast.info("Edits reset");
  };

  // Save edited photo
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsProcessing(true);
    soundManager.play('click');
    
    try {
      applyFilters();
      
      canvas.toBlob((blob) => {
        if (blob && onSave) {
          const metadata = {
            date: editedDate,
            location: editedLocation,
            ...customMetadata,
            editedAt: new Date().toISOString(),
            filters: {
              brightness,
              contrast,
              saturation,
              isGrayscale,
            },
          };
          onSave(blob, metadata);
          soundManager.play('success');
          toast.success("Photo saved successfully");
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Save error:', error);
      soundManager.play('error');
      toast.error("Failed to save photo");
      setIsProcessing(false);
    }
  };

  // Download edited photo
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    applyFilters();
    
    const link = document.createElement('a');
    link.download = `edited_${photo.name}`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    
    soundManager.play('success');
    toast.success("Photo downloaded");
  };

  // Initialize canvas on mount
  useState(() => {
    loadImage();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex"
    >
      {/* Main editing area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
        
        {/* Canvas preview */}
        <div className="relative max-w-full max-h-full overflow-hidden rounded-lg shadow-2xl">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[80vh] object-contain"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${isGrayscale ? 'grayscale(100%)' : ''}`,
            }}
          />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            </div>
          )}
        </div>
        
        {/* Photo name */}
        <div className="absolute bottom-4 left-4 text-white/80 text-sm">
          {photo.name}
        </div>
      </div>
      
      {/* Side panel */}
      <div className="w-80 bg-app-surface border-l border-app-border flex flex-col">
        <div className="p-4 border-b border-app-border">
          <h2 className="text-lg font-semibold text-app-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-app-accent" />
            AI Photo Editor
          </h2>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="edit" className="flex-1">
              <Palette className="w-4 h-4 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex-1">
              <Info className="w-4 h-4 mr-1" />
              Info
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 p-4">
            <TabsContent value="edit" className="mt-0 space-y-6">
              {/* Color adjustments */}
              <div className="space-y-4">
                <Label className="text-app-text font-medium">Adjustments</Label>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-app-text-muted">Brightness</span>
                      <span className="text-app-text">{brightness}%</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      onValueChange={([v]) => setBrightness(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-app-text-muted">Contrast</span>
                      <span className="text-app-text">{contrast}%</span>
                    </div>
                    <Slider
                      value={[contrast]}
                      onValueChange={([v]) => setContrast(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-app-text-muted">Saturation</span>
                      <span className="text-app-text">{saturation}%</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      onValueChange={([v]) => setSaturation(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="space-y-3">
                <Label className="text-app-text font-medium">Quick Actions</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={convertToGrayscale}
                    className="justify-start"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    B&W
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={convertToColor}
                    className="justify-start"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Color
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetEdits}
                    className="justify-start"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Resize feature coming soon")}
                    className="justify-start"
                  >
                    <Maximize className="w-4 h-4 mr-2" />
                    Resize
                  </Button>
                </div>
              </div>
              
              {/* AI features notice */}
              <div className="p-3 bg-app-accent/10 rounded-lg border border-app-accent/20">
                <p className="text-sm text-app-text-muted">
                  <Sparkles className="w-4 h-4 inline mr-1 text-app-accent" />
                  More AI features like Magic Eraser and auto-enhance require online mode in Settings.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="metadata" className="mt-0 space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label className="text-app-text flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Taken
                </Label>
                <input
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-app-bg border border-app-border text-app-text"
                />
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label className="text-app-text flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  placeholder="Enter location..."
                  className="w-full px-3 py-2 rounded-md bg-app-bg border border-app-border text-app-text"
                />
              </div>
              
              {/* Raw metadata display */}
              <div className="space-y-2">
                <Label className="text-app-text flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  Raw Metadata
                </Label>
                <pre className="p-3 bg-app-bg rounded-md text-xs text-app-text-muted overflow-auto max-h-40 border border-app-border">
                  {JSON.stringify(photo.metadata || { info: "No metadata available" }, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </ScrollArea>
          
          {/* Action buttons */}
          <div className="p-4 border-t border-app-border space-y-2">
            <Button
              className="w-full bg-app-accent hover:bg-app-accent-hover"
              onClick={handleSave}
              disabled={isProcessing}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownload}
              disabled={isProcessing}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
}
