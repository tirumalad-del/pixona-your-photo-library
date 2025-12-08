import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Tag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { soundManager } from "@/lib/sounds";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhotoIds: string[];
  onComplete: () => void;
}

export function BatchEditDialog({ open, onOpenChange, selectedPhotoIds, onComplete }: BatchEditDialogProps) {
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selectedPhotoIds.length === 0) {
      toast.error("No photos selected");
      return;
    }

    setSaving(true);
    soundManager.play('click');

    try {
      const updates: any = {};

      if (date) {
        updates.created = date;
      }

      if (location.trim()) {
        updates.location = {
          name: location,
          lat: 0, // Would need geocoding service
          lng: 0,
        };
      }

      if (tags.trim()) {
        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
        updates.tags = tagArray;
      }

      if (Object.keys(updates).length > 0) {
        await db.updatePhotos(selectedPhotoIds, updates);
        soundManager.play('success');
        toast.success(`Updated ${selectedPhotoIds.length} photos`);
        onComplete();
        onOpenChange(false);
      } else {
        toast.info("No changes to save");
      }
    } catch (error) {
      console.error('Batch edit error:', error);
      soundManager.play('error');
      toast.error("Failed to update photos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-app-surface border-app-border">
        <DialogHeader>
          <DialogTitle className="text-app-text">Batch Edit Metadata</DialogTitle>
          <DialogDescription className="text-app-text-muted">
            Edit metadata for {selectedPhotoIds.length} selected photo{selectedPhotoIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Change Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left bg-app-bg border-app-border"
                >
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-app-surface border-app-border">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              placeholder="Enter location name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-app-bg border-app-border text-app-text"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <Input
              placeholder="Enter tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-app-bg border-app-border text-app-text"
            />
            <p className="text-xs text-app-text-muted">
              Separate tags with commas (e.g., vacation, beach, summer)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-app-accent hover:bg-app-accent-hover"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
